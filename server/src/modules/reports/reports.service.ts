import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async findReceived(userId: string, role = 'astrologer') {
    return this.db.query.reports.findMany({
      where:
        role === 'user'
          ? eq(schema.reports.reportedUserId, userId)
          : eq(schema.reports.reportedAstrologerId, userId),
      orderBy: [desc(schema.reports.createdAt)],
    });
  }

  async create(data: typeof schema.reports.$inferInsert) {
    const [r] = await this.db.insert(schema.reports).values(data).returning();
    if (r) {
      try {
        await this.notifyAdminsOfNewReport(r);
      } catch (e: any) {
        this.logger.warn(`Report admin notification failed: ${e.message}`);
      }
    }
    return r;
  }

  private async userName(id?: string | null) {
    if (!id) return undefined;
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: { name: true },
    });
    return user?.name;
  }

  private async notifyAdminsOfNewReport(r: any) {
    const reporterName = (await this.userName(r.reporterId)) || 'A user';
    let target = '';
    if (r.reportedAstrologerId) {
      const name = await this.userName(r.reportedAstrologerId);
      target = name ? ` against astrologer ${name}` : ' against an astrologer';
    } else if (r.reportedUserId) {
      const name = await this.userName(r.reportedUserId);
      target = name ? ` against user ${name}` : ' against a user';
    }
    const reason = String(r.reason || '').replace(/_/g, ' ');
    await this.notifications.notifyAdmins({
      type: 'system',
      title: 'New report filed',
      body: `${reporterName} filed a report${target}: ${reason}.`,
      data: {
        type: 'report_created',
        reportId: r.id,
        reason: r.reason,
        status: r.status || 'pending',
      },
    });
  }

  async update(
    id: string,
    data: { reason?: typeof schema.reports.$inferInsert['reason']; description?: string | null; status?: string },
    adminId?: string,
  ) {
    const payload: Partial<typeof schema.reports.$inferInsert> = {};
    if (data.reason !== undefined) payload.reason = data.reason;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.status !== undefined) {
      const status = String(data.status).toLowerCase().trim() || 'pending';
      payload.status = status;
      if (status === 'pending') {
        payload.resolvedAt = null;
        payload.resolvedBy = null;
      } else {
        payload.resolvedAt = new Date();
        if (adminId) payload.resolvedBy = adminId;
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    const previous = data.status !== undefined
      ? await this.db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
      : null;

    const [r] = await this.db
      .update(schema.reports)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(schema.reports.id, id))
      .returning();
    if (!r) throw new NotFoundException('Report not found');

    if (previous && data.status !== undefined && previous.status !== r.status) {
      this.notifyReportStatusChange(r, previous.status).catch((e: any) =>
        this.logger.warn(`Report status notification failed: ${e.message}`),
      );
    }
    return r;
  }

  private async notifyReportStatusChange(r: any, previousStatus: string) {
    const reason = String(r.reason || '').replace(/_/g, ' ');
    const data = {
      type: 'report_status',
      reportId: r.id,
      status: r.status,
      previousStatus,
    };
    if (r.reporterId) {
      await this.notifications.create({
        userId: r.reporterId,
        type: 'transactional',
        title: 'Report status updated',
        body: `Your report regarding "${reason}" status changed from ${previousStatus} to ${r.status}.`,
        data,
      });
    }
    if (r.reportedAstrologerId) {
      await this.notifications.create({
        astrologerId: r.reportedAstrologerId,
        type: 'transactional',
        title: 'Report status updated',
        body: `A report filed against you changed status from ${previousStatus} to ${r.status}.`,
        data,
      });
    }
    if (r.reportedUserId) {
      await this.notifications.create({
        userId: r.reportedUserId,
        type: 'transactional',
        title: 'Report status updated',
        body: `A report filed against you changed status from ${previousStatus} to ${r.status}.`,
        data,
      });
    }
  }

  async delete(id: string) {
    const [r] = await this.db
      .delete(schema.reports)
      .where(eq(schema.reports.id, id))
      .returning({ id: schema.reports.id });
    if (!r) throw new NotFoundException('Report not found');
    return { success: true };
  }

  async resolve(id: string, adminId: string) {
    const [r] = await this.db.update(schema.reports)
      .set({ status: 'reviewed', resolvedBy: adminId, resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.reports.id, id)).returning();

    if (!r) throw new NotFoundException('Report not found');

    const reason = String(r.reason || '').replace(/_/g, ' ');
    const data = {
      type: 'report_status',
      reportId: r.id,
      status: r.status,
      reason: r.reason,
    };
    if (r.reporterId) {
      this.notifications
        .create({
          userId: r.reporterId,
          type: 'transactional',
          title: 'Report approved',
          body: `Your report regarding "${reason}" has been reviewed and approved by our team.`,
          data,
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
          title: 'Report resolved',
          body: 'A report filed against you has been reviewed and resolved by our team.',
          data,
        })
        .catch((e) =>
          this.logger.warn(`Report astrologer notification failed: ${e.message}`),
        );
    }
    if (r.reportedUserId) {
      this.notifications
        .create({
          userId: r.reportedUserId,
          type: 'transactional',
          title: 'Report resolved',
          body: 'A report filed against you has been reviewed and resolved by our team.',
          data,
        })
        .catch((e) =>
          this.logger.warn(`Report user notification failed: ${e.message}`),
        );
    }
    return r;
  }
}
