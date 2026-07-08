import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { ScreenWrapper, colors, radii, typography } from '../../shared';
import { ChatBubble } from '../../shared/components/ChatBubble';
import { TypingIndicator } from '../../shared/components/TypingIndicator';
import { Avatar } from '../../shared/components/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

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
  const { messages, loadMessages, loadMoreMessages, sendMessage, startTyping, stopTyping, markAsRead, typingUsers, hasMore, loading, onlineUsers, connected, joinRoom, setActiveConversation } = useChat();
  const { user, astrologer } = useAuth();
  const currentUserId = user?.id || astrologer?.id;
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typing = typingUsers[conversationId];
  const isOnline = onlineUsers[participantId] ?? false;
  const joinedRef = useRef(false);

  useEffect(() => {
    setActiveConversation({ id: conversationId } as any);
    return () => setActiveConversation(null);
  }, [conversationId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={headerStyles.container}>
          <Avatar size={36} online={isOnline} />
          <View style={headerStyles.textContainer}>
            <Text style={[headerStyles.name, { color: colors.textPrimary }]}>{participantName || (participantId === currentUserId ? 'You' : 'Astrologer')}</Text>
            {typing ? (
              <Text style={[headerStyles.typing, { color: colors.primaryLight }]}>Typing...</Text>
            ) : (
              <Text style={[headerStyles.status, { color: colors.textMuted }]}>{isOnline ? 'Online' : 'Offline'}</Text>
            )}
          </View>
        </View>
      ),
    });
  }, [navigation, isOnline, typing, participantId, currentUserId, participantName]);

  useEffect(() => {
    loadMessages(conversationId);
    markAsRead(conversationId);
  }, [conversationId]);

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
    if (event.nativeEvent.contentOffset.y < 50 && hasMore && !loading) {
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
            <Text style={styles.dateHeaderText}>{formatDateHeader(item.createdAt)}</Text>
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.list}
          ListFooterComponent={typing ? <TypingIndicator /> : null}
        />
        <View style={[styles.inputBar, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
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
    </ScreenWrapper>
  );
}

const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textContainer: { justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12 },
  typing: { fontSize: 12, fontStyle: 'italic' },
});

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 8 },
  dateHeader: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.surfaceLight,
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
    paddingBottom: 80,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
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
});
