import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and, lt } from 'drizzle-orm';
import { AstrologyService } from '../astrology/astrology.service';

const formatDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const AUSPICIOUS_CHAUGHADIYA = ['Labh', 'Amrit', 'Shubh'];

const parseSlotStart = (slotTime: string): string => {
  const m = (slotTime || '').match(/(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/);
  if (!m) return '';
  const h = String(Number(m[1])).padStart(2, '0');
  const min = String(Number(m[2])).padStart(2, '0');
  const sec = String(Number(m[3])).padStart(2, '0');
  return `${h}:${min}:${sec}`;
};

@Injectable()
export class MuhuratCronService {
  private readonly logger = new Logger(MuhuratCronService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly astrology: AstrologyService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async seedDailyMuhurat() {
    this.logger.log('Running daily muhurat seed from AstrologyAPI...');

    const today = formatDateString(0);
    await this.db.delete(schema.muhurat).where(lt(schema.muhurat.date, today));

    const categories = await this.db.query.muhuratCategories.findMany();
    const chaughadiyaCat = categories.find(
      (c) =>
        c.name === 'Chaughadiya Muhurat' || c.name === 'Choghadiya Muhurat',
    )?.id;
    const abhijitCat = categories.find((c) => c.name === 'Abhijit Muhurat')?.id;

    if (!chaughadiyaCat) {
      this.logger.warn(
        'No Chaughadiya Muhurat category found; skipping chaughadiya seeding.',
      );
    }
    if (!abhijitCat) {
      this.logger.warn(
        'No Abhijit Muhurat category found; skipping abhijit seeding.',
      );
    }

    const entriesToCreate: {
      categoryId: string;
      name: string;
      date: string;
      time: string;
      description: string;
    }[] = [];

    for (let offset = 0; offset < 3; offset++) {
      const date = formatDateString(offset);

      if (chaughadiyaCat) {
        try {
          const res = await this.astrology.getChaughadiyaMuhurta(
            date,
            28.6139,
            77.209,
            5.5,
          );
          const daySlots: any[] = res?.chaughadiya?.day || [];
          for (const slot of daySlots) {
            if (!AUSPICIOUS_CHAUGHADIYA.includes(slot.muhurta)) continue;
            const time = parseSlotStart(slot.time);
            if (!time) continue;
            entriesToCreate.push({
              categoryId: chaughadiyaCat,
              name: `${slot.muhurta} Choghadiya (Day)`,
              date,
              time,
              description: `Auspicious ${slot.muhurta} choghadiya period today. Good for starting new ventures.`,
            });
          }
        } catch (e: any) {
          this.logger.error(
            `Chaughadiya fetch failed for ${date}: ${e.message}`,
          );
        }
      }

      if (abhijitCat) {
        try {
          const panchang = await this.astrology.calculatePanchang(
            date,
            28.6139,
            77.209,
            5.5,
          );
          const abhijit = panchang.abhijitMuhurta;
          if (abhijit?.start) {
            entriesToCreate.push({
              categoryId: abhijitCat,
              name: `Abhijit Muhurat (${date})`,
              date,
              time: abhijit.start,
              description: `Auspicious midday muhurat ${abhijit.start} - ${abhijit.end}. Ideal for starting new ventures.`,
            });
          }
        } catch (e: any) {
          this.logger.error(`Panchang fetch failed for ${date}: ${e.message}`);
        }
      }
    }

    for (const entry of entriesToCreate) {
      const existing = await this.db.query.muhurat.findFirst({
        where: and(
          eq(schema.muhurat.date, entry.date),
          eq(schema.muhurat.time, entry.time),
        ),
      });
      if (!existing) {
        await this.db.insert(schema.muhurat).values({
          categoryId: entry.categoryId,
          name: entry.name,
          date: entry.date,
          time: entry.time,
          description: entry.description,
        });
        this.logger.log(
          `Created: ${entry.name} at ${entry.date} ${entry.time}`,
        );
      }
    }

    this.logger.log(
      `Daily muhurat seed complete (${entriesToCreate.length} entries planned)`,
    );
  }
}
