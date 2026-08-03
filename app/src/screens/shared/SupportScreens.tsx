import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ScreenWrapper, GlassCard, GradientButton, EmptyState, Chip, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import type { SupportTicket, TicketReply } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const CATEGORIES = ['Billing', 'Technical', 'Account', 'General'];
const STATUS_COLORS: Record<string, string> = { open: '#F59E0B', in_progress: '#3B82F6', resolved: '#10B981' };
const PRIORITY_COLORS: Record<string, string> = { low: '#6B7280', normal: '#F59E0B', high: '#EF4444', urgent: '#DC2626' };

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#6B7280';
  const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: color + '20', borderWidth: 1, borderColor: color }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}

// ===== Support Screen (User/Astrologer) =====
export function SupportScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user, astrologer } = useAuth();
  const { supportVersion } = useChat();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const list = await api.support.tickets();
      setTickets(list);
    } catch {}
  }, []);

  useEffect(() => { if (isFocused) loadTickets(); }, [isFocused, loadTickets, supportVersion]);

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !message.trim()) { Alert.alert('Required', 'Please fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.support.createTicket({ subject: `[${category}] ${subject}`, message });
      setCategory(''); setSubject(''); setMessage(''); setShowForm(false);
      await loadTickets();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create ticket');
    } finally { setSubmitting(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadTickets(); setRefreshing(false); };

  return (
    <ScreenWrapper>
      <FlatList
        data={tickets}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.accentGold + '20', borderWidth: 1, borderColor: colors.accentGold }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accentGold }}>{showForm ? 'Cancel' : '+ New Ticket'}</Text>
              </TouchableOpacity>
            </View>

            {showForm && (
              <GlassCard style={{ padding: 16, marginBottom: 16 }}>
                <Text style={[typography.cardTitle, { marginBottom: 12 }]}>Create Support Ticket</Text>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {CATEGORIES.map(c => (
                    <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                  ))}
                </View>
                <View style={{ marginBottom: 14 }}>
                  <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Subject</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={subject} onChangeText={setSubject} placeholder="Brief title" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={{ marginBottom: 14 }}>
                  <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Message</Text>
                  <TextInput style={[styles.input, { height: 100, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={message} onChangeText={setMessage} placeholder="Describe your issue in detail" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
                </View>
                <GradientButton title={submitting ? 'Submitting...' : 'Submit Ticket'} onPress={handleSubmit} disabled={submitting} />
              </GlassCard>
            )}

            {tickets.length > 0 && (
              <Text style={[typography.sectionTitle, { marginBottom: 12, color: colors.textPrimary }]}>Your Tickets</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !showForm ? <EmptyState icon={<Ionicons name="help-buoy-outline" size={48} color={colors.textMuted} />} title="No support tickets" subtitle="Tap '+ New Ticket' to create one" /> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })} style={{ marginBottom: 10 }}>
            <GlassCard style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[typography.cardTitle, { fontSize: 14 }]} numberOfLines={1}>{item.subject}</Text>
                  <Text style={[typography.caption, { marginTop: 4 }]} numberOfLines={2}>{item.message}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: (PRIORITY_COLORS[item.priority] || '#6B7280') + '15' }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: PRIORITY_COLORS[item.priority] || '#6B7280' }}>{item.priority.toUpperCase()}</Text>
                </View>
                <Text style={[typography.caption, { fontSize: 10 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

// ===== Ticket Detail Screen =====
export function TicketDetailScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { ticketId } = route.params;
  const { user, astrologer } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([api.support.getTicket(ticketId), api.support.replies(ticketId)]);
      setTicket(t);
      setReplies(r);
    } catch {} finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.support.addReply(ticketId, { message: replyText });
      setReplyText('');
      const r = await api.support.replies(ticketId);
      setReplies(r);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send reply');
    } finally { setSending(false); }
  };

  const handleResolve = async () => {
    try {
      await api.support.resolve(ticketId);
      await load();
    } catch {}
  };

  if (loading) return <ScreenWrapper><Text style={[typography.body, { padding: 16 }]}>Loading...</Text></ScreenWrapper>;
  if (!ticket) return <ScreenWrapper><Text style={[typography.body, { padding: 16 }]}>Ticket not found</Text></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <FlatList
        data={replies}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <GlassCard style={{ padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={[typography.cardTitle, { flex: 1, marginRight: 8 }]}>{ticket.subject}</Text>
                <StatusBadge status={ticket.status} />
              </View>
              <Text style={[typography.body, { marginBottom: 8 }]}>{ticket.message}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: (PRIORITY_COLORS[ticket.priority] || '#6B7280') + '15' }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: PRIORITY_COLORS[ticket.priority] || '#6B7280' }}>{ticket.priority.toUpperCase()}</Text>
                </View>
                <Text style={[typography.caption, { fontSize: 10 }]}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
              </View>
            </GlassCard>

            {replies.length > 0 && (
              <Text style={[typography.sectionTitle, { marginBottom: 12, color: colors.textPrimary }]}>Conversation</Text>
            )}
          </>
        }
        ListEmptyComponent={<Text style={[typography.body, { textAlign: 'center', color: colors.textMuted, marginVertical: 20 }]}>No replies yet</Text>}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id || item.senderId === astrologer?.userId;
          return (
            <View style={{ marginBottom: 10, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.replyBubble, { backgroundColor: isMe ? colors.accentGold + '20' : colors.surfaceLight, borderColor: isMe ? colors.accentGold + '40' : colors.cardBorder }]}>
                <Text style={[typography.caption, { fontSize: 10, marginBottom: 4, color: colors.textSecondary }]}>
                  {isMe ? 'You' : item.senderRole} · {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{item.message}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            {ticket.status !== 'resolved' && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                    value={replyText} onChangeText={setReplyText} placeholder="Type your reply..." placeholderTextColor={colors.textMuted} multiline
                  />
                  <TouchableOpacity onPress={handleSendReply} disabled={sending || !replyText.trim()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentGold, alignItems: 'center', justifyContent: 'center', opacity: sending || !replyText.trim() ? 0.5 : 1 }}>
                    <Ionicons name="send" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleResolve} style={{ paddingVertical: 10, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Mark as Resolved</Text>
                </TouchableOpacity>
              </>
            )}
            {ticket.status === 'resolved' && (
              <View style={{ paddingVertical: 10, borderRadius: 12, backgroundColor: '#10B981' + '20', alignItems: 'center', borderWidth: 1, borderColor: '#10B981' }}>
                <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>✓ Resolved</Text>
              </View>
            )}
          </View>
        }
      />
    </ScreenWrapper>
  );
}

