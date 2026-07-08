import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
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
    const enriched = await Promise.all(conversations.map(async (c) => {
      const otherId = c.participantOneId === req.userId ? c.participantTwoId : c.participantOneId;
      const otherRole = c.participantOneId === req.userId ? c.participantTwoRole : c.participantOneRole;
      const unreadCount = await this.service.getUnreadCount(c.id, req.userId);
      const participantName = await this.getParticipantName(otherId, otherRole);
      return { ...c, participantId: otherId, participantRole: otherRole, participantName, unreadCount };
    }));
    return { data: enriched };
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    const conversation = await this.service.findById(id);
    const otherId = conversation.participantOneId === req.userId ? conversation.participantTwoId : conversation.participantOneId;
    const otherRole = conversation.participantOneId === req.userId ? conversation.participantTwoRole : conversation.participantOneRole;
    const unreadCount = await this.service.getUnreadCount(conversation.id, req.userId);
    const participantName = await this.getParticipantName(otherId, otherRole);
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

  private async getParticipantName(userId: string, role: string): Promise<string> {
    try {
      if (role === 'astrologer') {
        const a = await this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.id, userId) });
        return a?.name || 'Astrologer';
      }
      const u = await this.db.query.users.findFirst({ where: eq(schema.users.id, userId) });
      return u?.name || 'User';
    } catch {
      return role === 'astrologer' ? 'Astrologer' : 'User';
    }
  }
}
