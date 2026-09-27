import {
  Injectable,
  Inject,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { lt } from 'drizzle-orm';
import { MuhuratService } from './muhurat.service';

const SEED_DAYS = 7;

const formatDateString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

@Injectable()
export class MuhuratCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MuhuratCronService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly muhurat: MuhuratService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedDailyMuhurat();
    } catch (e) {
      this.logger.error(
        `Startup muhurat seed failed: ${(e as Error)?.message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async seedDailyMuhurat() {
    this.logger.log('Running daily muhurat seed...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    await this.db
      .delete(schema.muhurat)
      .where(lt(schema.muhurat.date, formatDateString(today)));

    const end = new Date(today);
    end.setDate(end.getDate() + SEED_DAYS - 1);

    await this.muhurat.ensureGeneratedForRange(today, end);

    this.logger.log(
      `Daily muhurat seed complete (${formatDateString(today)} - ${formatDateString(end)})`,
    );
  }
}
