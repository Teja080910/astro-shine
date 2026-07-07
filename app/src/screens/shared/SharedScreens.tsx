import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { ScreenWrapper, GlassCard, SectionHeader, GradientButton, EmptyState, Chip, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import type { Blog, Notification, SupportTicket, NewsItem } from '../../shared/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

function SectionTitle({ title }: { title: string }) {
  return <Text style={[typography.pageTitle, { marginBottom: 16 }]}>{title}</Text>;
}

// Panchang
export function PanchangScreen() {
  return <ScreenWrapper scroll><SectionTitle title="Panchang" /><GlassCard><Text style={typography.body}>Daily panchang calendar with tithi, nakshatra, yoga, karana, sunrise/sunset timings.</Text></GlassCard></ScreenWrapper>;
}

// Blogs with data
export function BlogsScreen() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  useEffect(() => { api.blogs.list().then(setBlogs).catch(() => {}); }, []);
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Blogs" />
      {blogs.length === 0 ? <EmptyState icon={<Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />} title="No blogs yet" /> :
        blogs.map(b => <GlassCard key={b.id} style={{ marginBottom: 12 }}><Text style={typography.cardTitle}>{b.title}</Text><Text style={typography.body} numberOfLines={3}>{b.excerpt || b.content?.slice(0, 150)}</Text><Text style={typography.caption}>{b.tags?.join(', ')}</Text></GlassCard>)}
    </ScreenWrapper>
  );
}

// Notifications with data
export function NotificationsScreen({ route }: any) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const userId = route?.params?.userId;
  useEffect(() => { api.notifications.list({ userId }).then(setNotifs).catch(() => {}); }, []);
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Notifications" />
      {notifs.length === 0 ? <EmptyState icon={<Ionicons name="notifications-outline" size={48} color={colors.textMuted} />} title="No notifications" /> :
        notifs.map(n => <GlassCard key={n.id} style={{ marginBottom: 8, padding: 12, opacity: n.isRead ? 0.6 : 1 }}><Text style={typography.cardTitle}>{n.title}</Text><Text style={typography.body}>{n.body}</Text><Text style={typography.caption}>{new Date(n.createdAt).toLocaleDateString()}</Text></GlassCard>)}
    </ScreenWrapper>
  );
}

// Edit Profile
export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const updated = await api.users.update(user!.id, { name, phone });
      await updateUser(updated);
      navigation.goBack();
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Edit Profile" />
      <View style={{ marginBottom: 14 }}><Text style={[typography.label, { marginBottom: 6 }]}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textMuted} /></View>
      <View style={{ marginBottom: 14 }}><Text style={[typography.label, { marginBottom: 6 }]}>Phone</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" /></View>
      <GradientButton title={loading ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading} />
    </ScreenWrapper>
  );
}

// Support
export function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.support.tickets().then(setTickets).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await api.support.createTicket({ subject, description: message });
      setSubject('');
      setMessage('');
      const list = await api.support.tickets();
      setTickets(list);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Help & Support" />
      <Text style={[typography.body, { marginBottom: 16 }]}>Create a support ticket</Text>
      <View style={{ marginBottom: 14 }}><TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.textMuted} /></View>
      <View style={{ marginBottom: 14 }}><TextInput style={[styles.input, { height: 100 }]} value={message} onChangeText={setMessage} placeholder="Describe your issue" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" /></View>
      <GradientButton title={loading ? 'Submitting...' : 'Submit Ticket'} onPress={handleSubmit} disabled={loading} />
      {tickets.length > 0 && <><SectionHeader title="Your Tickets" style={{ marginTop: 20 }} /><FlatList data={tickets} scrollEnabled={false} keyExtractor={t => t.id} renderItem={({ item }) => <GlassCard style={{ marginBottom: 8, padding: 12 }}><Text style={typography.cardTitle}>{item.subject}</Text><Text style={typography.caption}>{item.status.toUpperCase()} - Priority: {item.priority}</Text><Text style={typography.body}>{item.message}</Text></GlassCard>} /></>}
    </ScreenWrapper>
  );
}

// Donation
export function DonationScreen() {
  const [amount, setAmount] = useState('');
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Make a Donation" />
      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Ionicons name="heart" size={48} color={colors.danger} />
        <Text style={[typography.body, { textAlign: 'center', marginTop: 12 }]}>Your contribution helps us maintain this sacred platform</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {['101', '501', '1100', '2100'].map(a => <Chip key={a} label={`₹${a}`} selected={amount === a} onPress={() => setAmount(a)} />)}
        </View>
        <View style={{ marginTop: 12, width: '100%' }}><TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Custom amount" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" /></View>
        <GradientButton title="Donate Now" variant="gold" onPress={() => {}} style={{ marginTop: 12 }} />
      </GlassCard>
    </ScreenWrapper>
  );
}

