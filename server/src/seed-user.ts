import 'dotenv/config';
import { db, schema } from './db/connection';
import * as crypto from 'crypto';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

async function seedUser() {
  const [type, name, email, ...rest] = process.argv.slice(2);

  if (!type || !['user', 'u', 'astrologer', 'a', 'admin', 'ad'].includes(type)) {
    console.error('❌ Usage: npm run seed:user <type> <name> <email> [password] [phone] [...extra]');
    console.error('   type: user(u) | astrologer(a) | admin(ad)');
    process.exit(1);
  }
  if (!name) { console.error('❌ --name required'); process.exit(1); }
  if (!email) { console.error('❌ --email required'); process.exit(1); }

  const password = rest[0] || crypto.randomUUID();
  const phone = rest[1] || null;

  const extraArgs: Record<string, string> = {};
  for (let i = 2; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const key = rest[i].slice(2);
      const val = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : 'true';
      extraArgs[key] = val;
    }
  }

  console.log('🌱 Creating user...\n');
  console.log(`   Type:      ${type}`);
  console.log(`   Name:      ${name}`);
  console.log(`   Email:     ${email}`);
  console.log(`   Phone:     ${phone || '(none)'}`);
  console.log(`   Password:  ${password}\n`);

  const hashed = hashPassword(password);

  if (type === 'user' || type === 'u') {
    const [user] = await db.insert(schema.users).values({
      name,
      email,
      phone,
      password: hashed,
      role: 'user',
      authProvider: 'email',
    }).returning();
    await db.insert(schema.wallets).values({ userId: user.id }).onConflictDoNothing();
    console.log(`✅ User created: ${user.id}`);
  } else if (type === 'astrologer' || type === 'a') {
    const experience = parseInt(extraArgs.experience || extraArgs.exp || '5', 10);
    const specialization = (extraArgs.specialization || extraArgs.spec || 'Vedic').split(',');
    const languages = (extraArgs.languages || extraArgs.lang || 'Hindi,English').split(',');
    const skills = (extraArgs.skills || extraArgs.sk || 'Birth Chart,Predictions').split(',');
    const pricePerMin = extraArgs.price || extraArgs.pr || '10';
    const chatPrice = extraArgs.chat || '8';
    const audioPrice = extraArgs.audio || '12';
    const videoPrice = extraArgs.video || '15';

    const [user] = await db.insert(schema.users).values({
      name,
      email,
      phone,
      password: hashed,
      role: 'astrologer',
      authProvider: 'email',
    }).returning();

    await db.insert(schema.astrologers).values({
      userId: user.id,
      experience,
      specialization,
      languages,
      skills,
      pricePerMin,
      chatPricePerMin: chatPrice,
      audioCallPricePerMin: audioPrice,
      videoCallPricePerMin: videoPrice,
      verificationStatus: extraArgs.verified === 'true' ? 'approved' : 'pending',
    });

    console.log(`✅ Astrologer created: ${user.id}`);

    if (extraArgs.wallet !== 'false') {
      await db.insert(schema.wallets).values({ astrologerId: user.id, balance: '0' });
      console.log('✅ Wallet created');
    }
    if (extraArgs.commission !== 'false') {
      await db.insert(schema.commissions).values({
        astrologerId: user.id,
        type: 'percentage',
        value: extraArgs.commissionVal || '20',
        minAmount: '10',
        maxCap: '500',
      });
      console.log('✅ Commission created');
    }
  } else if (type === 'admin' || type === 'ad') {
    const [user] = await db.insert(schema.users).values({
      name,
      email,
      password: hashed,
      role: 'admin',
      authProvider: 'email',
    }).returning();

    await db.insert(schema.admins).values({
      userId: user.id,
      role: extraArgs.role || 'admin',
    });
    await db.insert(schema.wallets).values({ userId: user.id, adminId: user.id }).onConflictDoNothing();
    console.log(`✅ Admin created: ${user.id} (${extraArgs.role || 'admin'})`);
  }

  process.exit(0);
}

seedUser().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
