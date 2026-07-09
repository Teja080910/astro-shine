import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ConversationsService } from './conversations.service';
import { CallsService } from '../calls/calls.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  path: '/ws',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, { userId: string; role: string; socketId: string }>();

  constructor(
    private readonly authService: AuthService,
    private readonly conversationsService: ConversationsService,
    private readonly callsService: CallsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    console.log(`[WS] Connection attempt - socketId: ${client.id}, hasToken: ${!!token}`);
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = await this.authService.validateToken(token);
      client.data.userId = payload.userId;
      client.data.role = payload.role || 'user';

      console.log(`[WS] Authenticated - userId: ${payload.userId}, socketId: ${client.id}`);

      this.onlineUsers.set(payload.userId, {
        userId: payload.userId,
        role: 'user',
        socketId: client.id,
      });

      console.log(`[WS] Online users map:`, Object.fromEntries(this.onlineUsers));

      client.broadcast.emit('user:online', { userId: payload.userId, role: 'user' });

      const convs = await this.conversationsService.findByUser(payload.userId);
      console.log(`[WS] Auto-joining ${convs.length} rooms for userId: ${payload.userId}`);
      convs.forEach((c) => {
        client.join(`conversation:${c.id}`);
        console.log(`[WS] Joined room: conversation:${c.id}`);
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
          console.log(`[WS] Sent online status to ${client.id} for userId: ${id}`);
        }
      });
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    console.log(`[WS] Disconnect - socketId: ${client.id}, userId: ${userId}`);
    if (userId) {
      this.onlineUsers.delete(userId);
      console.log(`[WS] Online users map after disconnect:`, Object.fromEntries(this.onlineUsers));
      client.broadcast.emit('user:offline', { userId, role: client.data.role });
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    console.log(`[WS] join:conversation - socketId: ${client.id}, userId: ${client.data.userId}, conversationId: ${data.conversationId}`);
    client.join(`conversation:${data.conversationId}`);
    const room = this.server.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
    console.log(`[WS] Room members after join:`, room ? [...room] : 'room not found');
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    console.log(`[WS] leave:conversation - socketId: ${client.id}, conversationId: ${data.conversationId}`);
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: string },
  ) {
    const { userId, role } = client.data;
    console.log(`[WS] message:send RECEIVED - userId: ${userId}, socketId: ${client.id}, conversationId: ${data.conversationId}, content: "${data.content}"`);

    const message = await this.conversationsService.createMessage(
      data.conversationId,
      userId,
      role,
      data.content,
      data.type || 'text',
    );
    console.log(`[WS] Message persisted - messageId: ${message.id}`);

    const room = `conversation:${data.conversationId}`;
    const roomSockets = this.server.sockets.adapter.rooms.get(room);
    console.log(`[WS] Room "${room}" members before broadcast:`, roomSockets ? [...roomSockets] : 'room not found');

    client.emit('message:new', message);
    console.log(`[WS] Emitted message:new to sender socket: ${client.id}`);

    client.to(room).emit('message:new', message);
    console.log(`[WS] Emitted message:new to room "${room}" (excluding sender)`);

    client.to(room).emit('conversation:updated', {
      conversationId: data.conversationId,
      lastMessageAt: message.createdAt,
      lastMessagePreview: message.content,
    });

    const otherSocket = this.findOtherSocket(data.conversationId, userId);
    console.log(`[WS] findOtherSocket result:`, otherSocket ? `found socketId: ${otherSocket.id}` : 'null');

    if (otherSocket) {
      await this.conversationsService.markAsDelivered(data.conversationId, userId);
      console.log(`[WS] Marked messages as delivered for conversation: ${data.conversationId}`);
      client.emit('message:delivered', {
        messageId: message.id,
        conversationId: data.conversationId,
      });
      client.to(room).emit('message:delivered', {
        messageId: message.id,
        conversationId: data.conversationId,
      });
      console.log(`[WS] Emitted message:delivered to room`);
    } else {
      const otherUserId = await this.conversationsService.getOtherParticipant(data.conversationId, userId);
      console.log(`[WS] No other socket in room. Other userId: ${otherUserId}`);
      if (otherUserId) {
        const otherClient = this.findSocketByUserId(otherUserId);
        console.log(`[WS] findSocketByUserId(${otherUserId}):`, otherClient ? `found socketId: ${otherClient.id}` : 'null');
        if (otherClient) {
          otherClient.emit('message:new', message);
          otherClient.emit('conversation:new', { conversationId: data.conversationId });
          otherClient.join(room);
          console.log(`[WS] Emitted message:new directly to otherClient: ${otherClient.id} and joined room`);
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
    console.log(`[WS] message:read - userId: ${userId}, conversationId: ${data.conversationId}`);
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
    const callLog = await this.callsService.create({
      astrologerId: data.astrologerId,
      userId,
      type: data.type,
      status: 'initiated',
      agoraChannel: channelName,
      agoraToken: token,
      ratePerMin: '0',
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
