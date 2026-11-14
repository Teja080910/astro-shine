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
import { KundliService } from '../kundli/kundli.service';

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
  /** When the session was created — used only for display. */
  startedAt: number;
  /**
   * Milliseconds both parties were actually connected. This is the only thing
   * that is billed, so a paused session costs the user nothing.
   */
  billableMs: number;
  /** Timestamp of the previous tick, used to measure elapsed connected time. */
  lastTickAt: number;
  /** True while both parties are online and the meter is running. */
  isBillable: boolean;
  /**
   * The astrologer has replied at least once since the user's first message.
   * Billing stays at zero until this is true.
   */
  astrologerHasReplied: boolean;
  /** Why the meter is currently paused (either party offline, etc). */
  pauseReason?: string;
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
    private readonly kundliService: KundliService,
  ) {}

  afterInit() {
    this.realtime.setServer(this.server);

    // Astrologers can toggle themselves offline while keeping their socket.
    // Pause or resume billing the moment that happens.
    this.realtime.onAvailabilityChange((userId) => {
      for (const session of this.chatSessions.values()) {
        if (session.userId === userId || session.astrologerId === userId) {
          this.refreshChatSessionBilling(session);
        }
      }
    });
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

      // A reconnecting party resumes any paused session they are part of.
      this.resumeChatSessionsForUser(payload.userId);

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

    // Stop the meter immediately rather than waiting for the grace period, so
    // a closed app never bills a few extra seconds.
    this.pauseChatSessionsForUser(userId);

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

        // They never came back — end the session rather than leaving it paused
        // forever. A reconnect starts a fresh session.
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
    // Elapsed time reflects billable (both-online) time, plus any partial
    // segment accrued since the last tick so the counter moves smoothly.
    const liveMs =
      session.isBillable && session.lastTickAt
        ? Date.now() - session.lastTickAt
        : 0;
    return {
      conversationId: session.conversationId,
      userId: session.userId,
      astrologerId: session.astrologerId,
      startedAt: session.startedAt,
      elapsedSeconds: Math.max(
        0,
        Math.floor((session.billableMs + liveMs) / 1000),
      ),
      rate: session.rate,
      astrologerShareRate: session.astrologerShareRate,
      minutesCharged: session.minutesCharged,
      totalCharged: Number(session.totalCharged.toFixed(2)),
      totalEarned: Number(session.totalEarned.toFixed(2)),
      isActive: true,
      // The client uses this to show "paused" instead of a running meter.
      isBillable: session.isBillable,
      astrologerHasReplied: session.astrologerHasReplied,
      pauseReason: session.pauseReason,
    };
  }

  private async startChatSession(conversationId: string, callerId?: string) {
    const existing = this.chatSessions.get(conversationId);
    if (existing) return existing;

    const conversation =
      await this.conversationsService.findById(conversationId);

    // The payer is always the user participant, never the caller. The session
    // can now be started from the astrologer's side (their first reply), so the
    // id passed in must not be assumed to be the user.
    const astrologerId =
      conversation.participantOneRole === 'astrologer'
        ? conversation.participantOneId
        : conversation.participantTwoRole === 'astrologer'
          ? conversation.participantTwoId
          : null;
    const userId =
      conversation.participantOneRole === 'user'
        ? conversation.participantOneId
        : conversation.participantTwoRole === 'user'
          ? conversation.participantTwoId
          : null;
    if (!astrologerId || !userId) return null;
    if (callerId && callerId !== userId && callerId !== astrologerId) {
      this.logger.warn(
        `[ChatBilling] Ignoring session start from non-participant ${callerId}`,
      );
      return null;
    }

    const astrologer = await this.astrologersService.findById(astrologerId);
    const rate = parseFloat(
      astrologer?.chatPricePerMin || astrologer?.pricePerMin || '5',
    );
    if (!Number.isFinite(rate) || rate <= 0) return null;

    const commission =
      await this.commissionService.findByAstrologerId(astrologerId);
    const percentage =
      commission && commission.isActive
        ? parseFloat(commission.value)
        : CommissionService.DEFAULT_TOTAL_PERCENT;
    const safePercentage = Math.max(
      0,
      Math.min(
        100,
        Number.isFinite(percentage)
          ? percentage
          : CommissionService.DEFAULT_TOTAL_PERCENT,
      ),
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
      billableMs: 0,
      lastTickAt: Date.now(),
      isBillable: false,
      astrologerHasReplied: false,
      pauseReason: 'waiting_for_astrologer',
      minutesCharged: 0,
      totalCharged: 0,
      totalEarned: 0,
      // A short tick lets the meter start and stop close to the real moment a
      // party goes offline, instead of billing a whole minute that never
      // happened. Charges are still applied in full-minute units.
      interval: setInterval(() => {
        void this.tickChatSession(conversationId);
      }, ChatGateway.CHAT_TICK_MS),
    };
    this.chatSessions.set(conversationId, session);

    // Only bill when both parties are genuinely online right now.
    this.refreshChatSessionBilling(session);

    this.logger.log(
      `[ChatBilling] Started session ${conversationId} — ₹${rate.toFixed(2)}/min` +
        ` (billable: ${session.isBillable})`,
    );

    const payload = this.chatSessionPayload(session);
    this.emitToUser(userId, 'chat:session', payload);
    this.emitToUser(astrologerId, 'chat:session', payload);
    return session;
  }

  /** How often the meter is sampled. Charges are billed per full minute. */
  private static readonly CHAT_TICK_MS = 5000;

  /**
   * Is this user online *and* available for this chat?
   * A socket alone is not enough — an astrologer who has toggled themselves
   * offline keeps their socket, and must not be billed against.
   */
  private isUserOnlineAndAvailable(userId: string): boolean {
    if (!this.isUserOnline(userId)) return false;
    if (this.realtime.isManuallyOffline(userId)) return false;
    return true;
  }

  /**
   * Re-evaluate whether the meter should run. Returns true when the session
   * was paused or resumed by this call, so callers can broadcast the change.
   */
  private refreshChatSessionBilling(session: ChatSession): boolean {
    const userOnline = this.isUserOnlineAndAvailable(session.userId);
    const astrologerOnline = this.isUserOnlineAndAvailable(session.astrologerId);

    // Both presence AND an astrologer reply are required before billing.
    const shouldBill =
      userOnline && astrologerOnline && session.astrologerHasReplied;
    const reason = shouldBill
      ? undefined
      : !session.astrologerHasReplied
        ? 'waiting_for_astrologer'
        : !userOnline && !astrologerOnline
          ? 'both_offline'
          : !astrologerOnline
            ? 'astrologer_offline'
            : 'user_offline';

    if (shouldBill === session.isBillable && reason === session.pauseReason) {
      return false;
    }

    // Close out the segment that was running before switching state.
    if (session.isBillable && session.lastTickAt) {
      session.billableMs += Math.max(0, Date.now() - session.lastTickAt);
    }
    session.lastTickAt = Date.now();
    session.isBillable = shouldBill;
    session.pauseReason = reason;

    const payload = this.chatSessionPayload(session);
    this.emitToUser(session.userId, 'chat:session', payload);
    this.emitToUser(session.astrologerId, 'chat:session', payload);

    this.logger.log(
      shouldBill
        ? `[ChatBilling] ${session.conversationId} resumed — both parties online`
        : `[ChatBilling] ${session.conversationId} paused (${reason})`,
    );
    return true;
  }

  /**
   * Sample the session every few seconds.
   *
   * Money only moves for the time both parties were actually connected:
   *  1. freeze the segment that ran since the previous tick (if billable)
   *  2. re-check presence and pause/resume the meter
   *  3. charge for each whole minute of *billable* time not yet paid for
   *
   * This replaces the old fixed 60s timer which charged a full minute
   * regardless of whether the astrologer (or user) had gone offline.
   */
  private async tickChatSession(conversationId: string) {
    const session = this.chatSessions.get(conversationId);
    if (!session) return;

    try {
      // 0. Re-confirm the astrologer has replied. Cheap, and it means a missed
      //    socket event can never leave the meter stuck at zero.
      if (!session.astrologerHasReplied) {
        const replied = await this.conversationsService.hasAstrologerReplied(
          conversationId,
        );
        if (replied) {
          session.astrologerHasReplied = true;
          this.logger.log(
            `[ChatBilling] Astrologer reply detected on tick for ${conversationId}`,
          );
        }
      }

      // 1. Accrue elapsed time for the segment that just finished.
      if (session.isBillable && session.lastTickAt) {
        session.billableMs += Math.max(0, Date.now() - session.lastTickAt);
      }
      session.lastTickAt = Date.now();

      // 2. Pause or resume based on presence and whether the astrologer replied.
      this.refreshChatSessionBilling(session);

      // 3. Charge only whole minutes of billable time.
      const payableMinutes = Math.floor(session.billableMs / 60000);
      while (session.minutesCharged < payableMinutes) {
        const charged = await this.chargeNextMinute(session);
        if (!charged) return;
      }

      // Keep the client's clock in sync even when nothing is charged.
      if (session.isBillable) {
        const payload = this.chatSessionPayload(session);
        this.emitToUser(session.userId, 'chat:tick', payload);
        this.emitToUser(session.astrologerId, 'chat:tick', payload);
      }
    } catch (e: any) {
      this.logger.error(
        `[ChatBilling] Tick failed for ${conversationId}: ${e.message}`,
      );
    }
  }

  /**
   * Charge the user for one more billable minute.
   * Returns false when the session was stopped (e.g. insufficient balance).
   */
  private async chargeNextMinute(session: ChatSession): Promise<boolean> {
    const hasBalance = await this.walletService.checkSufficientBalance(
      session.userId,
      session.rate,
    );
    if (!hasBalance) {
      this.logger.warn(
        `[ChatBilling] Insufficient balance for ${session.userId} in ${session.conversationId}`,
      );
      this.emitToUser(session.userId, 'chat:blocked', {
        message:
          'Insufficient wallet balance. Please recharge to continue chatting.',
        code: 'insufficient_balance',
      });
      this.stopChatSession(session.conversationId, 'insufficient_balance');
      return false;
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
      `[ChatBilling] ${session.conversationId} minute ${session.minutesCharged}: ` +
        `₹${session.rate.toFixed(2)} charged, ₹${session.astrologerShareRate.toFixed(2)} earned`,
    );

    const payload = this.chatSessionPayload(session);
    this.emitToUser(session.userId, 'chat:billing', payload);
    this.emitToUser(session.astrologerId, 'chat:billing', payload);
    this.realtime.emitToUser(session.userId, 'wallet:updated', {});
    this.realtime.broadcast('astrologer:stats-updated', {
      astrologerId: session.astrologerId,
    });
    return true;
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

  /** Re-evaluate sessions after a reconnect so the meter resumes. */
  private resumeChatSessionsForUser(userId: string) {
    for (const session of this.chatSessions.values()) {
      if (session.userId === userId || session.astrologerId === userId) {
        this.refreshChatSessionBilling(session);
      }
    }
  }

  /**
   * Pause any session involving this user without ending it. Used for brief
   * socket loss so the meter stops but the conversation can resume.
   */
  private pauseChatSessionsForUser(userId: string) {
    for (const session of this.chatSessions.values()) {
      if (session.userId === userId || session.astrologerId === userId) {
        this.refreshChatSessionBilling(session);
      }
    }
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
      // The user's own message never starts the meter. Requirements: billing
      // begins only once BOTH parties are online AND the astrologer has replied.
      // Presence is enforced by the session tick; the reply is enforced here and
      // on the astrologer's next message.
      if (!canStartBilling) {
        this.emitToUser(userId, 'chat:kundli-required', {
          conversationId: data.conversationId,
          message:
            'Share your birth details or attach your Kundli so the astrologer can start the consultation. The timer starts once it is available.',
        });
      } else {
        // Tell the user the consultation is waiting for the astrologer, so the
        // UI can show "waiting for astrologer" instead of a running timer.
        this.emitToUser(userId, 'chat:awaiting-astrologer', {
          conversationId: data.conversationId,
          message: 'Waiting for the astrologer to reply. Billing starts when they do.',
        });
      }
    }

    // An astrologer's message is what officially starts a billable consultation.
    if (role === 'astrologer') {
      try {
        // Confirm from the database rather than trusting the socket, so the
        // flag is correct even after a reconnect or a server restart.
        const replied = await this.conversationsService.hasAstrologerReplied(
          data.conversationId,
        );

        let session: ChatSession | null | undefined =
          this.chatSessions.get(data.conversationId);
        if (!session) {
          session = await this.startChatSession(data.conversationId, userId);
        }

        if (session && replied && !session.astrologerHasReplied) {
          session.astrologerHasReplied = true;
          // Re-evaluate now: if both parties are online the meter starts
          // immediately instead of waiting for the next tick.
          this.refreshChatSessionBilling(session);
          this.logger.log(
            `[ChatBilling] Astrologer replied in ${data.conversationId} — billing unlocked`,
          );
        }
      } catch (e: any) {
        this.logger.error(
          `[WS] Failed to start chat session on astrologer reply: ${e.message}`,
        );
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

  /**
   * Generate a Kundli with the third-party astrology API and post it into the
   * conversation as a rich `kundli` message.
   *
   * Previously the client sent the birth details as plain text, so no chart was
   * produced and the astrologer only saw a few lines. Now the server computes
   * the chart and shares the full payload, which the client renders inline.
   */
  @SubscribeMessage('kundli:share')
  async handleShareKundli(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      name: string;
      dateOfBirth: string;
      timeOfBirth: string;
      placeOfBirth: string;
      gender?: string;
      latitude?: number;
      longitude?: number;
      timezone?: number;
    },
  ) {
    const { userId, role } = client.data;

    if (!data?.conversationId) return;
    if (!data.dateOfBirth || !data.timeOfBirth || !data.placeOfBirth) {
      client.emit('kundli:share-error', {
        conversationId: data.conversationId,
        message: 'Date of birth, time of birth and place are required.',
      });
      return;
    }

    try {
      const chart = await this.kundliService.create({
        userId,
        name: data.name || 'Birth chart',
        gender: (data.gender as any) || 'male',
        dateOfBirth: data.dateOfBirth,
        timeOfBirth: data.timeOfBirth,
        placeOfBirth: data.placeOfBirth,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone !== undefined ? String(data.timezone) : undefined,
      } as any);

      const chartData: any = (chart as any).chartData || {};
      const lagnaRashi: string | undefined = chartData?.lagna?.rashi;
      const summary = [
        `Kundli – ${chart.name}`,
        lagnaRashi ? `Lagna: ${lagnaRashi}` : null,
        `DOB: ${chart.dateOfBirth}`,
        `Time: ${chart.timeOfBirth}`,
        `Place: ${chart.placeOfBirth}`,
      ]
        .filter(Boolean)
        .join('\n');

      const message = await this.conversationsService.createMessage(
        data.conversationId,
        userId,
        role,
        summary,
        'kundli',
        undefined,
        {
          kundliId: chart.id,
          name: chart.name,
          gender: chart.gender,
          dateOfBirth: chart.dateOfBirth,
          timeOfBirth: chart.timeOfBirth,
          placeOfBirth: chart.placeOfBirth,
          chartData: chart.chartData,
        },
      );

      const room = `conversation:${data.conversationId}`;
      client.emit('message:new', message);
      client.to(room).emit('message:new', message);
      client.to(room).emit('conversation:updated', {
        conversationId: data.conversationId,
        lastMessageAt: message.createdAt,
        lastMessagePreview: message.content,
      });

      const otherSocket = this.findOtherSocket(data.conversationId, userId);
      if (otherSocket) {
        await this.conversationsService.markAsDelivered(data.conversationId, userId);
        client.emit('message:delivered', {
          messageId: message.id,
          conversationId: data.conversationId,
        });
        client.to(room).emit('message:delivered', {
          messageId: message.id,
          conversationId: data.conversationId,
        });
      } else {
        const otherUserId =
          await this.conversationsService.getOtherParticipant(
            data.conversationId,
            userId,
          );
        if (otherUserId) {
          const otherClient = this.findSocketByUserId(otherUserId);
          if (otherClient) {
            otherClient.emit('message:new', message);
            otherClient.emit('conversation:new', {
              conversationId: data.conversationId,
            });
            otherClient.join(room);
          }
        }
      }

      this.logger.log(
        `[Chat] Kundli ${chart.id} shared in conversation ${data.conversationId}`,
      );
    } catch (e: any) {
      this.logger.error(`[Chat] Kundli share failed: ${e.message}`);
      client.emit('kundli:share-error', {
        conversationId: data.conversationId,
        message:
          e?.response?.data?.message ||
          e?.message ||
          'Could not generate the Kundli. Please try again.',
      });
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
