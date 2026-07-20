import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Keyboard, Alert } from 'react-native';
import { ScreenWrapper, colors, radii, typography, GradientButton, ConfirmDialog } from '../../shared';
import { ChatBubble } from '../../shared/components/ChatBubble';
import { TypingIndicator } from '../../shared/components/TypingIndicator';
import { Avatar } from '../../shared/components/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../shared/api-client';

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - msgDate.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function isConsecutive(prev: any, curr: any): boolean {
  if (!prev) return false;
  if (prev.senderId !== curr.senderId) return false;
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff < 60000;
}

export function ChatRoomScreen({ route, navigation }: any) {
  const { conversationId, participantId, participantRole, participantName } = route.params;
  const { messages, loadMessages, loadMoreMessages, sendMessage, startTyping, stopTyping, markAsRead, typingUsers, hasMore, loading, onlineUsers, connected, joinRoom, setActiveConversation, astrologerStatuses, chatBlockedMessage, clearChatBlocked } = useChat();
  const { user, astrologer: authAstrologer } = useAuth();
  const currentUserId = user?.id || authAstrologer?.id;
  const isUser = !!user?.id;
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typing = typingUsers[conversationId];
  const isOnline = participantRole === 'astrologer'
    ? astrologerStatuses[participantId] === 'online'
    : onlineUsers[participantId] ?? false;
  const joinedRef = useRef(false);
  const userScrolledUp = useRef(false);
  const prevMsgCount = useRef(0);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatPrice, setChatPrice] = useState(5);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (isUser && participantId) {
      api.astrologers.get(participantId).then(a => {
        setChatPrice(parseFloat(a.chatPricePerMin || a.pricePerMin || '5'));
      }).catch(() => {});
      api.wallet.get().then(w => {
        setWalletBalance(Number(w.balance));
        setWalletLoading(false);
      }).catch(() => setWalletLoading(false));
    } else {
      setWalletLoading(false);
    }
  }, [isUser, participantId]);

  const needsFunds = isUser && !walletLoading && walletBalance !== null && walletBalance < chatPrice;

  const handleAddFunds = () => {
    navigation.navigate('Main', { screen: 'Wallet' });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > prevMsgCount.current && !userScrolledUp.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevMsgCount.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    setActiveConversation({ id: conversationId } as any);
    return () => setActiveConversation(null);
  }, [conversationId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            if (participantRole === 'astrologer') {
              navigation.navigate('AstrologerDetail', { id: participantId });
            }
          }}
          disabled={participantRole !== 'astrologer'}
          style={headerStyles.container}
        >
          <Avatar size={36} online={isOnline} />
          <View style={headerStyles.textContainer}>
            <Text style={[headerStyles.name, { color: colors.textPrimary }]}>{participantName || (participantId === currentUserId ? 'You' : 'Astrologer')}</Text>
            {typing ? (
              <Text style={[headerStyles.typing, { color: colors.primaryLight }]}>Typing...</Text>
            ) : (
              <Text style={[headerStyles.status, { color: colors.textMuted }]}>{isOnline ? 'Online' : 'Offline'}</Text>
            )}
            {isUser && (
              <Text style={[headerStyles.price, { color: colors.accentGold }]}>₹{chatPrice}/min</Text>
            )}
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isOnline, typing, participantId, currentUserId, participantName, participantRole, chatPrice, isUser]);

  useEffect(() => {
    loadMessages(conversationId);
    markAsRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUserId && !lastMsg.isRead) {
        markAsRead(conversationId);
      }
    }
  }, [messages.length, conversationId, currentUserId, markAsRead]);

  useEffect(() => {
    if (connected) {
      joinRoom(conversationId);
    } else {
      joinedRef.current = false;
    }
  }, [connected, conversationId, joinRoom]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(conversationId, input.trim());
    setInput('');
    stopTyping(conversationId);
  }, [input, conversationId]);

  const handleChangeText = useCallback((text: string) => {
    setInput(text);
    if (text.trim()) {
      startTyping(conversationId);
    } else {
      stopTyping(conversationId);
    }
  }, [conversationId]);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    userScrolledUp.current = !isNearBottom;
    if (contentOffset.y < 50 && hasMore && !loading) {
      loadMoreMessages();
    }
  }, [hasMore, loading]);

  const renderItem = useCallback(({ item, index }: any) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showDateHeader = !prev || !sameDay(prev.createdAt, item.createdAt);
    const grouped = isConsecutive(prev, item);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: colors.textMuted, backgroundColor: colors.surfaceLight }]}>{formatDateHeader(item.createdAt)}</Text>
          </View>
        )}
        <ChatBubble
          message={item.content || ''}
          isOwn={item.senderId === currentUserId}
          timestamp={item.createdAt}
          isDelivered={item.isDelivered}
          isRead={item.isRead}
          grouped={grouped}
        />
      </View>
    );
  }, [currentUserId, messages]);

  return (
    <ScreenWrapper noPadding>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          contentContainerStyle={styles.list}
          ListFooterComponent={typing ? <TypingIndicator /> : null}
          onContentSizeChange={() => {}}
          onScrollEndDrag={() => {
            setTimeout(() => {
              if (!userScrolledUp.current) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }, 100);
          }}
        />
        {isUser && !needsFunds && (
          <View style={styles.chargeIndicator}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.chargeText}>₹{chatPrice}/min — charged per minute</Text>
          </View>
        )}
        {isUser && needsFunds ? (
          <View style={[styles.inputBar, { flexDirection: 'column', alignItems: 'center', gap: 8, paddingVertical: 16, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Ionicons name="wallet-outline" size={24} color={colors.danger} />
            <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>
              Insufficient wallet balance (₹{walletBalance !== null ? walletBalance : 0}) to chat at ₹{chatPrice}/min
            </Text>
            <GradientButton title="Add Funds" onPress={handleAddFunds} />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[
              styles.inputBar, 
              { 
                borderTopColor: colors.divider, 
                backgroundColor: colors.background,
                paddingBottom: keyboardVisible 
                  ? (Platform.OS === 'android' ? keyboardHeight + insets.bottom + 12 : 10) 
                  : Math.max(insets.bottom, 20)
              }
            ]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={handleChangeText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      <ConfirmDialog
        visible={!!chatBlockedMessage}
        title="Chat Blocked"
        subtitle={chatBlockedMessage || ''}
        icon={<Ionicons name="wallet-outline" size={48} color={colors.danger} />}
        actions={[
          { label: 'Add Funds', onPress: () => { clearChatBlocked(); handleAddFunds(); }, variant: 'primary' },
          { label: 'Close', onPress: () => clearChatBlocked(), variant: 'secondary' },
        ]}
        onClose={() => clearChatBlocked()}
      />
    </ScreenWrapper>
  );
}

const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textContainer: { justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12 },
  typing: { fontSize: 12, fontStyle: 'italic' },
  price: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 8 },
  dateHeader: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  chargeIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, backgroundColor: colors.surfaceLight, gap: 4,
  },
  chargeText: { fontSize: 12, color: colors.textMuted },
});