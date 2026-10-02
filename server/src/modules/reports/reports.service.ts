import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, or, desc, sql, aliasedTable } from 'drizzle-orm';
import { paginated, Pagination } from '../../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(pagination?: Pagination) {
    if (!pagination?.enabled) return this.db.query.reports.findMany();
    const reporterUser = aliasedTable(schema.users, 'reporter_user');
    const reportedUser = aliasedTable(schema.users, 'reported_user');
    const reportedAstrologerUser = aliasedTable(schema.users, 'reported_astrologer_user');

    let where: any;
    if (pagination.q) {
      const pattern = `%${pagination.q}%`;
      where = or(
        sql`${schema.reports.reason}::text ILIKE ${pattern}`,
        sql`${schema.reports.status}::text ILIKE ${pattern}`,
      );
    }
    const [data, countRows] = await Promise.all([
      this.db
        .select({
          id: schema.reports.id,
          reporterId: schema.reports.reporterId,
          reporterRole: schema.reports.reporterRole,
          reporterName: reporterUser.name,
          reportedUserId: schema.reports.reportedUserId,
          reportedUserName: reportedUser.name,
          reportedAstrologerId: schema.reports.reportedAstrologerId,
          reportedAstrologerName: reportedAstrologerUser.name,
          reason: schema.reports.reason,
          description: schema.reports.description,
          status: schema.reports.status,
          resolvedBy: schema.reports.resolvedBy,
          resolvedAt: schema.reports.resolvedAt,
          createdAt: schema.reports.createdAt,
          updatedAt: schema.reports.updatedAt,
        })
        .from(schema.reports)
        .leftJoin(reporterUser, eq(schema.reports.reporterId, reporterUser.id))
        .leftJoin(reportedUser, eq(schema.reports.reportedUserId, reportedUser.id))
        .leftJoin(reportedAstrologerUser, eq(schema.reports.reportedAstrologerId, reportedAstrologerUser.id))
        .where(where)
        .orderBy(desc(schema.reports.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(where),
    ]);
    return paginated(data, countRows[0]?.count ?? 0, pagination);
  }
  async findById(id: string) { return this.db.query.reports.findFirst({ where: eq(schema.reports.id, id) }); }

  async findMine(reporterId: string) {
    return this.db.query.reports.findMany({
      where: eq(schema.reports.reporterId, reporterId),
      orderBy: [desc(schema.reports.createdAt)],
    });
  }

  async findReceived(astrologerId: string) {
    return this.db.query.reports.findMany({
      where: eq(schema.reports.reportedAstrologerId, astrologerId),
      orderBy: [desc(schema.reports.createdAt)],
    });
  }

  async create(data: typeof schema.reports.$inferInsert) { const [r] = await this.db.insert(schema.reports).values(data).returning(); return r; }

  async resolve(id: string, adminId: string) {
    const [r] = await this.db.update(schema.reports)
      .set({ status: 'reviewed', resolvedBy: adminId, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.reports.id, id)).returning();

    if (r) {
      const body = `Your report regarding "${r.reason}" has been reviewed by our team.`;
      if (r.reporterId) {
        this.notifications
          .create({
            userId: r.reporterId,
            type: 'transactional',
            title: 'Report status updated',
            body,
            data: { type: 'report_status', reportId: r.id, status: r.status },
          })
          .catch((e) =>
            this.logger.warn(`Report reporter notification failed: ${e.message}`),
          );
      }
      if (r.reportedAstrologerId) {
        this.notifications
          .create({
            astrologerId: r.reportedAstrologerId,
            type: 'transactional',
            title: 'Report status updated',
            body: 'A report filed against you has been reviewed by our team.',
            data: { type: 'report_status', reportId: r.id, status: r.status },
          })
          .catch((e) =>
            this.logger.warn(`Report astrologer notification failed: ${e.message}`),
          );
      }
    }
    return r;
  }
}
