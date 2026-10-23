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

    if (requesterRole === 'user' && participantRole === 'astrologer') {
      const astro = await this.db.query.astrologers.findFirst({
        where: eq(schema.astrologers.userId, participantId),
        columns: { isChatEnabled: true },
      });
      if (astro && astro.isChatEnabled === false) {
        throw new ConflictException(
          'This astrologer has disabled chat consultations right now.',
        );
      }
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

  private static readonly BIRTH_DETAILS_PREFIX = '📋 Birth Details';

  /**
   * Auto-share the user's birth details (DOB / TOB / POB) as a message in the
   * conversation so the astrologer always has the chart inputs up front.
   * Idempotent (checks for an existing birth-details message) and safe to
   * call at any point in the conversation's life.
   *
   * Returns whether kundli inputs are available to the astrologer, plus the
   * message that was just created (if any) so callers can broadcast it.
   */
  async ensureBirthDetailsMessage(conversationId: string): Promise<{
    available: boolean;
    created?: typeof schema.conversationMessages.$inferSelect;
  }> {
    const [conv] = await this.db.select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId))
      .limit(1);
    if (!conv) return { available: false };

    const userId =
      conv.participantOneRole === 'user'
        ? conv.participantOneId
        : conv.participantTwoRole === 'user'
          ? conv.participantTwoId
          : null;
    if (!userId) return { available: false };

    const kundli = await this.db.query.kundliRecords.findFirst({
      where: eq(schema.kundliRecords.userId, userId),
      orderBy: [desc(schema.kundliRecords.createdAt)],
    });

    let dob = kundli?.dateOfBirth ? String(kundli.dateOfBirth) : null;
    const tob = kundli?.timeOfBirth ? String(kundli.timeOfBirth).slice(0, 5) : null;
    const pob = kundli?.placeOfBirth || null;

    if (!dob) {
      const profile = await this.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { dateOfBirth: true },
      });
      dob = profile?.dateOfBirth ? String(profile.dateOfBirth) : null;
    }

    const available = Boolean(dob && tob && pob);
    const lines = [
      `• Date of Birth: ${dob || 'Not provided'}`,
      `• Time of Birth: ${tob || 'Not provided'}`,
      `• Place of Birth: ${pob || 'Not provided'}`,
    ];
    const content = `${ConversationsService.BIRTH_DETAILS_PREFIX}\n${lines.join('\n')}${
      available
        ? ''
        : '\n\nPlease share the missing birth details or attach your Kundli to start the consultation.'
    }`;

    const existing = await this.db.query.conversationMessages.findFirst({
      where: and(
        eq(schema.conversationMessages.conversationId, conversationId),
        sql`${schema.conversationMessages.content} LIKE ${ConversationsService.BIRTH_DETAILS_PREFIX + '%'}`,
      ),
    });

    if (existing) {
      if (existing.content === content) return { available };
      const [updated] = await this.db
        .update(schema.conversationMessages)
        .set({ content })
        .where(eq(schema.conversationMessages.id, existing.id))
        .returning();
      return { available, created: updated };
    }

    const created = await this.createMessage(
      conversationId,
      userId,
      'user',
      content,
      'text',
    );
    return { available, created };
  }

  /** True when the user attached a kundli/document in this conversation. */
  async hasKundliAttachment(conversationId: string): Promise<boolean> {
    const attachment = await this.db.query.conversationMessages.findFirst({
      where: and(
        eq(schema.conversationMessages.conversationId, conversationId),
        eq(schema.conversationMessages.senderRole, 'user'),
        eq(schema.conversationMessages.type, 'file'),
        sql`${schema.conversationMessages.mediaUrl} IS NOT NULL`,
      ),
    });
    return !!attachment;
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

  async createMessage(
    conversationId: string,
    senderId: string,
    senderRole: string,
    content: string,
    type = 'text',
    mediaUrl?: string,
  ) {
    const [message] = await this.db.insert(schema.conversationMessages).values({
      conversationId: conversationId as any,
      senderId: senderId as any,
      senderRole: senderRole as any,
      content,
      type: type as any,
      mediaUrl: mediaUrl || null,
    }).returning();

    const preview =
      type === 'file'
        ? `📎 ${content || 'Attachment'}`
        : content;
    await this.db.update(schema.conversations).set({
      lastMessageAt: new Date(),
      lastMessagePreview: preview.substring(0, 200),
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
