import 'dotenv/config';
import { db, schema } from './db/connection';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@astroshine.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

async function seedAdmin() {
  console.log('🌱 Seeding admin user...\n');
  console.log(`   Name:     ${ADMIN_NAME}`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, ADMIN_EMAIL),
  });

  if (existing) {
    if (existing.role !== 'admin') {
      console.error(
        `❌ User with email ${ADMIN_EMAIL} exists but has role '${existing.role}', not touching it.`,
      );
      process.exit(1);
    }

    const adminProfile = await db.query.admins.findFirst({
      where: eq(schema.admins.userId, existing.id),
    });
    if (!adminProfile) {
      await db
        .insert(schema.admins)
        .values({ userId: existing.id, role: 'admin' });
      console.log('✅ Missing admin profile created');
    } else {
      console.log('⚠️ Admin profile already exists, skipping');
    }

    let wallet = await db.query.wallets.findFirst({
      where: eq(schema.wallets.adminId, existing.id),
    });
    if (!wallet) {
      const [created] = await db
        .insert(schema.wallets)
        .values({ userId: existing.id, adminId: existing.id })
        .returning();
      wallet = created;
      console.log('✅ Admin wallet created');
    } else {
      console.log('⚠️ Admin wallet already exists, skipping');
    }

    console.log(
      `\n✅ Admin user already exists: ${existing.id} — no duplicate created.`,
    );
    process.exit(0);
  }

  const hashed = hashPassword(ADMIN_PASSWORD);

  const [user] = await db
    .insert(schema.users)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'admin',
      authProvider: 'email',
      onboardingCompleted: true,
    })
    .returning();

  await db.insert(schema.admins).values({ userId: user.id, role: 'admin' });
  console.log('✅ Admin profile created');

  await db.insert(schema.wallets).values({ userId: user.id, adminId: user.id });
  console.log('✅ Admin wallet created');

  console.log(`\n✅ Admin created: ${user.id}`);
  console.log(`   Login with: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
