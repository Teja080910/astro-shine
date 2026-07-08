import 'dotenv/config';
import { db, schema } from './db/connection';
import * as crypto from 'crypto';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── Astrologers ──
  const astroData = [
    { name: 'Aarav Sharma', email: 'aarav@astroshine.com', phone: '9812345670', bio: 'Vedic astrologer with 15+ years of experience in birth chart analysis and predictions.', experience: 15, specialization: ['Vedic', 'Kundli'], languages: ['Hindi', 'English'], skills: ['Birth Chart', 'Predictions', 'Remedies'], pricePerMin: '15', rating: '4.8', totalReviews: 234, totalCalls: 1200, totalEarnings: '450000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Priya Patel', email: 'priya@astroshine.com', phone: '9876543210', bio: 'Tarot card reader and numerology expert. Helping people find clarity through cards.', experience: 8, specialization: ['Tarot', 'Numerology'], languages: ['Hindi', 'English', 'Gujarati'], skills: ['Tarot Reading', 'Numerology', 'Career Guidance'], pricePerMin: '12', rating: '4.6', totalReviews: 189, totalCalls: 890, totalEarnings: '320000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Rahul Verma', email: 'rahul@astroshine.com', phone: '9988776655', bio: 'Palmist and face reader. I can read your life lines and predict your future.', experience: 12, specialization: ['Palmistry', 'Face Reading'], languages: ['Hindi', 'English'], skills: ['Palm Reading', 'Face Reading', 'Relationship Advice'], pricePerMin: '10', rating: '4.5', totalReviews: 156, totalCalls: 750, totalEarnings: '280000', verificationStatus: 'approved', onlineStatus: 'offline' },
    { name: 'Ananya Gupta', email: 'ananya@astroshine.com', phone: '9765432109', bio: 'Specialist in love and relationship astrology. Helping couples find harmony.', experience: 6, specialization: ['Love Astrology', 'Relationship'], languages: ['Hindi', 'English', 'Marathi'], skills: ['Love Predictions', 'Compatibility', 'Marriage Guidance'], pricePerMin: '8', rating: '4.3', totalReviews: 98, totalCalls: 520, totalEarnings: '150000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Vikram Singh', email: 'vikram@astroshine.com', phone: '9654321098', bio: 'Expert in Vastu and gemstone recommendations. Transform your living spaces.', experience: 20, specialization: ['Vastu', 'Gemology'], languages: ['Hindi', 'English', 'Punjabi'], skills: ['Vastu Correction', 'Gemstone Advice', 'Business Astrology'], pricePerMin: '20', rating: '4.9', totalReviews: 312, totalCalls: 1500, totalEarnings: '680000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Neha Kapoor', email: 'neha@astroshine.com', phone: '9543210987', bio: 'Muhurat specialist and spiritual healer. Find the perfect time for your events.', experience: 10, specialization: ['Muhurat', 'Spiritual Healing'], languages: ['Hindi', 'English'], skills: ['Muhurat Fixing', 'Energy Healing', 'Meditation'], pricePerMin: '12', rating: '4.7', totalReviews: 178, totalCalls: 920, totalEarnings: '380000', verificationStatus: 'approved', onlineStatus: 'offline' },
    { name: 'Arjun Nair', email: 'arjun@astroshine.com', phone: '9432109876', bio: 'Nadi astrologer and past life regression therapist.', experience: 18, specialization: ['Nadi Astrology', 'Past Life'], languages: ['Malayalam', 'Hindi', 'English', 'Tamil'], skills: ['Nadi Reading', 'Past Life Regression', 'Karma Analysis'], pricePerMin: '25', rating: '4.9', totalReviews: 267, totalCalls: 1100, totalEarnings: '720000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Kavita Reddy', email: 'kavita@astroshine.com', phone: '9321098765', bio: 'Astro-psychologist combining astrology with modern psychology.', experience: 7, specialization: ['Astro-Psychology', 'Career Astrology'], languages: ['Telugu', 'Hindi', 'English'], skills: ['Psychological Astrology', 'Career Guidance', 'Personal Growth'], pricePerMin: '10', rating: '4.4', totalReviews: 134, totalCalls: 680, totalEarnings: '210000', verificationStatus: 'approved', onlineStatus: 'online' },
    { name: 'Rohit Joshi', email: 'rohit@astroshine.com', phone: '9210987654', bio: 'KP and horary astrologer. Quick and accurate predictions.', experience: 14, specialization: ['KP Astrology', 'Horary'], languages: ['Hindi', 'English', 'Marathi'], skills: ['KP System', 'Horary Predictions', 'Stock Market Astrology'], pricePerMin: '18', rating: '4.7', totalReviews: 201, totalCalls: 980, totalEarnings: '510000', verificationStatus: 'approved', onlineStatus: 'offline' },
    { name: 'Sneha Iyer', email: 'sneha@astroshine.com', phone: '9109876543', bio: 'New age astrologer specializing in crystal healing and cosmic guidance.', experience: 5, specialization: ['Crystal Healing', 'Cosmic Guidance'], languages: ['Tamil', 'English', 'Hindi'], skills: ['Crystal Therapy', 'Chakra Balancing', 'Intuitive Reading'], pricePerMin: '7', rating: '4.2', totalReviews: 76, totalCalls: 410, totalEarnings: '95000', verificationStatus: 'approved', onlineStatus: 'online' },
  ];

  const astrologerIds: string[] = [];
  for (const a of astroData) {
    const [astro] = await db.insert(schema.astrologers).values({
      name: a.name,
      email: a.email,
      phone: a.phone,
      password: hashPassword('password123'),
      gender: a.name.includes(' ') ? (a.name.split(' ')[0].endsWith('a') ? 'female' : 'male') as 'male' | 'female' : 'male',
      dateOfBirth: '1985-06-15',
      bio: a.bio,
      experience: a.experience,
      specialization: a.specialization,
      languages: a.languages,
      skills: a.skills,
      pricePerMin: a.pricePerMin,
      rating: a.rating,
      totalReviews: a.totalReviews,
      totalCalls: a.totalCalls,
      totalEarnings: a.totalEarnings,
      verificationStatus: a.verificationStatus as 'approved' | 'pending' | 'rejected',
      onlineStatus: a.onlineStatus as 'online' | 'offline' | 'busy',
    }).returning({ id: schema.astrologers.id });
    astrologerIds.push(astro.id);
  }
  console.log(`✅ ${astroData.length} astrologers created`);

  // ── Schedules ──
  const scheduleData: { astrologerId: string; dayOfWeek: number; startTime: string; endTime: string }[] = [];
  for (const id of astrologerIds) {
    for (let day = 0; day < 6; day++) {
      scheduleData.push({ astrologerId: id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' });
    }
  }
  await db.insert(schema.astrologerSchedules).values(scheduleData);
  console.log(`✅ ${scheduleData.length} schedule entries created`);

  // ── Commissions ──
  for (const id of astrologerIds) {
    await db.insert(schema.commissions).values({
      astrologerId: id,
      type: 'percentage',
      value: '20',
      minAmount: '10',
      maxCap: '500',
    });
  }
  console.log(`✅ ${astrologerIds.length} commission settings created`);

  // ── Wallets ──
  for (const id of astrologerIds) {
    await db.insert(schema.wallets).values({
      astrologerId: id,
      balance: String(Math.floor(Math.random() * 50000) + 1000),
      totalAdded: String(Math.floor(Math.random() * 200000) + 50000),
      totalDeducted: String(Math.floor(Math.random() * 150000) + 10000),
    });
  }
  console.log(`✅ ${astrologerIds.length} wallets created`);

  // ── Gifts ──
  const giftData = [
    { name: 'Red Rose Bouquet', price: '199', image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=200' },
    { name: 'Chocolate Box', price: '349', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200' },
    { name: 'Crystal Star', price: '499', image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200' },
    { name: 'Incense Set', price: '249', image: 'https://images.unsplash.com/photo-1602868464286-2f0e7e6a7c7a?w=200' },
    { name: 'Gemstone Bracelet', price: '799', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200' },
    { name: 'Premium Pooja Kit', price: '999', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=200' },
    { name: 'Gold Plated Idol', price: '1499', image: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?w=200' },
    { name: 'Sandalwood Mala', price: '599', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200' },
  ];
  await db.insert(schema.gifts).values(giftData);
  console.log(`✅ ${giftData.length} gifts created`);

  // ── Shop Products ──
  const shopData = [
    { name: 'Brass Kalash', description: 'Sacred brass pot for pooja rituals', price: '599', comparePrice: '799', category: 'Pooja Items', stock: 50 },
    { name: 'Copper Tong', description: 'Handcrafted copper tong for havan', price: '349', comparePrice: '449', category: 'Pooja Items', stock: 30 },
    { name: 'Crystal Shivalinga', description: 'Natural crystal shivalinga for meditation', price: '1299', comparePrice: '1599', category: 'Crystals', stock: 20 },
    { name: 'Rose Quartz Heart', description: 'Love attracting rose quartz crystal', price: '449', comparePrice: '599', category: 'Crystals', stock: 40 },
    { name: 'Meditation Cushion', description: 'Comfortable floor cushion for meditation', price: '899', comparePrice: '1199', category: 'Meditation', stock: 25 },
    { name: 'Tibetan Singing Bowl', description: 'Handmade singing bowl for sound healing', price: '2499', comparePrice: '2999', category: 'Meditation', stock: 15 },
    { name: 'Agarbatti Pack (12)', description: 'Premium sandalwood incense sticks', price: '99', comparePrice: '149', category: 'Incense', stock: 100 },
    { name: 'Camphor Tablets', description: 'Pure camphor for aarti', price: '49', comparePrice: '79', category: 'Pooja Items', stock: 200 },
    { name: 'Rudraksha Mala', description: '108 bead rudraksha mala', price: '1999', comparePrice: '2499', category: 'Mala', stock: 10 },
    { name: 'Sphatik Mala', description: 'Clear quartz crystal mala', price: '1499', comparePrice: '1799', category: 'Mala', stock: 15 },
  ];
  await db.insert(schema.shopProducts).values(shopData.map(p => ({ ...p, images: [] })));
  console.log(`✅ ${shopData.length} shop products created`);

  // ── Mandir Pooja ──
  const poojaData = [
    { name: 'Maha Mrityunjaya Jaap', description: 'Powerful vedic chant for health and longevity', price: '1100' },
    { name: 'Ganesh Abhishekam', description: 'Special abhishekam for removing obstacles', price: '751' },
    { name: 'Lakshmi Pooja', description: 'Pooja for wealth and prosperity', price: '1100' },
    { name: 'Navagraha Shanti', description: 'Pacifying the nine planets for harmony', price: '2100' },
    { name: 'Saraswati Pooja', description: 'Blessings for knowledge and wisdom', price: '751' },
    { name: 'Rudra Abhishekam', description: 'Powerful Shiva pooja for spiritual growth', price: '1500' },
    { name: 'Satyanarayan Katha', description: 'Complete pooja for peace and happiness', price: '1100' },
    { name: 'Hanuman Chalisa Path', description: 'Recitation for strength and protection', price: '501' },
  ];
  await db.insert(schema.mandirPooja).values(poojaData);
  console.log(`✅ ${poojaData.length} pooja services created`);

  // ── Horoscope ──
  const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const predictions = [
    'Today brings new opportunities in your career. Stay open to unexpected changes.',
    'Focus on your relationships today. A heartfelt conversation will bring clarity.',
    'Financial gains are indicated. Review your investments for long-term growth.',
    'Your creative energy is at its peak. Channel it into a passion project.',
    'Take time for self-care today. A short break will recharge your spirits.',
    'Communication flows smoothly. Perfect day for important discussions.',
    'Trust your intuition today. It will guide you toward the right decision.',
    'A pleasant surprise awaits you in the evening. Stay positive.',
    'Health needs attention. Incorporate some physical activity into your routine.',
    'Family matters come to the forefront. Your wisdom will resolve conflicts.',
    'Travel plans may materialize sooner than expected. Be prepared.',
    'Spiritual growth is highlighted. Meditation will bring inner peace.',
  ];
  const colors = ['Red', 'Yellow', 'Green', 'White', 'Orange', 'Blue', 'Pink', 'Black', 'Purple', 'Brown', 'Silver', 'Gold'];
  const moods = ['Energetic', 'Calm', 'Focused', 'Reflective', 'Joyful', 'Determined', 'Peaceful', 'Curious', 'Ambitious', 'Grateful'];

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    for (let z = 0; z < zodiacSigns.length; z++) {
      await db.insert(schema.horoscopeRecords).values({
        zodiacSign: zodiacSigns[z],
        date: dateStr,
        prediction: predictions[z % predictions.length],
        luckyNumber: Math.floor(Math.random() * 100) + 1,
        luckyColor: colors[Math.floor(Math.random() * colors.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
      });
    }
  }
  console.log(`✅ Horoscope records created for 7 days`);

  // ── Panchang ──
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const tithis = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami'];
    const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu'];
    await db.insert(schema.panchangRecords).values({
      date: dateStr,
      tithi: tithis[i % tithis.length],
      nakshatra: nakshatras[i % nakshatras.length],
      yoga: 'Vishkumbha',
      karana: 'Bava',
      sunrise: '06:00',
      sunset: '18:30',
      moonrise: '19:00',
      moonset: '05:30',
      rahuKaal: { start: '07:30', end: '09:00' },
    });
  }
  console.log(`✅ Panchang records created for 7 days`);

  // ── Blogs ──
  const blogData = [
    { title: 'Understanding Your Birth Chart', slug: 'understanding-birth-chart', content: 'A birth chart is a snapshot of the sky at the moment of your birth. It reveals your strengths, challenges, and life path. In this comprehensive guide, we explore the 12 houses, planets, and zodiac signs that make up your unique cosmic blueprint.', excerpt: 'Learn how to read and interpret your birth chart for deeper self-awareness.', tags: ['kundli', 'birth-chart', 'astrology-basics'] },
    { title: 'The Power of Gemstones in Astrology', slug: 'power-of-gemstones', content: 'Gemstones have been used for centuries to harness planetary energies. Each gemstone corresponds to a specific planet and can help balance its influence in your life. Discover which gemstone is right for you based on your birth chart.', excerpt: 'Discover how gemstones can balance planetary energies in your life.', tags: ['gemstones', 'remedies', 'planets'] },
    { title: 'Love Compatibility: Beyond Sun Signs', slug: 'love-compatibility', content: 'While sun sign compatibility gives a general idea, true relationship analysis requires examining the Moon, Venus, Mars, and the 7th house. Learn what makes a relationship work from an astrological perspective.', excerpt: 'Deep dive into astrological compatibility factors for lasting relationships.', tags: ['love', 'compatibility', 'relationships'] },
    { title: 'Vastu Tips for Your Home', slug: 'vastu-tips-home', content: 'Vastu Shastra, the ancient Indian science of architecture, can transform your living space into a haven of positive energy. Simple changes in room placement, colors, and directions can bring harmony and prosperity.', excerpt: 'Simple Vastu corrections to bring positive energy into your living space.', tags: ['vastu', 'home', 'feng-shui'] },
    { title: 'Meditation Techniques for Beginners', slug: 'meditation-beginners', content: 'Starting a meditation practice can be daunting. This guide covers simple techniques including breath awareness, mantra meditation, and guided visualization to help you begin your spiritual journey.', excerpt: 'Simple meditation techniques to start your spiritual practice today.', tags: ['meditation', 'spiritual', 'wellness'] },
    { title: 'Planetary Periods: Understanding Dasha', slug: 'planetary-periods-dasha', content: 'The Vimshottari Dasha system is a powerful predictive tool in Vedic astrology. Each planet rules a specific period in your life, bringing its unique influences. Learn how to navigate your current dasha.', excerpt: 'Navigate life transitions by understanding your current planetary period.', tags: ['dasha', 'predictions', 'vedic'] },
  ];
  for (const blog of blogData) {
    await db.insert(schema.blogs).values({ ...blog, status: 'published', publishedAt: new Date() });
  }
  console.log(`✅ ${blogData.length} blogs created`);

  // ── News ──
  const newsData = [
    { title: 'Astro Shine Launches New Kundli Feature', content: 'We are excited to announce our enhanced Kundli analysis tool with detailed planet positions and personalized predictions.' },
    { title: 'Guru Purnima Special: Free Consultations', content: 'Celebrate Guru Purnima with free 5-minute consultations from our top astrologers. Offer valid this weekend only.' },
    { title: 'New Astrologers Join Our Platform', content: 'Welcome our newest verified astrologers specializing in Tarot, Numerology, and Vastu Shastra.' },
    { title: 'Diwali Special Pooja Services', content: 'Book special Diwali pooja services including Lakshmi Pooja and Kuber Yantra installation at your home.' },
  ];
  await db.insert(schema.news).values(newsData);
  console.log(`✅ ${newsData.length} news items created`);

  // ── Videos ──
  const videoData = [
    { title: 'Introduction to Vedic Astrology', description: 'A beginner-friendly overview of Vedic astrology fundamentals.', url: 'https://www.youtube.com/watch?v=example1', category: 'Education', duration: 600 },
    { title: 'Daily Horoscope Predictions', description: 'Today\'s horoscope predictions for all 12 zodiac signs.', url: 'https://www.youtube.com/watch?v=example2', category: 'Horoscope', duration: 900 },
    { title: 'Meditation for Beginners', description: 'Guided meditation session for stress relief.', url: 'https://www.youtube.com/watch?v=example3', category: 'Meditation', duration: 1200 },
    { title: 'Understanding Tarot Cards', description: 'Learn the meaning of major arcana tarot cards.', url: 'https://www.youtube.com/watch?v=example4', category: 'Tarot', duration: 1500 },
    { title: 'Vastu Tips for Wealth', description: 'Vastu corrections to attract wealth and prosperity.', url: 'https://www.youtube.com/watch?v=example5', category: 'Vastu', duration: 800 },
  ];
  await db.insert(schema.videos).values(videoData);
  console.log(`✅ ${videoData.length} videos created`);

  // ── App Settings ──
  const settingsData = [
    { key: 'app_name', value: JSON.stringify('Astro Shine'), description: 'Application display name' },
    { key: 'app_version', value: JSON.stringify('1.0.0'), description: 'Current app version' },
    { key: 'min_android_version', value: JSON.stringify('1.0.0'), description: 'Minimum supported Android version' },
    { key: 'min_ios_version', value: JSON.stringify('1.0.0'), description: 'Minimum supported iOS version' },
    { key: 'default_currency', value: JSON.stringify('INR'), description: 'Default currency for transactions' },
    { key: 'platform_fee_percentage', value: JSON.stringify('20'), description: 'Platform commission percentage' },
    { key: 'min_withdrawal_amount', value: JSON.stringify('100'), description: 'Minimum withdrawal amount' },
    { key: 'max_withdrawal_amount', value: JSON.stringify('50000'), description: 'Maximum withdrawal amount' },
    { key: 'support_email', value: JSON.stringify('support@astroshine.com'), description: 'Customer support email' },
    { key: 'about_app', value: JSON.stringify('Astro Shine is your gateway to cosmic wisdom. Connect with expert astrologers, get daily horoscopes, and explore spiritual products.'), description: 'About app description' },
  ];
  for (const s of settingsData) {
    await db.insert(schema.appSettings).values(s);
  }
  console.log(`✅ ${settingsData.length} app settings created`);

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
