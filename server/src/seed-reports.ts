import 'dotenv/config';
import { db, schema } from './db/connection';
import { eq, like } from 'drizzle-orm';

const MARKER = '[demo]';
const day = 24 * 60 * 60 * 1000;

const daysAgo = (n: number) => new Date(Date.now() - n * day);

async function seedReports() {
  console.log('🌱 Seeding demo reports...\n');

  const users = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.role, 'user'))
    .limit(8);

  const astrologers = await db
    .select({ id: schema.astrologers.userId, name: schema.users.name })
    .from(schema.astrologers)
    .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
    .limit(6);

  const [admin] = await db
    .select({ id: schema.admins.userId })
    .from(schema.admins)
    .limit(1);

  if (users.length < 3 || astrologers.length < 2) {
    console.error(
      '❌ Not enough local data. Seed users/astrologers first (npm run seed, npm run seed:user).',
    );
    process.exit(1);
  }

  const removed = await db
    .delete(schema.reports)
    .where(like(schema.reports.description, `${MARKER}%`))
    .returning({ id: schema.reports.id });
  if (removed.length > 0) {
    console.log(`♻️  Removed ${removed.length} previous demo report(s)`);
  }

  const u = users;
  const a = astrologers;

  const rows: (typeof schema.reports.$inferInsert)[] = [
    {
      reporterId: u[0].id,
      reporterRole: 'user',
      reportedAstrologerId: a[0].id,
      reason: 'fake_profile',
      description: `${MARKER} This astrologer's profile photo and credentials look fake.`,
      status: 'pending',
      createdAt: daysAgo(0),
    },
    {
      reporterId: u[1].id,
      reporterRole: 'user',
      reportedAstrologerId: a[1].id,
      reason: 'harassment',
      description: `${MARKER} Kept sending repeated messages after I asked them to stop.`,
      status: 'pending',
      createdAt: daysAgo(1),
    },
    {
      reporterId: u[2] ? u[2].id : u[0].id,
      reporterRole: 'user',
      reportedUserId: u[0].id,
      reason: 'inappropriate',
      description: `${MARKER} Used abusive language during the chat session.`,
      status: 'pending',
      createdAt: daysAgo(2),
    },
    {
      reporterId: u[0].id,
      reporterRole: 'user',
      reportedUserId: u[1].id,
      reason: 'spam',
      description: `${MARKER} Sending promotional links in every conversation.`,
      status: 'reviewed',
      resolvedBy: admin?.id ?? null,
      resolvedAt: daysAgo(1),
      createdAt: daysAgo(3),
    },
    {
      reporterId: a[0].id,
      reporterRole: 'astrologer',
      reportedUserId: u[1].id,
      reason: 'harassment',
      description: `${MARKER} User became abusive after a negative reading.`,
      status: 'pending',
      createdAt: daysAgo(4),
    },
    {
      reporterId: a[1].id,
      reporterRole: 'astrologer',
      reportedUserId: u[0].id,
      reason: 'other',
      description: `${MARKER} Repeatedly booked and cancelled sessions at the last minute.`,
      status: 'reviewed',
      resolvedBy: admin?.id ?? null,
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(6),
    },
    {
      reporterId: u[1].id,
      reporterRole: 'user',
      reportedAstrologerId: a[0].id,
      reason: 'inappropriate',
      description: `${MARKER} Made personal remarks unrelated to the consultation.`,
      status: 'pending',
      createdAt: daysAgo(7),
    },
    {
      reporterId: u[3] ? u[3].id : u[0].id,
      reporterRole: 'user',
      reportedAstrologerId: a[1].id,
      reason: 'spam',
      description: `${MARKER} Pushing paid remedies and products in chat.`,
      status: 'pending',
      createdAt: daysAgo(9),
    },
    {
      reporterId: u[2] ? u[2].id : u[1].id,
      reporterRole: 'user',
      reportedUserId: u[3] ? u[3].id : u[1].id,
      reason: 'other',
      description: `${MARKER} Suspected duplicate account used to post fake reviews.`,
      status: 'reviewed',
      resolvedBy: admin?.id ?? null,
      resolvedAt: daysAgo(3),
      createdAt: daysAgo(12),
    },
    {
      reporterId: u[4] ? u[4].id : u[0].id,
      reporterRole: 'user',
      reportedAstrologerId: a[0].id,
      reason: 'fake_profile',
      description: `${MARKER} Claims 20 years experience but cannot answer basic questions.`,
      status: 'pending',
      createdAt: daysAgo(14),
    },
  ];

  const created = await db.insert(schema.reports).values(rows).returning({
    id: schema.reports.id,
  });

  console.log(`✅ Inserted ${created.length} demo reports (${MARKER})`);
  console.log(`   Pending: ${rows.filter((r) => r.status === 'pending').length}`);
  console.log(`   Reviewed: ${rows.filter((r) => r.status === 'reviewed').length}`);
  console.log(`\n   View them in the admin panel: /reports`);
  process.exit(0);
}

seedReports().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