// Report
export function ReportScreen({ route, navigation }: any) {
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const reasons = ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'];
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Report" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
        {reasons.map(r => <Chip key={r} label={r.replace('_', ' ')} selected={reason === r} onPress={() => setReason(r)} />)}
      </View>
      <View style={{ marginBottom: 14 }}><TextInput style={[styles.input, { height: 80 }]} value={desc} onChangeText={setDesc} placeholder="Additional details..." placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" /></View>
      <GradientButton title="Submit Report" variant="danger" onPress={() => {}} />
    </ScreenWrapper>
  );
}

// Mandir Pooja
export function MandirPoojaScreen() {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Mandir Pooja" />
      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Ionicons name="flame" size={48} color={colors.accentGold} />
        <Text style={[typography.cardTitle, { marginTop: 12 }]}>Book a Sacred Pooja</Text>
        <Text style={[typography.body, { textAlign: 'center', marginTop: 8 }]}>Satyanarayan Pooja, Rudrabhishek, Navgraha Shanti and more</Text>
        <GradientButton title="View Pooja List" onPress={() => {}} variant="gold" style={{ marginTop: 16 }} />
      </GlassCard>
    </ScreenWrapper>
  );
}

// Order History
export function OrderHistoryScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.list()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Order History" />
      {loading ? (
        <Text style={[typography.body, { textAlign: 'center', marginTop: 20 }]}>Loading orders...</Text>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />} title="No orders yet" subtitle="Items you purchase will appear here" />
      ) : (
        orders.map(order => (
          <GlassCard key={order.id} style={{ marginBottom: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={typography.cardTitle}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={typography.caption}>Status: {order.status.toUpperCase()}</Text>
                <Text style={typography.caption}>Total: ₹{order.totalAmount}</Text>
              </View>
              <Text style={typography.body}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
          </GlassCard>
        ))
      )}
    </ScreenWrapper>
  );
}

// Astrologer: Requests
export function AstrologerRequestsScreen() {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="User Requests" />
      <EmptyState icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />} title="No pending requests" subtitle="Users who want to connect will appear here" />
    </ScreenWrapper>
  );
}

// Astrologer: Schedule
export function AstrologerScheduleScreen() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Availability Schedule" />
      {days.map((d, i) => <GlassCard key={d} style={{ marginBottom: 8, padding: 12 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={typography.cardTitle}>{d}</Text><View style={{ flexDirection: 'row', gap: 8 }}><TextInput style={[styles.input, { width: 100 }]} placeholder="09:00" placeholderTextColor={colors.textMuted} /><Text style={typography.caption}>to</Text><TextInput style={[styles.input, { width: 100 }]} placeholder="18:00" placeholderTextColor={colors.textMuted} /></View></View></GlassCard>)}
      <GradientButton title="Save Schedule" onPress={() => {}} style={{ marginTop: 16 }} />
    </ScreenWrapper>
  );
}

// Astrologer: Documents
export function AstrologerDocumentsScreen() {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Documents & Verification" />
      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Ionicons name="document-attach-outline" size={48} color={colors.textMuted} />
        <Text style={[typography.body, { textAlign: 'center', marginTop: 12 }]}>Upload your ID proof and certificates for verification</Text>
        <GradientButton title="Upload Document" onPress={() => {}} style={{ marginTop: 16 }} />
      </GlassCard>
      <Text style={[typography.caption, { marginTop: 16, textAlign: 'center' }]}>Verification Status: Pending</Text>
    </ScreenWrapper>
  );
}

// Astrologer: Commission Logs
export function AstrologerCommissionScreen() {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Commission Logs" />
      <EmptyState icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />} title="No commission logs yet" subtitle="Earnings from calls and chats will appear here" />
    </ScreenWrapper>
  );
}

// Astrologer: Go Live
export function AstrologerGoLiveScreen() {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Go Live" />
      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Ionicons name="radio" size={48} color={colors.danger} />
        <Text style={[typography.cardTitle, { marginTop: 12 }]}>Start a Live Session</Text>
        <Text style={[typography.body, { textAlign: 'center', marginTop: 8 }]}>Stream to your followers in real-time. Share predictions, answer questions, and grow your audience.</Text>
        <GradientButton title="Go Live Now" variant="gold" onPress={() => {}} style={{ marginTop: 16 }} />
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
});
