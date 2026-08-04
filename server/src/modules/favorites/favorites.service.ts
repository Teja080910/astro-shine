import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async listUserFavorites(userId: string) {
    const favs = await this.db
      .select({
        favoriteId: schema.favoriteAstrologers.id,
        createdAt: schema.favoriteAstrologers.createdAt,
        userId: schema.favoriteAstrologers.userId,
        astrologerId: schema.favoriteAstrologers.astrologerId,
        astrologer: {
          userId: schema.astrologers.userId,
          bio: schema.astrologers.bio,
          experience: schema.astrologers.experience,
          specialization: schema.astrologers.specialization,
          languages: schema.astrologers.languages,
          skills: schema.astrologers.skills,
          pricePerMin: schema.astrologers.pricePerMin,
          rating: schema.astrologers.rating,
          totalReviews: schema.astrologers.totalReviews,
          chatPricePerMin: schema.astrologers.chatPricePerMin,
          audioCallPricePerMin: schema.astrologers.audioCallPricePerMin,
          videoCallPricePerMin: schema.astrologers.videoCallPricePerMin,
          totalChats: schema.astrologers.totalChats,
          totalAudioCalls: schema.astrologers.totalAudioCalls,
          totalVideoCalls: schema.astrologers.totalVideoCalls,
          totalCalls: schema.astrologers.totalCalls,
          onlineStatus: schema.astrologers.onlineStatus,
          name: schema.users.name,
          avatar: schema.users.avatar,
          isChatEnabled: schema.astrologers.isChatEnabled,
          isAudioCallEnabled: schema.astrologers.isAudioCallEnabled,
          isVideoCallEnabled: schema.astrologers.isVideoCallEnabled,
        }
      })
      .from(schema.favoriteAstrologers)
      .innerJoin(schema.astrologers, eq(schema.favoriteAstrologers.astrologerId, schema.astrologers.userId))
      .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
      .where(eq(schema.favoriteAstrologers.userId, userId));

    return favs.map(f => ({
      ...f.astrologer,
      favoriteId: f.favoriteId,
      isFavorite: true
    }));
  }

  async toggleFavorite(userId: string, astrologerId: string) {
    const existing = await this.db
      .select()
      .from(schema.favoriteAstrologers)
      .where(
        and(
          eq(schema.favoriteAstrologers.userId, userId),
          eq(schema.favoriteAstrologers.astrologerId, astrologerId)
        )
      );

    if (existing.length > 0) {
      await this.db
        .delete(schema.favoriteAstrologers)
        .where(
          and(
            eq(schema.favoriteAstrologers.userId, userId),
            eq(schema.favoriteAstrologers.astrologerId, astrologerId)
          )
        );
      return { isFavorite: false };
    } else {
      await this.db
        .insert(schema.favoriteAstrologers)
        .values({
          userId,
          astrologerId,
        });
      return { isFavorite: true };
    }
  }

  async checkFavoriteStatus(userId: string, astrologerId: string) {
    const existing = await this.db
      .select()
      .from(schema.favoriteAstrologers)
      .where(
        and(
          eq(schema.favoriteAstrologers.userId, userId),
          eq(schema.favoriteAstrologers.astrologerId, astrologerId)
        )
      );
    return { isFavorite: existing.length > 0 };
  }
}
