import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, or, desc, sql, lt, inArray } from 'drizzle-orm';
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

    if (existing) {
      await this.ensureBirthDetailsMessage(existing.id).catch(() => {});
      return existing;
    }

    const [conversation] = await this.db.insert(schema.conversations).values({
      participantOneId: requesterId as any,
      participantOneRole: requesterRole as any,
      participantTwoId: participantId as any,
      participantTwoRole: participantRole as any,
    }).returning();

    const astroId = requesterRole === 'astrologer' ? requesterId : (participantRole === 'astrologer' ? participantId : null);
    if (astroId) {
      await this.db.update(schema.astrologers)
        .set({ totalChats: sql`${schema.astrologers.totalChats} + 1` })
        .where(eq(schema.astrologers.userId, astroId))
        .catch(() => {});
    }

    await this.ensureBirthDetailsMessage(conversation.id).catch(() => {});

    return conversation;
  }

  /**
   * Auto-share the user's birth details (DOB / TOB / POB) as the first message
   * of a conversation so the astrologer has the chart inputs up front.
   * Only runs while the conversation is still empty, which keeps it
   * idempotent and avoids injecting it into ongoing chats.
   */
  private async ensureBirthDetailsMessage(conversationId: string) {
    const [conv] = await this.db.select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId))
      .limit(1);
    if (!conv) return;

    const userId =
      conv.participantOneRole === 'user'
        ? conv.participantOneId
        : conv.participantTwoRole === 'user'
          ? conv.participantTwoId
          : null;
    if (!userId) return;

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.conversationMessages)
      .where(eq(schema.conversationMessages.conversationId, conversationId));
    if (Number(countRow?.count || 0) > 0) return;

    const kundli = await this.db.query.kundliRecords.findFirst({
      where: eq(schema.kundliRecords.userId, userId),
      orderBy: [desc(schema.kundliRecords.createdAt)],
    });

    const lines: string[] = [];
    const dob = kundli?.dateOfBirth;
    const tob = kundli?.timeOfBirth;
    const pob = kundli?.placeOfBirth;
    if (dob) lines.push(`• Date of Birth: ${dob}`);
    if (tob) lines.push(`• Time of Birth: ${String(tob).slice(0, 5)}`);
    if (pob) lines.push(`• Place of Birth: ${pob}`);

    if (lines.length === 0) {
      const profile = await this.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { dateOfBirth: true },
      });
      if (profile?.dateOfBirth) {
        lines.push(`• Date of Birth: ${profile.dateOfBirth}`);
      }
    }
    if (lines.length === 0) return;

    const content = `📋 Birth Details\n${lines.join('\n')}`;
    await this.createMessage(conversationId, userId, 'user', content, 'text');
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

  async getUnreadCounts(conversationIds: string[], userId: string): Promise<Record<string, number>> {
    if (conversationIds.length === 0) return {};
    const result = await this.db.select({
      conversationId: schema.conversationMessages.conversationId,
      count: sql<number>`count(*)`,
    })
      .from(schema.conversationMessages)
      .where(
        and(
          inArray(schema.conversationMessages.conversationId, conversationIds),
          eq(schema.conversationMessages.isRead, false),
          sql`${schema.conversationMessages.senderId} != ${userId}`,
        ),
      )
      .groupBy(schema.conversationMessages.conversationId);
    const map: Record<string, number> = {};
    for (const row of result) map[row.conversationId] = Number(row.count);
    return map;
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
