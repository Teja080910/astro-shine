import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, StyleSheet, Keyboard, Alert, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenWrapper, colors, radii, typography, GradientButton, ConfirmDialog, InsufficientBalanceDialog, CustomModal, Chip } from '../../shared';
import { ChatBubble } from '../../shared/components/ChatBubble';
import { TypingIndicator } from '../../shared/components/TypingIndicator';
import { Avatar } from '../../shared/components/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
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

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function ChatRoomScreen({ route, navigation }: any) {
  const { conversationId, participantId, participantRole, participantName, participantAvatar } = route.params;
  const { messages, loadMessages, loadMoreMessages, sendMessage, startTyping, stopTyping, markAsRead, typingUsers, hasMore, loading, onlineUsers, connected, joinRoom, leaveRoom, resetChatBilling, setActiveConversation, astrologerStatuses, chatBlockedMessage, chatBlockedCode, clearChatBlocked, chatBilling, kundliRequiredMessages, clearKundliRequired } = useChat();
  const { initiateCall } = useCall();
  const { user, astrologer: authAstrologer } = useAuth();
  const currentUserId = user?.id || authAstrologer?.userId || authAstrologer?.id || '';
  const isUser = !!user?.id;
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typing = typingUsers[conversationId];
  const isOnline = !!onlineUsers[participantId] || (participantRole === 'astrologer' && astrologerStatuses[participantId] === 'online');
  const joinedRef = useRef(false);
  const userScrolledUp = useRef(false);
  const prevMsgCount = useRef(0);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatPrice, setChatPrice] = useState(5);
  const [audioCallPrice, setAudioCallPrice] = useState(10);
  const [videoCallPrice, setVideoCallPrice] = useState(20);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [balanceDialogVisible, setBalanceDialogVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [uploadingKundli, setUploadingKundli] = useState(false);

  const billing = chatBilling[conversationId];
  const kundliRequiredMessage = kundliRequiredMessages[conversationId];
  const [clock, setClock] = useState(Date.now());
  const astrologerRate = parseFloat(String((authAstrologer as any)?.chatPricePerMin || (authAstrologer as any)?.pricePerMin || '0')) || 0;
  const sessionRate = billing?.rate ?? (isUser ? chatPrice : astrologerRate);
  const elapsedSeconds = billing?.isActive
    ? Math.max(0, Math.floor((clock - billing.startedAt) / 1000))
    : (billing?.elapsedSeconds ?? 0);

  useEffect(() => {
    if (!billing?.isActive) return;
    setClock(Date.now());
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [billing?.isActive, billing?.startedAt]);

  useEffect(() => {
    resetChatBilling(conversationId);
    return () => { leaveRoom(conversationId); };
  }, [conversationId, leaveRoom, resetChatBilling]);

  useEffect(() => {
    if (isUser && participantId) {
      api.astrologers.get(participantId).then(a => {
        setChatPrice(parseFloat(a.chatPricePerMin || a.pricePerMin || '5'));
        setAudioCallPrice(parseFloat(a.audioCallPricePerMin || a.pricePerMin || '10'));
        setVideoCallPrice(parseFloat(a.videoCallPricePerMin || a.pricePerMin || '20'));
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
          <Avatar size={36} online={isOnline} uri={participantAvatar} name={participantName} />
          <View style={headerStyles.textContainer}>
            <Text style={[headerStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>{participantName || (participantId === currentUserId ? 'You' : 'Astrologer')}</Text>
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
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 4 }}>
          {isUser && participantRole === 'astrologer' && (
            <>
              <Pressable
                onPress={() => {
                  if (!isOnline) {
                    Alert.alert('Astrologer Offline', `${participantName || 'Astrologer'} is currently offline.`);
                    return;
                  }
                  if (walletBalance !== null && walletBalance < audioCallPrice) {
                    setBalanceDialogVisible(true);
                    return;
                  }
                  leaveRoom(conversationId);
                  initiateCall(participantId, participantName || 'Astrologer', 'audio');
                }}
                hitSlop={{ top: 15, bottom: 15, left: 8, right: 8 }}
                style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.5 : 1 }]}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!isOnline) {
                    Alert.alert('Astrologer Offline', `${participantName || 'Astrologer'} is currently offline.`);
                    return;
                  }
                  if (walletBalance !== null && walletBalance < videoCallPrice) {
                    setBalanceDialogVisible(true);
                    return;
                  }
                  leaveRoom(conversationId);
                  initiateCall(participantId, participantName || 'Astrologer', 'video');
                }}
                hitSlop={{ top: 15, bottom: 15, left: 8, right: 8 }}
                style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.5 : 1 }]}
              >
                <Ionicons name="videocam" size={22} color="#7C3AED" />
              </Pressable>
            </>
          )}
          {participantId ? (
            <Pressable
              onPress={() => setReportModalVisible(true)}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, isOnline, typing, participantId, currentUserId, participantName, participantRole, chatPrice, isUser, initiateCall, walletBalance, audioCallPrice, videoCallPrice, leaveRoom, conversationId]);

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

  const handleAttachKundli = useCallback(async () => {
    if (uploadingKundli || !isUser) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      if (file.size && file.size > 20 * 1024 * 1024) {
        Alert.alert('File too large', 'Please attach a Kundli up to 20 MB.');
        return;
      }
      setUploadingKundli(true);
      const uploaded = await api.uploadFile(
        {
          uri: file.uri,
          name: file.name || 'kundli.pdf',
          mimeType: file.mimeType || 'application/pdf',
        },
        'minio',
      );
      await sendMessage(
        conversationId,
        `Kundli – ${file.name || 'document'}`,
        'file',
        uploaded.url,
      );
    } catch (e: any) {
      Alert.alert(
        'Upload failed',
        e?.response?.data?.message || e?.message || 'Could not upload the Kundli. Please try again.',
      );
    } finally {
      setUploadingKundli(false);
    }
  }, [uploadingKundli, isUser, conversationId, sendMessage]);

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
    const isOwn = item.senderId === currentUserId;

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: colors.textMuted, backgroundColor: colors.surfaceLight }]}>{formatDateHeader(item.createdAt)}</Text>
          </View>
        )}
        {item.type === 'file' && item.mediaUrl ? (
          <View style={[styles.fileRow, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL(item.mediaUrl)}
              style={[
                styles.fileCard,
                {
                  backgroundColor: isOwn ? colors.primary : colors.surfaceLight,
                  borderColor: isOwn ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <View style={[styles.fileIconWrap, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.background }]}>
                <Ionicons name="document-text-outline" size={22} color={isOwn ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={[styles.fileName, { color: isOwn ? '#FFFFFF' : colors.textPrimary }]}>
                  {item.content || 'Kundli document'}
                </Text>
                <Text style={[styles.fileHint, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <ChatBubble
            message={item.content || ''}
            isOwn={isOwn}
            timestamp={item.createdAt}
            isDelivered={item.isDelivered}
            isRead={item.isRead}
            grouped={grouped}
          />
        )}
      </View>
    );
  }, [currentUserId, messages]);

  return (
    <ScreenWrapper noPadding>
      <View style={{ flex: 1 }}>
        <View style={[styles.sessionBar, { backgroundColor: colors.surfaceLight, borderBottomColor: colors.divider }]}>
          <View style={styles.sessionTimerWrap}>
            <Ionicons name="stopwatch-outline" size={15} color={billing?.isActive ? colors.primaryLight : colors.textMuted} />
            <Text style={[styles.sessionTimer, { color: billing?.isActive ? colors.textPrimary : colors.textMuted }]}>{formatDuration(elapsedSeconds)}</Text>
            {billing?.isActive && <View style={[styles.sessionLiveDot, { backgroundColor: colors.success }]} />}
          </View>
          <Text style={[styles.sessionAmount, { color: isUser ? colors.textSecondary : colors.accentGold }]}>
            {isUser ? `Spent ₹${(billing?.totalCharged ?? 0).toFixed(2)}` : `Earned ₹${(billing?.totalEarned ?? 0).toFixed(2)}`}
          </Text>
          <Text style={[styles.sessionRate, { color: colors.textMuted }]} numberOfLines={1}>
            {billing?.isActive
              ? (sessionRate > 0 ? `₹${sessionRate.toFixed(2)}/min` : '')
              : billing
                ? 'Session ended'
                : (isUser ? 'Starts once birth details are shared' : 'Waiting for user')}
          </Text>
        </View>
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
              {isUser && (
                <TouchableOpacity
                  style={[styles.attachButton, uploadingKundli && { opacity: 0.5 }]}
                  onPress={handleAttachKundli}
                  disabled={uploadingKundli}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={uploadingKundli ? 'hourglass-outline' : 'attach'}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
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
        icon={
          chatBlockedCode === 'service_disabled'
            ? <Ionicons name="lock-closed-outline" size={48} color={colors.danger} />
            : <Ionicons name="wallet-outline" size={48} color={colors.danger} />
        }
        actions={
          chatBlockedCode === 'service_disabled'
            ? [{ label: 'Close', onPress: () => clearChatBlocked(), variant: 'secondary' }]
            : [
                { label: 'Add Funds', onPress: () => { clearChatBlocked(); handleAddFunds(); }, variant: 'primary' },
                { label: 'Close', onPress: () => clearChatBlocked(), variant: 'secondary' },
              ]
        }
        onClose={() => clearChatBlocked()}
      />
      <ConfirmDialog
        visible={!!kundliRequiredMessage}
        title="Kundli Required"
        subtitle={kundliRequiredMessage || ''}
        icon={<Ionicons name="document-text-outline" size={48} color={colors.primary} />}
        actions={[
          {
            label: 'Add Birth Details',
            onPress: () => {
              clearKundliRequired(conversationId);
              navigation.navigate('Kundli');
            },
            variant: 'primary',
          },
          { label: 'Close', onPress: () => clearKundliRequired(conversationId), variant: 'secondary' },
        ]}
        onClose={() => clearKundliRequired(conversationId)}
      />
      <InsufficientBalanceDialog
        visible={balanceDialogVisible}
        onClose={() => setBalanceDialogVisible(false)}
        onRecharge={() => {
          setBalanceDialogVisible(false);
          navigation.navigate('Main', { screen: 'Wallet' });
        }}
      />
      <CustomModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        title={`Report ${participantName || (participantRole === 'astrologer' ? 'Astrologer' : 'User')}`}
      >
        <View style={{ padding: 16, gap: 14, paddingBottom: 36 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
            Please select the reason for reporting this {participantRole === 'astrologer' ? 'astrologer' : 'user'}. Our moderation team reviews every report.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'].map((r) => (
              <Chip
                key={r}
                label={r.replace(/_/g, ' ')}
                selected={reportReason === r}
                onPress={() => setReportReason(r)}
              />
            ))}
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                color: colors.textPrimary,
                minHeight: 80,
                textAlignVertical: 'top',
                marginRight: 0,
              },
            ]}
            value={reportDesc}
            onChangeText={setReportDesc}
            placeholder="Additional details (optional)..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <GradientButton
            title={reportSubmitting ? 'Submitting...' : 'Submit Report'}
            variant="danger"
            disabled={reportSubmitting || !reportReason}
            onPress={async () => {
              if (!reportReason) {
                Alert.alert('Required', 'Please select a reason');
                return;
              }
              setReportSubmitting(true);
              try {
                await api.reports.create({
                  reason: reportReason,
                  description: reportDesc,
                  ...(participantRole === 'astrologer'
                    ? { reportedAstrologerId: participantId }
                    : { reportedUserId: participantId }),
                });
                setReportModalVisible(false);
                setReportReason('');
                setReportDesc('');
                Alert.alert('Report Submitted', 'Thank you for reporting. Our moderation team will investigate.');
              } catch (e: any) {
                Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to submit report');
              } finally {
                setReportSubmitting(false);
              }
            }}
          />
        </View>
      </CustomModal>
    </ScreenWrapper>
  );
}

const headerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 160, flexShrink: 1 },
  textContainer: { justifyContent: 'center', flexShrink: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12 },
  typing: { fontSize: 12, fontStyle: 'italic' },
  price: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 8 },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sessionTimerWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  sessionTimer: { fontSize: 13, fontWeight: '700' },
  sessionLiveDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 1 },
  sessionAmount: { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  sessionRate: { fontSize: 10, fontWeight: '500', flexShrink: 1 },
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
  attachButton: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  fileRow: { flexDirection: 'row', marginVertical: 4 },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '78%',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileHint: { fontSize: 11, marginTop: 2 },
  chargeIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, backgroundColor: colors.surfaceLight, gap: 4,
  },
  chargeText: { fontSize: 12, color: colors.textMuted },
});