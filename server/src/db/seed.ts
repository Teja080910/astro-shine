import 'dotenv/config';
import { db, schema } from './connection';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('🌱 Starting database seeding...');

  const defaultPassword = 'Password123';
  const hashedPassword = await hashPassword(defaultPassword);

  // 1. Seed Admin
  const adminEmail = 'admin@astroshine.com';
  const existingAdmin = await db.query.admins.findFirst({
    where: eq(schema.admins.email, adminEmail),
  });

  if (!existingAdmin) {
    await db.insert(schema.admins).values({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'super_admin',
      theme: 'dark',
    });
    console.log('✅ Default Admin seeded.');
  } else {
    console.log('ℹ️ Admin already exists, skipping.');
  }

  // 2. Seed Astrologer
  const astrologerEmail = 'astrologer@astroshine.com';
  const existingAstrologer = await db.query.astrologers.findFirst({
    where: eq(schema.astrologers.email, astrologerEmail),
  });

  if (!existingAstrologer) {
    await db.insert(schema.astrologers).values({
      name: 'Astro Guru',
      email: astrologerEmail,
      phone: '9876543210',
      password: hashedPassword,
      experience: 5,
      specialization: ['Vedic', 'Tarot'],
      languages: ['English', 'Hindi'],
      skills: ['Kundli Reading', 'Palmistry'],
      pricePerMin: '15.00',
      rating: '4.80',
      totalReviews: 12,
      totalCalls: 45,
      verificationStatus: 'approved',
      onlineStatus: 'online',
      onboardingCompleted: true,
      theme: 'dark',
    });
    console.log('✅ Default Astrologer seeded.');
  } else {
    console.log('ℹ️ Astrologer already exists, skipping.');
  }

  // 3. Seed User
  const userEmail = 'user@astroshine.com';
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, userEmail),
  });

  if (!existingUser) {
    await db.insert(schema.users).values({
      name: 'John Doe',
      email: userEmail,
      phone: '9998887776',
      password: hashedPassword,
      onboardingCompleted: true,
      theme: 'dark',
    });
    console.log('✅ Default User seeded.');
  } else {
    console.log('ℹ️ User already exists, skipping.');
  }

  // 4. Seed App Settings (Privacy Policy, Terms & Conditions, About App)
  const settings = [
    {
      key: 'privacy_policy',
      value: { content: 'This is the Privacy Policy for Astro Shine. We value your privacy and protect your personal information.' },
      description: 'Privacy Policy content for the mobile app.',
    },
    {
      key: 'terms_conditions',
      value: { content: 'These are the Terms and Conditions for Astro Shine. By accessing this application, you agree to comply with our terms.' },
      description: 'Terms & Conditions content for the mobile app.',
    },
    {
      key: 'about_app',
      value: { content: 'Astro Shine is your premium portal for astrology services, connecting you with verified Vedic astrologers, Tarot readers, and Numerologists instantly.' },
      description: 'About App information for the mobile app.',
    },
  ];

  for (const setting of settings) {
    const existingSetting = await db.query.appSettings.findFirst({
      where: eq(schema.appSettings.key, setting.key),
    });

    if (!existingSetting) {
      await db.insert(schema.appSettings).values({
        key: setting.key,
        value: setting.value,
        description: setting.description,
      });
      console.log(`✅ App setting "${setting.key}" seeded.`);
    } else {
      console.log(`ℹ️ App setting "${setting.key}" already exists, skipping.`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
