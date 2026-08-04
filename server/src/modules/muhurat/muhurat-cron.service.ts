import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, lt } from 'drizzle-orm';

const formatDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

@Injectable()
export class MuhuratCronService {
  private readonly logger = new Logger(MuhuratCronService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async seedDailyMuhurat() {
    this.logger.log('Running daily muhurat seed...');

    const today = formatDateString(0);
    await this.db.delete(schema.muhurat).where(lt(schema.muhurat.date, today));

    const categories = await this.db.query.muhuratCategories.findMany();
    const catMap = (name: string) => categories.find((c) => c.name === name)?.id;

    const entries = [
      { categoryId: catMap('Marriage Muhurat'), name: 'Vivah Shubh Muhurat (Today)', date: formatDateString(0), time: '11:15:00', description: 'Highly auspicious timing for weddings today.' },
      { categoryId: catMap('Marriage Muhurat'), name: 'Sandhya Vivah Muhurat (Today)', date: formatDateString(0), time: '18:30:00', description: 'Auspicious evening wedding muhurat.' },
      { categoryId: catMap('Housewarming Muhurat'), name: 'Griha Pravesh Muhurat (Tomorrow)', date: formatDateString(1), time: '09:30:00', description: 'Auspicious morning timing for housewarming tomorrow.' },
      { categoryId: catMap('Mundan Muhurat'), name: 'Mundan Sanskar Shubh Muhurat (Tomorrow)', date: formatDateString(1), time: '11:00:00', description: 'Auspicious mundan timing tomorrow.' },
      { categoryId: catMap('Bhoomi Pujan Muhurat'), name: 'Bhoomi Pujan (Day 2)', date: formatDateString(2), time: '14:45:00', description: 'Groundbreaking timing recommended by astrologers.' },
      { categoryId: catMap('Naming Ceremony Muhurat'), name: 'Namkaran Sanskar (Day 2)', date: formatDateString(2), time: '16:00:00', description: 'Auspicious naming ceremony timing.' },
      { categoryId: catMap('Naming Ceremony Muhurat'), name: 'Namkaran Sanskar (Day 3)', date: formatDateString(3), time: '10:00:00', description: 'Beautiful timing for naming ceremony.' },
      { categoryId: catMap('Marriage Muhurat'), name: 'Vivah Shubh Muhurat (Day 3)', date: formatDateString(3), time: '19:15:00', description: 'Evening marriage timing.' },
      { categoryId: catMap('Abhijit Muhurat'), name: 'Abhijit Muhurat (Today)', date: formatDateString(0), time: '12:00:00', description: 'The most powerful midday muhurat. Ideal for starting new ventures.' },
      { categoryId: catMap('Abhijit Muhurat'), name: 'Abhijit Muhurat (Tomorrow)', date: formatDateString(1), time: '12:00:00', description: 'Midday Abhijit muhurat for all auspicious activities.' },
      { categoryId: catMap('Abhijit Muhurat'), name: 'Abhijit Muhurat (Day 3)', date: formatDateString(3), time: '12:00:00', description: 'Abhijit muhurat at noon. Lord Brahma\'s favored time.' },
    ];

    for (const entry of entries) {
      if (!entry.categoryId) continue;
      const existing = await this.db.query.muhurat.findFirst({
        where: and(eq(schema.muhurat.date, entry.date), eq(schema.muhurat.time, entry.time)),
      });
      if (!existing) {
        await this.db.insert(schema.muhurat).values(entry);
        this.logger.log(`Created: ${entry.name} at ${entry.date} ${entry.time}`);
      }
    }

    this.logger.log('Daily muhurat seed complete');
  }
}
