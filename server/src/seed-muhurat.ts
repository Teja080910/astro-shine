import 'dotenv/config';
import { db, schema } from './db/connection';
import { eq, and } from 'drizzle-orm';

async function seedMuhurat() {
  console.log('🌱 Seeding Muhurat data...\n');

  const categories = [
    { name: 'Marriage Muhurat', description: 'Auspicious dates/times for weddings' },
    { name: 'Housewarming Muhurat', description: 'Auspicious timing for Griha Pravesh' },
    { name: 'Bhoomi Pujan Muhurat', description: 'Auspicious timing for ground-breaking / land worship' },
    { name: 'Naming Ceremony Muhurat', description: 'Auspicious timing for Naamkaran' },
    { name: 'Mundan Muhurat', description: 'Auspicious timing for first haircut ceremony' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    let existing = await db.query.muhuratCategories.findFirst({
      where: eq(schema.muhuratCategories.name, cat.name)
    });
    if (!existing) {
      const [newCat] = await db.insert(schema.muhuratCategories).values({
        name: cat.name,
        description: cat.description,
        isActive: true,
      }).returning();
      existing = newCat;
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      console.log(`⚠️ Category already exists: ${cat.name}`);
    }
    createdCategories.push(existing);
  }

  const astrologer = await db.query.astrologers.findFirst();
  const createdBy = astrologer?.userId || null;

  const entries = [
    {
      categoryId: createdCategories[0].id,
      name: 'Anand Vivah Muhurat',
      date: '2026-11-23',
      time: '10:30:00',
      description: 'Highly auspicious timing for marriage under Rohini Nakshatra.',
      createdBy,
    },
    {
      categoryId: createdCategories[1].id,
      name: 'Griha Pravesh Muhurat',
      date: '2026-12-05',
      time: '08:15:00',
      description: 'Auspicious time for moving into a new home.',
      createdBy,
    },
    {
      categoryId: createdCategories[2].id,
      name: 'New Office Bhoomi Pujan',
      date: '2026-10-18',
      time: '09:45:00',
      description: 'Worship for business success and peace.',
      createdBy,
    }
  ];

  for (const entry of entries) {
    const existing = await db.query.muhurat.findFirst({
      where: and(eq(schema.muhurat.date, entry.date), eq(schema.muhurat.time, entry.time))
    });
    if (!existing) {
      await db.insert(schema.muhurat).values(entry);
      console.log(`✅ Entry created: ${entry.name} at ${entry.date} ${entry.time}`);
    } else {
      console.log(`⚠️ Entry already exists at ${entry.date} ${entry.time}`);
    }
  }

  console.log('\n🎉 Muhurat seeding complete!');
  process.exit(0);
}

seedMuhurat().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
