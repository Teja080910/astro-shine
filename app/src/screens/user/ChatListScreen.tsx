import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ScreenWrapper, colors, radii, typography } from '../../shared';
import { Avatar } from '../../shared/components/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export function ChatListScreen({ navigation }: any) {
  const { conversations, loadConversations, onlineUsers, unreadCounts } = useChat();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  useEffect(() => {
    loadConversations();
  }, [isFocused]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const renderItem = useCallback(({ item }: any) => {
    const isOnline = onlineUsers[item.participantId] ?? false;
    const unread = unreadCounts[item.id] ?? 0;

    return (
      <TouchableOpacity
        style={[styles.item, { borderBottomColor: colors.divider }]}
        onPress={() => navigation.navigate('ChatRoom', { conversationId: item.id, participantId: item.participantId, participantRole: item.participantRole, participantName: item.participantName })}
      >
        <View style={styles.avatarContainer}>
          <Avatar size={52} online={isOnline} />
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[typography.cardTitle, { flex: 1 }]} numberOfLines={1}>{item.participantName || (item.participantId === user?.id ? 'You' : 'Astrologer')}</Text>
            <Text style={[typography.caption, { marginLeft: 8 }]}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{item.lastMessagePreview || 'No messages yet'}</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [onlineUsers, unreadCounts, user]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={typography.pageTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadConversations} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={[typography.body, { marginTop: 12 }]}>No conversations yet</Text>
            <Text style={[typography.caption, { marginTop: 4 }]}>Start chatting with an astrologer</Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 ? { flex: 1 } : undefined}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  avatarContainer: { marginRight: 12 },
  content: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.cardTitle, flex: 1 },
  time: { ...typography.caption, marginLeft: 8 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  preview: { ...typography.body, flex: 1 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
