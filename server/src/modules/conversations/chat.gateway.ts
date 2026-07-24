import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ConversationsService } from './conversations.service';
import { CallsService } from '../calls/calls.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { RealtimeService } from '../../common/realtime.service';
import { AstrologersService } from '../astrologers/astrologers.service';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from '../commission/commission.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  },
  path: '/ws',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, { userId: string; role: string; socketId: string }>();
  private lastChatCharge = new Map<string, number>();

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

      this.onlineUsers.set(payload.userId, {
        userId: payload.userId,
        role: payload.role || 'user',
        socketId: client.id,
      });

      this.logger.debug(`[WS] Online users map:`, Object.fromEntries(this.onlineUsers));

      client.broadcast.emit('user:online', { userId: payload.userId, role: payload.role || 'user' });

      if (payload.role === 'astrologer') {
        try {
          await this.astrologersService.updateOnlineStatus(payload.userId, 'online');
        } catch (e: any) {
          this.logger.error('[WS] Failed to update astrologer online status on connect:', e.message);
        }
      }

      const convs = await this.conversationsService.findByUser(payload.userId);
      this.logger.debug(`[WS] Auto-joining ${convs.length} rooms for userId: ${payload.userId}`);
      convs.forEach((c) => {
        client.join(`conversation:${c.id}`);
        this.logger.debug(`[WS] Joined room: conversation:${c.id}`);
      });

      const onlineParticipantIds = new Set<string>();
      for (const conv of convs) {
        const otherId = conv.participantOneId === payload.userId ? conv.participantTwoId : conv.participantOneId;
        if (this.onlineUsers.has(otherId)) {
          onlineParticipantIds.add(otherId);
        }
      }
      onlineParticipantIds.forEach((id) => {
        const u = this.onlineUsers.get(id);
        if (u) {
          client.emit('user:online', { userId: id, role: u.role });
          this.logger.debug(`[WS] Sent online status to ${client.id} for userId: ${id}`);
        }
      });
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const role = client.data.role;
    this.logger.debug(`[WS] Disconnect - socketId: ${client.id}, userId: ${userId}, role: ${role}`);
    if (userId) {
      this.onlineUsers.delete(userId);
      this.logger.debug(`[WS] Online users map after disconnect:`, Object.fromEntries(this.onlineUsers));
      client.broadcast.emit('user:offline', { userId, role });

      if (role === 'astrologer') {
        try {
          await this.astrologersService.updateOnlineStatus(userId, 'offline');
        } catch (e: any) {
          this.logger.error('[WS] Failed to update astrologer offline status on disconnect:', e.message);
        }
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
    const room = this.server.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
    this.logger.debug(`[WS] Room members after join:`, room ? [...room] : 'room not found');
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.logger.debug(`[WS] leave:conversation - socketId: ${client.id}, conversationId: ${data.conversationId}`);
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: string },
  ) {
    const { userId, role } = client.data;
    this.logger.debug(`[WS] message:send RECEIVED - userId: ${userId}, socketId: ${client.id}, conversationId: ${data.conversationId}, content: "${data.content}"`);

    const message = await this.conversationsService.createMessage(
      data.conversationId,
      userId,
      role,
      data.content,
      data.type || 'text',
    );
    this.logger.debug(`[WS] Message persisted - messageId: ${message.id}`);

    if (role === 'user') {
      try {
        const conversation = await this.conversationsService.findById(data.conversationId);
        const astrologerId = conversation.participantOneRole === 'astrologer'
          ? conversation.participantOneId
          : conversation.participantTwoId;
        const astrologer = await this.astrologersService.findById(astrologerId);
        const chatPrice = parseFloat(astrologer?.chatPricePerMin || '5');

        // Per-minute charging: charge chatPrice every 60 seconds
        const now = Date.now();
        const lastCharge = this.lastChatCharge.get(data.conversationId) || 0;

        if (lastCharge === 0) {
          // First message: start the timer without charging
          this.lastChatCharge.set(data.conversationId, now);
        } else if (now - lastCharge >= 60000) {
          // Check balance first
          const hasBalance = await this.walletService.checkSufficientBalance(userId, chatPrice);
          if (!hasBalance) {
            client.emit('chat:blocked', {
              message: 'Insufficient wallet balance. Please recharge to continue chatting.',
            });
            return;
          }

          this.lastChatCharge.set(data.conversationId, now);

          await this.walletService.deductFundsAtomic({
            userId,
            amount: chatPrice,
            description: 'Chat per minute',
            category: 'chat_charge',
            referenceId: message.id,
          });

          await this.commissionService.distributeChatEarnings(
            astrologerId,
            data.conversationId,
            message.id,
            chatPrice,
          );
        }
      } catch (e: any) {
        this.logger.error(`[WS] Failed to deduct chat charge: ${e.message}`);
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
    const channelName = `call_${userId}_${data.astrologerId}_${Date.now()}`;
    const appId = this.configService.get<string>('AGORA_APP_ID', '');
    const appCert = this.configService.get<string>('AGORA_APP_CERTIFICATE', '');
    const uid = Math.floor(Math.random() * 100000);
    let token = '';
    if (appId && appCert) {
      token = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channelName, uid, RtcRole.PUBLISHER, Math.floor(Date.now() / 1000) + 3600);
    }
    const astro = await this.astrologersService.findById(data.astrologerId);
    const ratePerMin = data.type === 'video'
      ? (astro?.videoCallPricePerMin || astro?.pricePerMin || '0')
      : (astro?.audioCallPricePerMin || astro?.pricePerMin || '0');

    const callLog = await this.callsService.create({
      astrologerId: data.astrologerId,
      userId,
      type: data.type,
      status: 'initiated',
      agoraChannel: channelName,
      agoraToken: token,
      ratePerMin,
    });
    const caller = await this.usersService.findById(userId);
    const callerName = caller?.name || 'User';
    const astrologerSocket = this.findSocketByUserId(data.astrologerId);
    if (astrologerSocket) {
      astrologerSocket.emit('call:incoming', {
        callId: callLog.id,
        callerId: userId,
        callerRole: role,
        callerName,
        type: data.type,
        channel: channelName,
        token,
        uid,
      });
    }
    client.emit('call:initiated', { callId: callLog.id, channel: channelName, token, uid });
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const call = await this.callsService.findById(data.callId);
    if (!call) return;

    const MIN_BALANCE = 10;
    const hasBalance = await this.walletService.checkSufficientBalance(call.userId, MIN_BALANCE);
    if (!hasBalance) {
      const callerSocket = this.findSocketByUserId(call.userId);
      if (callerSocket) {
        callerSocket.emit('call:error', { message: 'Insufficient wallet balance to start call. Please recharge.' });
      }
      client.emit('call:error', { message: 'Caller has insufficient wallet balance.' });
      await this.callsService.updateStatus(data.callId, 'cancelled');
      return;
    }

    await this.callsService.updateStatus(data.callId, 'ongoing');
    await this.callsService.updateStartedAt(data.callId);
    const callerSocket = this.findSocketByUserId(call.userId);
    if (callerSocket) {
      callerSocket.emit('call:accepted', { callId: data.callId, channel: call.agoraChannel, token: call.agoraToken });
    }
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    await this.callsService.updateStatus(data.callId, 'cancelled');
    const call = await this.callsService.findById(data.callId);
    if (!call) return;
    const callerSocket = this.findSocketByUserId(call.userId);
    if (callerSocket) {
      callerSocket.emit('call:rejected', { callId: data.callId });
    }
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
      const otherSocket = this.findSocketByUserId(otherUserId);
      if (otherSocket) otherSocket.emit('call:missed', { callId: data.callId });
      client.emit('call:missed', { callId: data.callId });
      return;
    }
    const endedCall = await this.callsService.endCall(data.callId);
    if (!endedCall) return;
    const otherUserId = call.userId === client.data.userId ? call.astrologerId : call.userId;
    const otherSocket = this.findSocketByUserId(otherUserId);
    if (otherSocket) otherSocket.emit('call:ended', { callId: data.callId, duration: endedCall.duration });
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
}