// ===== Admin Support Screen =====
export function AdminSupportScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['', 'open', 'in_progress', 'resolved'];
  const filterLabels = ['All', 'Open', 'In Progress', 'Resolved'];

  const loadTickets = useCallback(async () => {
    try {
      const list = await api.support.adminTickets(statusFilter || undefined);
      setTickets(list);
    } catch {}
  }, [statusFilter]);

  useEffect(() => { if (isFocused) loadTickets(); }, [isFocused, loadTickets]);

  const onRefresh = async () => { setRefreshing(true); await loadTickets(); setRefreshing(false); };

  return (
    <ScreenWrapper>
      <FlatList
        data={tickets}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={[typography.pageTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Support Tickets</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 6 }}>
              {filters.map((f, i) => (
                <Chip key={f} label={filterLabels[i]} selected={statusFilter === f} onPress={() => setStatusFilter(f)} />
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={<EmptyState icon={<Ionicons name="help-buoy-outline" size={48} color={colors.textMuted} />} title="No tickets" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('AdminTicketDetail', { ticketId: item.id })} style={{ marginBottom: 10 }}>
            <GlassCard style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[typography.cardTitle, { fontSize: 14 }]} numberOfLines={1}>{item.subject}</Text>
                  <Text style={[typography.caption, { marginTop: 4 }]} numberOfLines={2}>{item.message}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: (PRIORITY_COLORS[item.priority] || '#6B7280') + '15' }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: PRIORITY_COLORS[item.priority] || '#6B7280' }}>{item.priority.toUpperCase()}</Text>
                </View>
                <Text style={[typography.caption, { fontSize: 10 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {item.assignedTo && <Text style={[typography.caption, { fontSize: 10, color: colors.accentGold }]}>Assigned</Text>}
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

// ===== Admin Ticket Detail Screen =====
export function AdminTicketDetailScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { ticketId } = route.params;
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([api.support.getTicket(ticketId), api.support.replies(ticketId)]);
      setTicket(t);
      setReplies(r);
    } catch {} finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.support.addReply(ticketId, { message: replyText });
      setReplyText('');
      const r = await api.support.replies(ticketId);
      setReplies(r);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send reply');
    } finally { setSending(false); }
  };

  const handleAssign = async () => {
    if (!user?.id) return;
    try {
      await api.support.assign(ticketId, user.id);
      await load();
    } catch {}
  };

  const handleStatus = async (status: string) => {
    try {
      await api.support.updateStatus(ticketId, status);
      await load();
    } catch {}
  };

  const handlePriority = async (priority: string) => {
    try {
      await api.support.updatePriority(ticketId, priority);
      await load();
    } catch {}
  };

  if (loading) return <ScreenWrapper><Text style={[typography.body, { padding: 16 }]}>Loading...</Text></ScreenWrapper>;
  if (!ticket) return <ScreenWrapper><Text style={[typography.body, { padding: 16 }]}>Ticket not found</Text></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <FlatList
        data={replies}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <GlassCard style={{ padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={[typography.cardTitle, { flex: 1, marginRight: 8 }]}>{ticket.subject}</Text>
                <StatusBadge status={ticket.status} />
              </View>
              <Text style={[typography.body, { marginBottom: 8 }]}>{ticket.message}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: (PRIORITY_COLORS[ticket.priority] || '#6B7280') + '15' }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: PRIORITY_COLORS[ticket.priority] || '#6B7280' }}>{ticket.priority.toUpperCase()}</Text>
                </View>
                <Text style={[typography.caption, { fontSize: 10 }]}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
              </View>

              {/* Admin Actions */}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 12, paddingTop: 12 }}>
                <Text style={[typography.label, { marginBottom: 8, color: colors.textSecondary }]}>Admin Actions</Text>
                
                {/* Assign */}
                {!ticket.assignedTo && (
                  <TouchableOpacity onPress={handleAssign} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primary + '20', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primaryLight }}>Assign to Me</Text>
                  </TouchableOpacity>
                )}
                {ticket.assignedTo && <Text style={[typography.caption, { marginBottom: 8, color: colors.accentGold }]}>✓ Assigned to you</Text>}

                {/* Status */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {['open', 'in_progress', 'resolved'].map(s => (
                    <TouchableOpacity key={s} onPress={() => handleStatus(s)} style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: (STATUS_COLORS[s] || '#6B7280') + '20', alignItems: 'center', borderWidth: ticket.status === s ? 2 : 0, borderColor: STATUS_COLORS[s] }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: STATUS_COLORS[s] || '#6B7280' }}>{s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Priority */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['low', 'normal', 'high', 'urgent'].map(p => (
                    <TouchableOpacity key={p} onPress={() => handlePriority(p)} style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: (PRIORITY_COLORS[p] || '#6B7280') + '15', alignItems: 'center', borderWidth: ticket.priority === p ? 1 : 0, borderColor: PRIORITY_COLORS[p] }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: PRIORITY_COLORS[p] || '#6B7280' }}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </GlassCard>

            {replies.length > 0 && (
              <Text style={[typography.sectionTitle, { marginBottom: 12, color: colors.textPrimary }]}>Conversation</Text>
            )}
          </>
        }
        ListEmptyComponent={<Text style={[typography.body, { textAlign: 'center', color: colors.textMuted, marginVertical: 20 }]}>No replies yet</Text>}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={{ marginBottom: 10, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.replyBubble, { backgroundColor: isMe ? colors.accentGold + '20' : colors.surfaceLight, borderColor: isMe ? colors.accentGold + '40' : colors.cardBorder }]}>
                <Text style={[typography.caption, { fontSize: 10, marginBottom: 4, color: colors.textSecondary }]}>
                  {isMe ? 'You (Admin)' : item.senderRole} · {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{item.message}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                value={replyText} onChangeText={setReplyText} placeholder="Type your reply..." placeholderTextColor={colors.textMuted} multiline
              />
              <TouchableOpacity onPress={handleSendReply} disabled={sending || !replyText.trim()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentGold, alignItems: 'center', justifyContent: 'center', opacity: sending || !replyText.trim() ? 0.5 : 1 }}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: radii.input, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  replyBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, borderWidth: 1 },
});
