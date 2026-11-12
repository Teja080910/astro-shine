#!/usr/bin/env node
/**
 * Baseline the drizzle migration tracker.
 *
 * Problem this solves
 * -------------------
 * This repo has two migration paths that track their work differently:
 *
 *   - `deploy.sh` applies `src/db/migrations/*.sql` with psql and records each
 *     tag in `public.schema_migrations`.
 *   - `drizzle-kit migrate` (used by `npm run db:migrate`) records progress in
 *     `drizzle.__drizzle_migrations` and ignores `schema_migrations` entirely.
 *
 * On a database that was created by `deploy.sh`, `drizzle.__drizzle_migrations`
 * is empty, so drizzle believes nothing has been applied and replays migration
 * 0000 from scratch. The first statement is
 *   CREATE TYPE "user_role" AS ENUM (...)
 * which fails because the type already exists, and drizzle exits 1 without
 * printing the SQL error.
 *
 * What this script does
 * ---------------------
 * Before `drizzle-kit migrate` runs, if the drizzle tracker is empty but the
 * database is already populated AND `schema_migrations` lists applied tags,
 * copy those entries into the drizzle tracker using the same hashes and
 * timestamps drizzle itself would have written. drizzle then treats them as
 * done and only applies genuinely new migrations.
 *
 * Safety rules
 * ------------
 *   - Never deletes or alters application tables.
 *   - Only ever creates `drizzle.__drizzle_migrations` and inserts bookkeeping
 *     rows, and only when that tracker is completely empty.
 *   - If the tracker already has rows it does nothing, so local dev databases
 *     and repeat runs are untouched.
 *   - If the database is empty (a genuinely fresh install) it does nothing and
 *     lets drizzle apply every migration in order.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const serverDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(serverDir, 'src', 'db', 'migrations');
const journalPath = path.join(migrationsDir, 'meta', '_journal.json');

function log(msg) {
  console.log(`  drizzle baseline: ${msg}`);
}

function loadEnv() {
  // drizzle.config.ts uses dotenv; mirror that so DATABASE_URL matches.
  try {
    require('dotenv').config({
      path: path.join(serverDir, '.env'),
      quiet: true,
    });
  } catch {
    /* dotenv is optional here; the URL may come from the environment */
  }
  return process.env.DATABASE_URL;
}

/** Read the journal and reproduce drizzle's hash exactly. */
function readMigrations() {
  if (!fs.existsSync(journalPath)) {
    throw new Error(`missing migration journal: ${journalPath}`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  return journal.entries.map((entry) => {
    const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
    const query = fs.readFileSync(sqlPath, 'utf8');
    return {
      tag: entry.tag,
      folderMillis: entry.when,
      // Same as drizzle-orm/migrator: sha256 over the raw file contents.
      hash: crypto.createHash('sha256').update(query).digest('hex'),
    };
  });
}

async function main() {
  const url = loadEnv();
  if (!url) {
    // Let drizzle-kit report this; it has a clearer message.
    log('DATABASE_URL not set — skipping (drizzle-kit will report it)');
    return;
  }

  const migrations = readMigrations();

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch {
    log('pg driver not resolvable — skipping (preflight checks this)');
    return;
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
  } catch (e) {
    // A genuinely unreachable database should surface from drizzle-kit, which
    // prints connection errors. Do not mask it with a baseline failure.
    log(`database unreachable — skipping baseline (${e.message})`);
    return;
  }

  try {
    // --- does the drizzle tracker already exist with rows? ---------------
    const tracker = await client.query(
      `select to_regclass('drizzle.__drizzle_migrations') as t`,
    );
    const trackerExists = Boolean(tracker.rows[0]?.t);

    if (trackerExists) {
      const { rows } = await client.query(
        `select count(*)::int as n from drizzle.__drizzle_migrations`,
      );
      if ((rows[0]?.n ?? 0) > 0) {
        log(`tracker already has ${rows[0].n} row(s) — nothing to do`);
        return;
      }
    }

    // --- is this an existing database or a fresh one? ---------------------
    const users = await client.query(
      `select to_regclass('public.users') as t`,
    );
    if (!users.rows[0]?.t) {
      log('database is empty — leaving all migrations for drizzle to apply');
      return;
    }

    // --- what has schema_migrations already applied? ----------------------
    const legacy = await client.query(
      `select to_regclass('public.schema_migrations') as t`,
    );
    if (!legacy.rows[0]?.t) {
      // Populated DB from some other tool; cannot infer safely.
      log(
        'database has tables but no schema_migrations — not baselining automatically',
      );
      log(
        'if the schema is already correct, seed drizzle.__drizzle_migrations manually',
      );
      return;
    }

    const applied = await client.query(
      `select name from public.schema_migrations`,
    );
    const appliedTags = new Set(applied.rows.map((r) => r.name));

    const toInsert = migrations.filter((m) => appliedTags.has(m.tag));

    if (toInsert.length === 0) {
      log('schema_migrations lists no known journal tags — nothing to baseline');
      return;
    }

    // --- write the baseline ----------------------------------------------
    await client.query(`create schema if not exists drizzle`);
    await client.query(`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `);

    // Guard again inside the same connection: another deploy may have raced.
    const again = await client.query(
      `select count(*)::int as n from drizzle.__drizzle_migrations`,
    );
    if ((again.rows[0]?.n ?? 0) > 0) {
      log('tracker was filled concurrently — nothing to do');
      return;
    }

    for (const m of toInsert) {
      await client.query(
        `insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)`,
        [m.hash, m.folderMillis],
      );
    }

    log(
      `baselined ${toInsert.length} of ${migrations.length} migration(s) from schema_migrations`,
    );

    const skipped = migrations.length - toInsert.length;
    if (skipped > 0) {
      log(`${skipped} newer migration(s) will be applied by drizzle-kit`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => {
  // Never block a deploy on the baseline helper: if it fails unexpectedly,
  // let drizzle-kit run and report its own (more actionable) error.
  console.error(`  drizzle baseline: skipped after error — ${e.message}`);
});
