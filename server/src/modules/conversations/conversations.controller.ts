import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ConversationsService } from './conversations.service';
import * as schema from '../../db/schemas';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(
    private readonly service: ConversationsService,
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  @Get()
  async list(@Req() req: any) {
    const conversations = await this.service.findByUser(req.userId);
    const participantIds = new Set<string>();
    for (const c of conversations) {
      const otherId = c.participantOneId === req.userId ? c.participantTwoId : c.participantOneId;
      participantIds.add(otherId);
    }
    const names = await this.batchGetParticipantNames([...participantIds]);
    const unreadMap = await this.service.getUnreadCounts(conversations.map(c => c.id), req.userId);
    const enriched = conversations.map((c) => {
      const otherId = c.participantOneId === req.userId ? c.participantTwoId : c.participantOneId;
      const otherRole = c.participantOneId === req.userId ? c.participantTwoRole : c.participantOneRole;
      return { ...c, participantId: otherId, participantRole: otherRole, participantName: names.get(otherId) || (otherRole === 'astrologer' ? 'Astrologer' : 'User'), unreadCount: unreadMap[c.id] || 0 };
    });
    return { data: enriched };
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    const conversation = await this.service.findById(id);
    const otherId = conversation.participantOneId === req.userId ? conversation.participantTwoId : conversation.participantOneId;
    const otherRole = conversation.participantOneId === req.userId ? conversation.participantTwoRole : conversation.participantOneRole;
    const unreadCount = await this.service.getUnreadCount(conversation.id, req.userId);
    const names = await this.batchGetParticipantNames([otherId]);
    const participantName = names.get(otherId) || (otherRole === 'astrologer' ? 'Astrologer' : 'User');
    return { ...conversation, participantId: otherId, participantRole: otherRole, participantName, unreadCount };
  }

  @Post()
  async create(@Body() body: { participantId: string; participantRole: string }, @Req() req: any) {
    return this.service.createOrGet(req.userId, req.userRole || 'user', body.participantId, body.participantRole);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
  ) {
    return this.service.getMessages(id, cursor, limit ? parseInt(limit, 10) : 20);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string; type?: string },
    @Req() req: any,
  ) {
    return this.service.createMessage(id, req.userId, req.userRole || 'user', body.content, body.type);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.deleteConversation(id);
    return { success: true };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.service.markAsRead(id, req.userId);
    const unreadCount = await this.service.getUnreadCount(id, req.userId);
    return { unreadCount };
  }

  private async batchGetParticipantNames(userIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (userIds.length === 0) return map;
    const users = await this.db.query.users.findMany({
      where: (users: any, { inArray }: any) => inArray(users.id, userIds),
    });
    for (const u of users) map.set(u.id, u.name || 'User');
    const astroRows = await this.db.select({
      id: schema.astrologers.userId,
      name: schema.users.name,
    })
    .from(schema.astrologers)
    .leftJoin(schema.users, eq(schema.astrologers.userId, schema.users.id))
    .where(inArray(schema.astrologers.userId, userIds));
    for (const a of astroRows) map.set(a.id, a.name || 'Astrologer');
    return map;
  }
}
