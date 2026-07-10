import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, or, desc, sql, lt } from 'drizzle-orm';
import * as schema from '../../db/schemas';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async createOrGet(requesterId: string, requesterRole: string, participantId: string, participantRole: string) {
    if (requesterId === participantId) {
      throw new ConflictException('Cannot create conversation with yourself');
    }

    const [existing] = await this.db.select()
      .from(schema.conversations)
      .where(
        or(
          and(
            eq(schema.conversations.participantOneId, requesterId),
            eq(schema.conversations.participantTwoId, participantId),
          ),
          and(
            eq(schema.conversations.participantOneId, participantId),
            eq(schema.conversations.participantTwoId, requesterId),
          ),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [conversation] = await this.db.insert(schema.conversations).values({
      participantOneId: requesterId as any,
      participantOneRole: requesterRole as any,
      participantTwoId: participantId as any,
      participantTwoRole: participantRole as any,
    }).returning();

    return conversation;
  }

  async findByUser(userId: string) {
    return this.db.select()
      .from(schema.conversations)
      .where(
        or(
          eq(schema.conversations.participantOneId, userId),
          eq(schema.conversations.participantTwoId, userId),
        ),
      )
      .orderBy(desc(schema.conversations.lastMessageAt));
  }

  async findById(id: string) {
    const [conversation] = await this.db.select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, id))
      .limit(1);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getMessages(conversationId: string, cursor?: string, limit = 20) {
    const conditions = [eq(schema.conversationMessages.conversationId, conversationId)];

    if (cursor) {
      const [cursorMsg] = await this.db.select()
        .from(schema.conversationMessages)
        .where(eq(schema.conversationMessages.id, cursor))
        .limit(1);
      if (cursorMsg) {
        conditions.push(lt(schema.conversationMessages.createdAt, cursorMsg.createdAt));
      }
    }

    const messages = await this.db.select()
      .from(schema.conversationMessages)
      .where(and(...conditions))
      .orderBy(desc(schema.conversationMessages.createdAt))
      .limit(limit + 1);

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return {
      data: messages.reverse(),
      nextCursor: hasMore ? messages[0]?.id : null,
      hasMore,
    };
  }

  async createMessage(conversationId: string, senderId: string, senderRole: string, content: string, type = 'text') {
    const [message] = await this.db.insert(schema.conversationMessages).values({
      conversationId: conversationId as any,
      senderId: senderId as any,
      senderRole: senderRole as any,
      content,
      type: type as any,
    }).returning();

    await this.db.update(schema.conversations).set({
      lastMessageAt: new Date(),
      lastMessagePreview: content.substring(0, 200),
      updatedAt: new Date(),
    }).where(eq(schema.conversations.id, conversationId));

    return message;
  }

  async markAsDelivered(conversationId: string, userId: string) {
    await this.db.update(schema.conversationMessages).set({
      isDelivered: true,
    }).where(
      and(
        eq(schema.conversationMessages.conversationId, conversationId),
        eq(schema.conversationMessages.isDelivered, false),
        sql`${schema.conversationMessages.senderId} != ${userId}`,
      ),
    );
  }

  async markAsRead(conversationId: string, userId: string) {
    const now = new Date();
    await this.db.update(schema.conversationMessages).set({
      isRead: true,
      readAt: now,
    }).where(
      and(
        eq(schema.conversationMessages.conversationId, conversationId),
        eq(schema.conversationMessages.isRead, false),
        sql`${schema.conversationMessages.senderId} != ${userId}`,
      ),
    );
  }

  async getUnreadCount(conversationId: string, userId: string) {
    const result = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.conversationMessages)
      .where(
        and(
          eq(schema.conversationMessages.conversationId, conversationId),
          eq(schema.conversationMessages.isRead, false),
          sql`${schema.conversationMessages.senderId} != ${userId}`,
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  async deleteConversation(id: string) {
    await this.db.delete(schema.conversations).where(eq(schema.conversations.id, id));
  }

  async getOtherParticipant(conversationId: string, userId: string): Promise<string | null> {
    const conv = await this.findById(conversationId);
    if (conv.participantOneId === userId) return conv.participantTwoId;
    if (conv.participantTwoId === userId) return conv.participantOneId;
    return null;
  }
}
