import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, inArray } from 'drizzle-orm';
import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string | null;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  private isValidToken(token?: string | null): token is string {
    return (
      !!token && /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token.trim())
    );
  }

  async registerToken(userId: string, token: string) {
    await this.db
      .update(schema.users)
      .set({ fcmToken: token.trim(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
    this.logger.log(`Push token registered for user ${userId}`);
    return { success: true };
  }

  async clearToken(userId: string) {
    await this.db
      .update(schema.users)
      .set({ fcmToken: null, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
    return { success: true };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!userId) return;
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { fcmToken: true },
    });
    if (!this.isValidToken(user?.fcmToken)) return;
    await this.sendToTokens([user.fcmToken], payload, [userId]);
  }

  async sendToUsers(userIds: string[], payload: PushPayload) {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;

    const rows = await this.db
      .select({ id: schema.users.id, token: schema.users.fcmToken })
      .from(schema.users)
      .where(inArray(schema.users.id, ids));

    const valid = rows.filter((r): r is { id: string; token: string } =>
      this.isValidToken(r.token),
    );
    if (valid.length === 0) return;

    await this.sendToTokens(
      valid.map((v) => v.token),
      payload,
      valid.map((v) => v.id),
    );
  }

  private async sendToTokens(
    tokens: string[],
    payload: PushPayload,
    userIds?: string[],
  ) {
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const chunk = tokens.slice(i, i + BATCH_SIZE);
      const messages = chunk.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        ...(payload.image ? { image: payload.image } : {}),
        channelId: 'default',
      }));

      try {
        const res = await axios.post(EXPO_PUSH_URL, messages, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000,
        });

        const tickets: any[] = res.data?.data || [];
        for (let j = 0; j < tickets.length; j++) {
          const ticket = tickets[j];
          if (ticket?.status !== 'error') continue;
          const errorCode = ticket.details?.error;
          const ownerId = userIds?.[i + j];
          if (errorCode === 'DeviceNotRegistered' && ownerId) {
            await this.clearToken(ownerId).catch(() => undefined);
          }
          this.logger.warn(
            `Push failed: ${ticket.message || errorCode || 'unknown error'}`,
          );
        }
      } catch (e: any) {
        this.logger.warn(
          `Push send failed: ${e.response?.data ? JSON.stringify(e.response.data) : e.message}`,
        );
      }
    }
  }
}
