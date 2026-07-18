import 'dotenv/config';
import { db, schema } from './db/connection';
import { eq, and } from 'drizzle-orm';

const formatDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

async function seedMuhuratNew() {
  console.log('🌱 Seeding Dynamic Current Muhurat data...\n');

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
  const createdBy = astrologer?.id || null;

  const entries = [
    {
      categoryId: createdCategories[0].id,
      name: 'Vivah Shubh Muhurat (Today)',
      date: formatDateString(0),
      time: '11:15:00',
      description: 'Highly auspicious timing for weddings today.',
      createdBy,
    },
    {
      categoryId: createdCategories[0].id,
      name: 'Sandhya Vivah Muhurat (Today)',
      date: formatDateString(0),
      time: '18:30:00',
      description: 'Auspicious evening wedding mahuratha.',
      createdBy,
    },
    {
      categoryId: createdCategories[1].id,
      name: 'Griha Pravesh Muhurat (Tomorrow)',
      date: formatDateString(1),
      time: '09:30:00',
      description: 'Auspicious morning timing for housewarming tomorrow.',
      createdBy,
    },
    {
      categoryId: createdCategories[4].id,
      name: 'Mundan Sanskar Shubh Muhurat (Tomorrow)',
      date: formatDateString(1),
      time: '11:00:00',
      description: 'Auspicious mundan timing tomorrow.',
      createdBy,
    },
    {
      categoryId: createdCategories[2].id,
      name: 'Bhoomi Pujan (Day 2)',
      date: formatDateString(2),
      time: '14:45:00',
      description: 'Groundbreaking timing recommended by astrologers.',
      createdBy,
    },
    {
      categoryId: createdCategories[3].id,
      name: 'Namkaran Sanskar (Day 2)',
      date: formatDateString(2),
      time: '16:00:00',
      description: 'Auspicious naming ceremony timing.',
      createdBy,
    },
    {
      categoryId: createdCategories[3].id,
      name: 'Namkaran Sanskar (Day 3)',
      date: formatDateString(3),
      time: '10:00:00',
      description: 'Beautiful timing for naming ceremony.',
      createdBy,
    },
    {
      categoryId: createdCategories[0].id,
      name: 'Vivah Shubh Muhurat (Day 3)',
      date: formatDateString(3),
      time: '19:15:00',
      description: 'Evening marriage timing.',
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

  console.log('\n🎉 Dynamic Muhurat seeding complete!');
  process.exit(0);
}

seedMuhuratNew().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
