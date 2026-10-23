import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AccessToken } from 'livekit-server-sdk';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from '../../common/realtime.service';
import { AstrologersService } from '../astrologers/astrologers.service';
import { AuthService } from '../auth/auth.service';
import { CallsService } from '../calls/calls.service';
import { CommissionService } from '../commission/commission.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { ConversationsService } from './conversations.service';

interface OnlineUserEntry {
  userId: string;
  role: string;
  socketIds: Set<string>;
  disconnectTimeout?: ReturnType<typeof setTimeout>;
}

interface ChatSession {
  conversationId: string;
  userId: string;
  astrologerId: string;
  rate: number;
  astrologerShareRate: number;
  startedAt: number;
  minutesCharged: number;
  totalCharged: number;
  totalEarned: number;
  interval: ReturnType<typeof setInterval>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  },
  path: '/ws',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, OnlineUserEntry>();
  private chatSessions = new Map<string, ChatSession>();

  constructor(
    private readonly authService: AuthService,
    private readonly conversationsService: ConversationsService,
    private readonly callsService: CallsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly astrologersService: AstrologersService,
    private readonly walletService: WalletService,
    private readonly commissionService: CommissionService,
  ) {}

  afterInit() {
    this.realtime.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    const token = (client.handshake.auth?.token as string) || (client.handshake.query.token as string);
    this.logger.debug(`[WS] Connection attempt - socketId: ${client.id}, hasToken: ${!!token}`);
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = await this.authService.validateToken(token);
      client.data.userId = payload.userId;
      client.data.role = payload.role || 'user';

      this.logger.debug(`[WS] Authenticated - userId: ${payload.userId}, socketId: ${client.id}`);

      const existing = this.onlineUsers.get(payload.userId);
      const isFirstConnection = !existing || existing.socketIds.size === 0;

      if (existing) {
        if (existing.disconnectTimeout) {
          clearTimeout(existing.disconnectTimeout);
          delete existing.disconnectTimeout;
          this.logger.debug(`[WS] Cleared pending disconnect timeout for userId: ${payload.userId}`);
        }
        existing.socketIds.add(client.id);
        existing.role = payload.role || 'user';
      } else {
        this.onlineUsers.set(payload.userId, {
          userId: payload.userId,
          role: payload.role || 'user',
          socketIds: new Set([client.id]),
        });
      }

      this.logger.debug(`[WS] User ${payload.userId} active sockets count: ${this.onlineUsers.get(payload.userId)?.socketIds.size}`);

      const manuallyOffline = this.realtime.isManuallyOffline(payload.userId);
      if (isFirstConnection && !manuallyOffline) {
        client.broadcast.emit('user:online', { userId: payload.userId, role: payload.role || 'user' });
      }

      const convs = await this.conversationsService.findByUser(payload.userId);
      this.logger.debug(`[WS] Auto-joining ${convs.length} rooms for userId: ${payload.userId}`);
      convs.forEach((c) => {
        client.join(`conversation:${c.id}`);
        this.logger.debug(`[WS] Joined room: conversation:${c.id}`);
      });

      // Send online status of ALL currently active users to this newly connected client
      for (const [id, u] of this.onlineUsers.entries()) {
        if (id !== payload.userId && u.socketIds.size > 0 && !this.realtime.isManuallyOffline(id)) {
          client.emit('user:online', { userId: id, role: u.role });
        }
      }
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const role = client.data.role;
    this.logger.debug(`[WS] Disconnect - socketId: ${client.id}, userId: ${userId}, role: ${role}`);
    if (!userId) return;

    const entry = this.onlineUsers.get(userId);
    if (!entry) return;

    entry.socketIds.delete(client.id);
    this.logger.debug(`[WS] User ${userId} remaining active sockets: ${entry.socketIds.size}`);

    // If user has other active sockets (e.g. ChatContext + CallContext, or reconnecting socket), do NOT mark offline!
    if (entry.socketIds.size > 0) {
      return;
    }

    // No active sockets remaining. Set a 5-second grace period before declaring offline.
    // This absorbs fast reconnects, screen toggles, and network handoffs without flickering offline.
    if (entry.disconnectTimeout) {
      clearTimeout(entry.disconnectTimeout);
    }

    entry.disconnectTimeout = setTimeout(async () => {
      const currentEntry = this.onlineUsers.get(userId);
      if (currentEntry && currentEntry.socketIds.size === 0) {
        this.onlineUsers.delete(userId);
        this.logger.debug(`[WS] Grace period expired. User ${userId} (${role}) marked offline`);
        this.server.emit('user:offline', { userId, role });

        this.stopChatSessionsForUser(userId);

        if (role === 'astrologer') {
          try {
            await this.astrologersService.setPresenceStatus(userId, 'offline');
          } catch (e: any) {
            this.logger.error('[WS] Failed to update astrologer offline status on disconnect:', e.message);
          }
        }
      }
    }, 5000);
  }

  @SubscribeMessage('users:get-online')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const list: { userId: string; role: string }[] = [];
    for (const [id, entry] of this.onlineUsers.entries()) {
      if (entry.socketIds.size > 0 && !this.realtime.isManuallyOffline(id)) {
        list.push({ userId: id, role: entry.role });
      }
    }
    client.emit('users:online-list', list);
  }

  @SubscribeMessage('user:check-online')
  handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (!data?.userId) return;
    const isOnline =
      this.isUserOnline(data.userId) &&
      !this.realtime.isManuallyOffline(data.userId);
    const entry = this.onlineUsers.get(data.userId);
    client.emit('user:status', {
      userId: data.userId,
      isOnline,
      role: entry?.role,
    });
  }

  private isUserOnline(userId: string): boolean {
    const entry = this.onlineUsers.get(userId);
    return !!entry && entry.socketIds.size > 0;
  }

  // ─── Chat Billing Sessions ───

  private chatSessionPayload(session: ChatSession) {
    return {
      conversationId: session.conversationId,
      userId: session.userId,
      astrologerId: session.astrologerId,
      startedAt: session.startedAt,
      elapsedSeconds: Math.max(
        0,
        Math.floor((Date.now() - session.startedAt) / 1000),
      ),
      rate: session.rate,
      astrologerShareRate: session.astrologerShareRate,
      minutesCharged: session.minutesCharged,
      totalCharged: Number(session.totalCharged.toFixed(2)),
      totalEarned: Number(session.totalEarned.toFixed(2)),
      isActive: true,
    };
  }

  private async startChatSession(conversationId: string, userId: string) {
    const existing = this.chatSessions.get(conversationId);
    if (existing) return existing;

    const conversation =
      await this.conversationsService.findById(conversationId);
    const astrologerId =
      conversation.participantOneRole === 'astrologer'
        ? conversation.participantOneId
        : conversation.participantTwoId;
    if (!astrologerId) return null;

    const astrologer = await this.astrologersService.findById(astrologerId);
    const rate = parseFloat(
      astrologer?.chatPricePerMin || astrologer?.pricePerMin || '5',
    );
    if (!Number.isFinite(rate) || rate <= 0) return null;

    const commission =
      await this.commissionService.findByAstrologerId(astrologerId);
    const percentage =
      commission && commission.isActive ? parseFloat(commission.value) : 10;
    const safePercentage = Math.max(
      0,
      Math.min(100, Number.isFinite(percentage) ? percentage : 10),
    );
    const astrologerShareRate = Number(
      (rate * (1 - safePercentage / 100)).toFixed(2),
    );

    const session: ChatSession = {
      conversationId,
      userId,
      astrologerId,
      rate,
      astrologerShareRate,
      startedAt: Date.now(),
      minutesCharged: 0,
      totalCharged: 0,
      totalEarned: 0,
      interval: setInterval(() => {
        void this.chargeChatMinute(conversationId);
      }, 60000),
    };
    this.chatSessions.set(conversationId, session);
    this.logger.log(
      `[ChatBilling] Started session ${conversationId} — ₹${rate.toFixed(2)}/min`,
    );

    const payload = this.chatSessionPayload(session);
    this.emitToUser(userId, 'chat:session', payload);
    this.emitToUser(astrologerId, 'chat:session', payload);
    return session;
  }

  private async chargeChatMinute(conversationId: string) {
    const session = this.chatSessions.get(conversationId);
    if (!session) return;

    try {
      const hasBalance = await this.walletService.checkSufficientBalance(
        session.userId,
        session.rate,
      );
      if (!hasBalance) {
        this.logger.warn(
          `[ChatBilling] Insufficient balance for ${session.userId} in ${conversationId}`,
        );
        this.emitToUser(session.userId, 'chat:blocked', {
          message:
            'Insufficient wallet balance. Please recharge to continue chatting.',
          code: 'insufficient_balance',
        });
        this.stopChatSession(conversationId, 'insufficient_balance');
        return;
      }

      session.minutesCharged += 1;
      const chargeReference = `chat-${session.conversationId}-${session.startedAt}-${session.minutesCharged}`;

      await this.walletService.deductFundsAtomic({
        userId: session.userId,
        amount: session.rate,
        description: `Chat with astrologer (${session.minutesCharged} min)`,
        category: 'chat_charge',
        referenceId: chargeReference,
        metadata: {
          durationSeconds: 60,
          minutesCharged: session.minutesCharged,
          rate: session.rate,
          astrologerId: session.astrologerId,
          conversationId: session.conversationId,
        },
      });

      await this.commissionService.distributeChatEarnings(
        session.astrologerId,
        session.conversationId,
        chargeReference,
        session.rate,
      );

      session.totalCharged = Number(
        (session.totalCharged + session.rate).toFixed(2),
      );
      session.totalEarned = Number(
        (session.totalEarned + session.astrologerShareRate).toFixed(2),
      );

      this.logger.log(
        `[ChatBilling] ${conversationId} minute ${session.minutesCharged}: ₹${session.rate.toFixed(2)} charged, ₹${session.astrologerShareRate.toFixed(2)} earned`,
      );

      const payload = this.chatSessionPayload(session);
      this.emitToUser(session.userId, 'chat:billing', payload);
      this.emitToUser(session.astrologerId, 'chat:billing', payload);
      this.realtime.emitToUser(session.userId, 'wallet:updated', {});
      this.realtime.broadcast('astrologer:stats-updated', {
        astrologerId: session.astrologerId,
      });
    } catch (e: any) {
      this.logger.error(
        `[ChatBilling] Failed to charge ${conversationId}: ${e.message}`,
      );
    }
  }

  private stopChatSession(conversationId: string, reason: string) {
    const session = this.chatSessions.get(conversationId);
    if (!session) return;

    clearInterval(session.interval);
    this.chatSessions.delete(conversationId);

    const payload = {
      ...this.chatSessionPayload(session),
      isActive: false,
      elapsedSeconds: Math.max(
        0,
        Math.floor((Date.now() - session.startedAt) / 1000),
      ),
      reason,
      endedAt: Date.now(),
    };
    this.emitToUser(session.userId, 'chat:session-end', payload);
    this.emitToUser(session.astrologerId, 'chat:session-end', payload);
    this.logger.log(
      `[ChatBilling] Stopped session ${conversationId} (${reason}) after ${session.minutesCharged} minute(s)`,
    );
  }

  private stopChatSessionsForUser(userId: string) {
    for (const [conversationId, session] of [
      ...this.chatSessions.entries(),
    ]) {
      if (session.userId === userId || session.astrologerId === userId) {
        this.stopChatSession(conversationId, 'disconnected');
      }
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.logger.debug(`[WS] join:conversation - socketId: ${client.id}, userId: ${client.data.userId}, conversationId: ${data.conversationId}`);
    client.join(`conversation:${data.conversationId}`);

    // Let clients that join mid-session restore the timer/earnings immediately.
    const activeSession = this.chatSessions.get(data.conversationId);
    if (activeSession) {
      client.emit('chat:session', this.chatSessionPayload(activeSession));
    }

    try {
      const conv = await this.conversationsService.findById(data.conversationId);
      const myId = client.data.userId;
      const otherId = conv.participantOneId === myId ? conv.participantTwoId : conv.participantOneId;
      const otherRole = conv.participantOneId === myId ? conv.participantTwoRole : conv.participantOneRole;

      if (otherId) {
        const otherOnline =
          this.isUserOnline(otherId) &&
          !this.realtime.isManuallyOffline(otherId);
        client.emit(otherOnline ? 'user:online' : 'user:offline', {
          userId: otherId,
          role: otherRole,
        });

        if (myId && !this.realtime.isManuallyOffline(myId)) {
          this.emitToUser(otherId, 'user:online', {
            userId: myId,
            role: client.data.role,
          });
        }
      }
    } catch (e: any) {
      this.logger.error(`[WS] Error in handleJoinConversation: ${e.message}`);
    }
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.logger.debug(`[WS] leave:conversation - socketId: ${client.id}, conversationId: ${data.conversationId}`);
    client.leave(`conversation:${data.conversationId}`);

    if (client.data.role === 'user') {
      const session = this.chatSessions.get(data.conversationId);
      if (session && session.userId === client.data.userId) {
        this.stopChatSession(data.conversationId, 'left_chat');
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: string; mediaUrl?: string },
  ) {
    const { userId, role } = client.data;
    this.logger.debug(`[WS] message:send RECEIVED - userId: ${userId}, socketId: ${client.id}, conversationId: ${data.conversationId}, content: "${data.content}"`);

    // Chat billing may only start once the astrologer has the chart inputs:
    // the auto birth-details message or a kundli/document attachment. Fail
    // closed so a lookup error can never start billing without a Kundli.
    let canStartBilling = role !== 'user';

    if (role === 'user') {
      try {
        const conv = await this.conversationsService.findById(data.conversationId);
        const astrologerId =
          conv.participantOneRole === 'astrologer'
            ? conv.participantOneId
            : conv.participantTwoRole === 'astrologer'
              ? conv.participantTwoId
              : null;

        if (astrologerId) {
          const astro = await this.astrologersService.findById(astrologerId);
          if (astro && astro.isChatEnabled === false) {
            this.emitToUser(userId, 'chat:blocked', {
              conversationId: data.conversationId,
              message: 'This astrologer has disabled chat consultations right now.',
              code: 'service_disabled',
            });
            return;
          }
        }

        const birth = await this.conversationsService.ensureBirthDetailsMessage(data.conversationId);
        if (birth.created) {
          const autoRoom = `conversation:${data.conversationId}`;
          client.emit('message:new', birth.created);
          client.to(autoRoom).emit('message:new', birth.created);
          client.to(autoRoom).emit('conversation:updated', {
            conversationId: data.conversationId,
            lastMessageAt: birth.created.createdAt,
            lastMessagePreview: birth.created.content,
          });
        }

        canStartBilling = data.mediaUrl
          ? true
          : birth.available ||
            (await this.conversationsService.hasKundliAttachment(data.conversationId));
      } catch (e: any) {
        this.logger.error(`[WS] Kundli precheck failed: ${e.message}`);
      }
    }

    const message = await this.conversationsService.createMessage(
      data.conversationId,
      userId,
      role,
      data.content,
      data.type || 'text',
      data.mediaUrl,
    );
    this.logger.debug(`[WS] Message persisted - messageId: ${message.id}`);

    if (role === 'user') {
      if (canStartBilling) {
        try {
          // The first message starts the live chat session; every full minute is
          // then charged by the session interval so the timer and the money move
          // together even when no new messages are sent.
          await this.startChatSession(data.conversationId, userId);
        } catch (e: any) {
          this.logger.error(`[WS] Failed to start chat billing: ${e.message}`);
        }
      } else {
        this.emitToUser(userId, 'chat:kundli-required', {
          conversationId: data.conversationId,
          message:
            'Share your birth details or attach your Kundli so the astrologer can start the consultation. The timer starts once it is available.',
        });
      }
    }

    const room = `conversation:${data.conversationId}`;
    const roomSockets = this.server.sockets.adapter.rooms.get(room);
    this.logger.debug(`[WS] Room "${room}" members before broadcast:`, roomSockets ? [...roomSockets] : 'room not found');

    client.emit('message:new', message);
    this.logger.debug(`[WS] Emitted message:new to sender socket: ${client.id}`);

    client.to(room).emit('message:new', message);
    this.logger.debug(`[WS] Emitted message:new to room "${room}" (excluding sender)`);

    client.to(room).emit('conversation:updated', {
      conversationId: data.conversationId,
      lastMessageAt: message.createdAt,
      lastMessagePreview: message.content,
    });

    const otherSocket = this.findOtherSocket(data.conversationId, userId);
    this.logger.debug(`[WS] findOtherSocket result:`, otherSocket ? `found socketId: ${otherSocket.id}` : 'null');

    if (otherSocket) {
      await this.conversationsService.markAsDelivered(data.conversationId, userId);
      this.logger.debug(`[WS] Marked messages as delivered for conversation: ${data.conversationId}`);
      client.emit('message:delivered', {
        messageId: message.id,
        conversationId: data.conversationId,
      });
      client.to(room).emit('message:delivered', {
        messageId: message.id,
        conversationId: data.conversationId,
      });
      this.logger.debug(`[WS] Emitted message:delivered to room`);
    } else {
      const otherUserId = await this.conversationsService.getOtherParticipant(data.conversationId, userId);
      this.logger.debug(`[WS] No other socket in room. Other userId: ${otherUserId}`);
      if (otherUserId) {
        const otherClient = this.findSocketByUserId(otherUserId);
        this.logger.debug(`[WS] findSocketByUserId(${otherUserId}):`, otherClient ? `found socketId: ${otherClient.id}` : 'null');
        if (otherClient) {
          otherClient.emit('message:new', message);
          otherClient.emit('conversation:new', { conversationId: data.conversationId });
          otherClient.join(room);
          this.logger.debug(`[WS] Emitted message:new directly to otherClient: ${otherClient.id} and joined room`);
        }
      }
    }
  }

  @SubscribeMessage('message:read')
  async handleReadReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { userId } = client.data;
    this.logger.debug(`[WS] message:read - userId: ${userId}, conversationId: ${data.conversationId}`);
    await this.conversationsService.markAsRead(data.conversationId, userId);
    this.server.to(`conversation:${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      readBy: userId,
    });
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  // ─── Call Signaling ───

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { astrologerId: string; type: 'audio' | 'video' },
  ) {
    const { userId, role } = client.data;
    this.logger.log(`[Call] Initiate - caller: ${userId} (${role}) -> astrologer: ${data.astrologerId}, type: ${data.type}`);

    const MIN_BALANCE = 10;
    const hasBalance = await this.walletService.checkSufficientBalance(userId, MIN_BALANCE);
    if (!hasBalance) {
      this.logger.warn(`[Call] Initiate blocked - insufficient balance for ${userId}`);
      client.emit('call:error', { message: 'Insufficient wallet balance. Please recharge to make a call.' });
      return;
    }

    const roomName = `call_${userId}_${data.astrologerId}_${Date.now()}`;
    const callerIdentity = userId;
    const calleeIdentity = data.astrologerId;

    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY', '');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET', '');
    let callerToken = '';
    let calleeToken = '';

    if (apiKey && apiSecret) {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: callerIdentity,
        name: callerIdentity,
      });
      at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
      callerToken = await at.toJwt();

      const at2 = new AccessToken(apiKey, apiSecret, {
        identity: calleeIdentity,
        name: calleeIdentity,
      });
      at2.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
      calleeToken = await at2.toJwt();
    }

    const astro = await this.astrologersService.findById(data.astrologerId);
    if (astro && data.type === 'audio' && astro.isAudioCallEnabled === false) {
      client.emit('call:error', { message: 'This astrologer has disabled voice call service right now.' });
      return;
    }
    if (astro && data.type === 'video' && astro.isVideoCallEnabled === false) {
      client.emit('call:error', { message: 'This astrologer has disabled video call service right now.' });
      return;
    }
    const ratePerMin = data.type === 'video'
      ? (astro?.videoCallPricePerMin || astro?.pricePerMin || '0')
      : (astro?.audioCallPricePerMin || astro?.pricePerMin || '0');

    const callLog = await this.callsService.create({
      astrologerId: data.astrologerId,
      userId,
      type: data.type,
      status: 'initiated',
      agoraChannel: roomName,
      agoraToken: callerToken,
      ratePerMin,
    });
    const caller = await this.usersService.findById(userId);
    const callerName = caller?.name || 'User';
    const astrologerSockets = this.findAllSocketsByUserId(data.astrologerId);
    if (astrologerSockets.length > 0) {
      this.logger.log(`[Call] Emitting call:incoming to astrologer ${data.astrologerId}, ${astrologerSockets.length} socket(s) found`);
      for (const sock of astrologerSockets) {
        sock.emit('call:incoming', {
          callId: callLog.id,
          callerId: userId,
          callerRole: role,
          callerName,
          type: data.type,
          channel: roomName,
          token: calleeToken,
        });
      }
    } else {
      this.logger.warn(`[Call] Astrologer ${data.astrologerId} has no active socket, call:incoming NOT delivered`);
    }
    client.emit('call:initiated', { callId: callLog.id, channel: roomName, token: callerToken });
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const call = await this.callsService.findById(data.callId);
    if (!call) {
      this.logger.warn(`[Call] Accept - call ${data.callId} not found`);
      return;
    }

    this.logger.log(`[Call] Accept - callId: ${data.callId}, caller: ${call.userId}, astrologer: ${call.astrologerId}`);

    const MIN_BALANCE = 10;
    const hasBalance = await this.walletService.checkSufficientBalance(call.userId, MIN_BALANCE);
    this.logger.log(`[Call] Balance check for ${call.userId}: ${hasBalance ? 'PASS' : 'FAIL'}`);

    if (!hasBalance) {
      this.logger.warn(`[Call] Insufficient balance for ${call.userId}`);
      this.emitToUser(call.userId, 'call:error', { message: 'Insufficient wallet balance to start call. Please recharge.' });
      client.emit('call:error', { message: 'Caller has insufficient wallet balance.' });
      await this.callsService.updateStatus(data.callId, 'cancelled');
      return;
    }

    await this.callsService.updateStatus(data.callId, 'ongoing');
    await this.callsService.updateStartedAt(data.callId);
    const callerSockets = this.findAllSocketsByUserId(call.userId);
    this.logger.log(`[Call] Emitting call:accepted to ${call.userId}, ${callerSockets.length} sockets found`);
    this.emitToUser(call.userId, 'call:accepted', { callId: data.callId, channel: call.agoraChannel, token: call.agoraToken });
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    await this.callsService.updateStatus(data.callId, 'cancelled');
    const call = await this.callsService.findById(data.callId);
    if (!call) return;
    this.emitToUser(call.userId, 'call:rejected', { callId: data.callId });
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const call = await this.callsService.findById(data.callId);
    if (!call) return;
    if (call.status === 'initiated') {
      await this.callsService.updateStatus(data.callId, 'missed');
      const otherUserId = call.userId === client.data.userId ? call.astrologerId : call.userId;
      this.emitToUser(otherUserId, 'call:missed', { callId: data.callId });
      client.emit('call:missed', { callId: data.callId });
      return;
    }
    const endedCall = await this.callsService.endCall(data.callId);
    if (!endedCall) return;
    const otherUserId = call.userId === client.data.userId ? call.astrologerId : call.userId;
    this.emitToUser(otherUserId, 'call:ended', { callId: data.callId, duration: endedCall.duration });
    client.emit('call:ended', { callId: data.callId, duration: endedCall.duration });
  }

  private findOtherSocket(conversationId: string, userId: string) {
    const room = this.server.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    if (!room) return null;
    for (const socketId of room) {
      const sock = this.server.sockets.sockets.get(socketId);
      if (sock && sock.data.userId !== userId) return sock;
    }
    return null;
  }

  private findSocketByUserId(userId: string): Socket | null {
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.userId === userId) return socket;
    }
    return null;
  }

  private findAllSocketsByUserId(userId: string): Socket[] {
    const sockets: Socket[] = [];
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.userId === userId) sockets.push(socket);
    }
    return sockets;
  }

  private emitToUser(userId: string, event: string, data: any) {
    for (const sock of this.findAllSocketsByUserId(userId)) {
      sock.emit(event, data);
    }
  }
}
