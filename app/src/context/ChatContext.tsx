import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../shared/api-client';
import type { Conversation, ConversationMessage } from '../shared/types';
import { config } from '../config';
import { useAuth } from './AuthContext';

interface ChatState {
  connected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ConversationMessage[];
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, string | null>;
  unreadCounts: Record<string, number>;
  loading: boolean;
  hasMore: boolean;
  chatBlockedMessage: string | null;
  clearChatBlocked: () => void;
  astrologerStatuses: Record<string, 'online' | 'offline' | 'busy'>;
  horoscopeVersion: number;
  panchangVersion: number;
  statsVersion: number;
  loadConversations: () => Promise<void>;
  openConversation: (participantId: string, participantRole: string) => Promise<string>;
  setActiveConversation: (conv: Conversation | null) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  joinRoom: (conversationId: string) => void;
}

const ChatContext = createContext<ChatState>(null!);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { token, user, astrologer } = useAuth();
  const currentUserId = user?.id || astrologer?.userId || '';
  const currentRole = user ? 'user' : astrologer ? 'astrologer' : 'user';
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef(currentUserId);
  useEffect(() => { userIdRef.current = currentUserId; }, [currentUserId]);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string | null>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [astrologerStatuses, setAstrologerStatuses] = useState<Record<string, 'online' | 'offline' | 'busy'>>({});
  const [horoscopeVersion, setHoroscopeVersion] = useState(0);
  const [panchangVersion, setPanchangVersion] = useState(0);
  const [statsVersion, setStatsVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [chatBlockedMessage, setChatBlockedMessage] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const activeConvRef = useRef<Conversation | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(config.socketUrl, {
      path: config.socketPath,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      if (__DEV__) console.log(`[WS] Connected`);
      setConnected(true);
      loadConversationsRef.current();
    });
    socket.on('disconnect', (reason) => {
      if (__DEV__) console.log(`[WS] Disconnected: ${reason}`);
      setConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.error('[WS] Connect error:', err.message);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('[WS] Server error:', data.message);
    });

    socket.on('message:new', (message: ConversationMessage) => {
      const active = activeConvRef.current;
      if (active?.id === message.conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          const hasOptimistic = prev.some((m) => m.id.startsWith('temp-') && m.senderId === message.senderId && m.conversationId === message.conversationId);
          if (hasOptimistic) {
            return prev.map((m) =>
              m.id.startsWith('temp-') && m.senderId === message.senderId && m.conversationId === message.conversationId
                ? message
                : m,
            );
          }
          return [...prev, message];
        });
      }
      loadConversationsRef.current();
    });

    socket.on('conversation:updated', () => {
      loadConversationsRef.current();
    });

    socket.on('conversation:new', (data: { conversationId: string }) => {
      loadConversationsRef.current();
      if (socket.connected) {
        socket.emit('join:conversation', { conversationId: data.conversationId });
      }
    });

    socket.on('message:delivered', (data: { messageId: string; conversationId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, isDelivered: true } : m)),
      );
    });

    socket.on('message:read', (data: { conversationId: string; readBy: string }) => {
      const active = activeConvRef.current;
      if (active?.id === data.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId !== data.readBy ? { ...m, isRead: true, readAt: new Date().toISOString() } : m)),
        );
      }
      setUnreadCounts((prev) => ({ ...prev, [data.conversationId]: 0 }));
    });

    socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversationId]: data.userId }));
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversationId]: null }));
    });

    socket.on('user:online', (data: { userId: string; role?: string }) => {
      setOnlineUsers((prev) => ({ ...prev, [data.userId]: true }));
      if (data.role === 'astrologer') {
        setAstrologerStatuses((prev) => ({ ...prev, [data.userId]: 'online' }));
      }
    });

    socket.on('user:offline', (data: { userId: string; role?: string }) => {
      setOnlineUsers((prev) => ({ ...prev, [data.userId]: false }));
      if (data.role === 'astrologer') {
        setAstrologerStatuses((prev) => ({ ...prev, [data.userId]: 'offline' }));
      }
    });

    socket.on('astrologer:status-changed', (data: { astrologerId: string; onlineStatus: 'online' | 'offline' | 'busy' }) => {
      setAstrologerStatuses((prev) => ({ ...prev, [data.astrologerId]: data.onlineStatus }));
    });

    socket.on('horoscope:updated', () => {
      setHoroscopeVersion(v => v + 1);
    });

    socket.on('panchang:updated', () => {
      setPanchangVersion(v => v + 1);
    });

    socket.on('astrologer:stats-updated', () => {
      setStatsVersion(v => v + 1);
    });

    socket.on('chat:blocked', (data: { message: string }) => {
      setChatBlockedMessage(data.message);
    });

    socketRef.current = socket;

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
      socket.disconnect();
    };
  }, [token]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.conversations.list();
      setConversations(res.data);
      const counts: Record<string, number> = {};
      res.data.forEach((c: any) => { counts[c.id] = c.unreadCount; });
      setUnreadCounts(counts);
    } catch (e: any) {
      console.error('Failed to load conversations:', e?.response?.data?.message || e?.message || e);
    }
  }, []);

  const loadConversationsRef = useRef(loadConversations);
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  const openConversation = useCallback(async (participantId: string, participantRole: string) => {
    try {
      const conv = await api.conversations.create(participantId, participantRole);
      setActiveConversationState(conv);
      cursorRef.current = null;
      setHasMore(true);
      setMessages([]);
      if (socketRef.current?.connected) {
        socketRef.current.emit('join:conversation', { conversationId: conv.id });
      }
      return conv.id;
    } catch (e: any) {
      console.error('Failed to open conversation:', e.message);
      throw e;
    }
  }, []);

  const setActiveConversation = useCallback((conv: Conversation | null) => {
    setActiveConversationState(conv);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const res = await api.conversations.getMessages(conversationId);
      setMessages(res.data);
      cursorRef.current = res.nextCursor;
      setHasMore(res.hasMore);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || !hasMore || loading) return;
    setLoading(true);
    try {
      const res = await api.conversations.getMessages(activeConversation.id, cursorRef.current || undefined);
      setMessages((prev) => [...res.data, ...prev]);
      cursorRef.current = res.nextCursor;
      setHasMore(res.hasMore);
    } catch { console.error('Failed to load more messages'); } finally {
      setLoading(false);
    }
  }, [activeConversation, hasMore, loading]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!content.trim()) return;
    const socket = socketRef.current;
    const uid = userIdRef.current;
    const role = currentRole;
    const optimistic: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: uid,
      senderRole: role as any,
      type: 'text',
      content,
      isDelivered: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    if (socket?.connected) {
      socket.emit('message:send', { conversationId, content });
    } else {
      try {
        const msg = await api.conversations.sendMessage(conversationId, content);
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? msg : m)));
      } catch { console.error('Failed to send message via HTTP fallback'); }
    }
  }, [currentRole]);

  const startTyping = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('typing:start', { conversationId });

    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }
    typingTimeoutRef.current[conversationId] = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 2000);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('typing:stop', { conversationId });
    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('message:read', { conversationId });
    }
    try {
      await api.conversations.markAsRead(conversationId);
    } catch { console.error('Failed to mark conversation as read'); }
    loadConversationsRef.current();
  }, []);

  const joinRoom = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('join:conversation', { conversationId });
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        connected,
        conversations,
        activeConversation,
        messages,
        onlineUsers,
        typingUsers,
        unreadCounts,
        astrologerStatuses,
        horoscopeVersion,
        panchangVersion,
        statsVersion,
        loading,
        hasMore,
        chatBlockedMessage,
        clearChatBlocked: () => setChatBlockedMessage(null),
        loadConversations,
        openConversation,
        setActiveConversation,
        loadMessages,
        loadMoreMessages,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        joinRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
