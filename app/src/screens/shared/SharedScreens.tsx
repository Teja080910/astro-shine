import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, StyleSheet, Modal } from 'react-native';
import { ScreenWrapper, GlassCard, SectionHeader, GradientButton, EmptyState, Chip, Toggle, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import type { Blog, Notification, SupportTicket, NewsItem, Video } from '../../shared/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

function SectionTitle({ title }: { title: string }) {
  return <Text style={[typography.pageTitle, { marginBottom: 16 }]}>{title}</Text>;
}

// Panchang
export function PanchangScreen() {
  return <ScreenWrapper scroll><SectionTitle title="Panchang" /><GlassCard><Text style={typography.body}>Daily panchang calendar with tithi, nakshatra, yoga, karana, sunrise/sunset timings.</Text></GlassCard></ScreenWrapper>;
}

// Videos
export function VideosScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
  useEffect(() => { api.videos.list().then(setVideos).catch(() => {}); }, []);
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Videos" />
      {videos.length === 0 ? <EmptyState icon={<Ionicons name="videocam-outline" size={48} color={colors.textMuted} />} title="No videos yet" /> :
        videos.map(v => (
          <TouchableOpacity key={v.id} style={{ marginBottom: 12 }}>
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ height: 180, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={28} color={colors.white} style={{ marginLeft: 4 }} />
                </View>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={typography.cardTitle}>{v.title}</Text>
                {v.description ? <Text style={[typography.body, { marginTop: 4 }]} numberOfLines={2}>{v.description}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  {v.category && <Text style={[typography.caption, { color: colors.primaryLight }]}>{v.category}</Text>}
                  {v.duration && <Text style={typography.caption}>{Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}</Text>}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
    </ScreenWrapper>
  );
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
  const { user, astrologer, role, updateUser } = useAuth();
  const profile = role === 'astrologer' ? astrologer : user;
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [gender, setGender] = useState((profile as any)?.gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState((profile as any)?.dateOfBirth ? (profile as any).dateOfBirth.split('T')[0] : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      setGender((profile as any).gender || 'male');
      setDateOfBirth((profile as any).dateOfBirth ? (profile as any).dateOfBirth.split('T')[0] : '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      let updated;
      if (role === 'astrologer') {
        updated = await api.astrologers.update(profile!.id, { name, phone, gender, dateOfBirth });
      } else if (role === 'admin') {
        updated = await api.admins.update(profile!.id, { name });
      } else {
        updated = await api.users.update(profile!.id, { name, phone, gender, dateOfBirth });
      }
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
      <View style={{ marginBottom: 14 }}>
        <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      
      {role !== 'admin' && (
        <View style={{ marginBottom: 14 }}>
          <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
      )}

      {role !== 'admin' && (
        <>
          <View style={{ marginBottom: 14 }}>
            <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setGender('male')}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: radii.input,
                  borderWidth: 1,
                  borderColor: gender === 'male' ? colors.primary : colors.cardBorder,
                  backgroundColor: gender === 'male' ? colors.primary + '15' : colors.surfaceLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: gender === 'male' ? colors.primaryLight : colors.textPrimary, fontWeight: '600' }}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGender('female')}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: radii.input,
                  borderWidth: 1,
                  borderColor: gender === 'female' ? colors.primary : colors.cardBorder,
                  backgroundColor: gender === 'female' ? colors.primary + '15' : colors.surfaceLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: gender === 'female' ? colors.primaryLight : colors.textPrimary, fontWeight: '600' }}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Date of Birth</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, justifyContent: 'center', paddingHorizontal: 14 }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: dateOfBirth ? colors.textPrimary : colors.textMuted, fontSize: 15 }}>
                  {dateOfBirth || "Select Date of Birth"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          <CalendarPickerModal
            visible={showDatePicker}
            value={dateOfBirth}
            onClose={() => setShowDatePicker(false)}
            onSelect={setDateOfBirth}
          />
        </>
      )}

      <GradientButton title={loading ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading} style={{ marginTop: 8 }} />
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
      <View style={{ marginBottom: 14 }}><TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.textMuted} /></View>
      <View style={{ marginBottom: 14 }}><TextInput style={[styles.input, { height: 100, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={message} onChangeText={setMessage} placeholder="Describe your issue" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" /></View>
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
        <View style={{ marginTop: 12, width: '100%' }}><TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={amount} onChangeText={setAmount} placeholder="Custom amount" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" /></View>
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
      <View style={{ marginBottom: 14 }}><TextInput style={[styles.input, { height: 80, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={desc} onChangeText={setDesc} placeholder="Additional details..." placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" /></View>
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
  const { astrologer } = useAuth();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [schedules, setSchedules] = useState<Record<number, { startTime: string; endTime: string; isAvailable: boolean }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!astrologer?.id) return;
    api.schedule.byAstrologer(astrologer.id).then((data: any[]) => {
      const map: Record<number, any> = {};
      data.forEach(s => { map[s.dayOfWeek] = { startTime: s.startTime.slice(0, 5), endTime: s.endTime.slice(0, 5), isAvailable: s.isAvailable }; });
      setSchedules(map);
    }).catch(() => {});
  }, [astrologer?.id]);

  const updateDay = (day: number, field: string, value: string | boolean) => {
    setSchedules(prev => ({ ...prev, [day]: { ...prev[day] || { startTime: '09:00', endTime: '18:00', isAvailable: true }, [field]: value } }));
  };

  const saveAll = async () => {
    if (!astrologer?.id) return;
    setLoading(true);
    try {
      const bulk = Object.entries(schedules).map(([day, s]) => ({
        dayOfWeek: Number(day), startTime: s.startTime, endTime: s.endTime, isAvailable: s.isAvailable,
      }));
      await api.schedule.bulkUpsert(astrologer.id, bulk);
      Alert.alert('Saved', 'Schedule updated successfully');
    } catch { Alert.alert('Error', 'Failed to save schedule'); }
    finally { setLoading(false); }
  };

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Availability Schedule" />
      <Text style={[typography.body, { marginBottom: 16, paddingHorizontal: 4 }]}>Set your weekly availability for consultations</Text>
      {days.map((d, i) => {
        const s = schedules[i];
        return (
          <GlassCard key={d} style={{ marginBottom: 8, padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Toggle
                  value={s?.isAvailable ?? true}
                  onValueChange={(v) => updateDay(i, 'isAvailable', v)}
                  trackColor={{ false: colors.textMuted, true: colors.success }}
                />
                <Text style={[typography.cardTitle, { opacity: s?.isAvailable === false ? 0.4 : 1 }]}>{d}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', opacity: s?.isAvailable === false ? 0.4 : 1 }}>
                <TextInput
                  style={[styles.input, { width: 80, height: 40, textAlign: 'center' }]}
                  value={s?.startTime || '09:00'}
                  onChangeText={(v) => updateDay(i, 'startTime', v)}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={typography.caption}>to</Text>
                <TextInput
                  style={[styles.input, { width: 80, height: 40, textAlign: 'center' }]}
                  value={s?.endTime || '18:00'}
                  onChangeText={(v) => updateDay(i, 'endTime', v)}
                  placeholder="18:00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </GlassCard>
        );
      })}
      <GradientButton title={loading ? 'Saving...' : 'Save Schedule'} onPress={saveAll} disabled={loading} style={{ marginTop: 16 }} />
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

// Privacy Policy Screen
export function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Privacy Policy" />
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>1. Overview & Commitment</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Astro Shine respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, store, share, and protect your personal information when you use our website, mobile application, or online consultation services.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>2. Information We Collect</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          • Personal Identification: Name, email address, telephone number, and gender.{"\n"}
          • Astrological Profile Details: Date, time, and precise city/country of birth. This data is strictly used to compile your natal chart, horoscope calculations, and matching reports.{"\n"}
          • Wallet & Billing: We record purchase transaction summaries and wallet ledger history. No full credit/debit card numbers or sensitive banking credentials are saved on our servers.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>3. Use of Your Personal Data</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          We utilize the collected information to calculate accurate astronomical positions, pair you with suitable consulting astrologers, process your wallet additions, verify your identity during logins, and dispatch push alerts or horoscopes.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>4. Consultation Confidentiality</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Your private text chats and voice calls with astrologers are entirely confidential. They are encrypted and are not shared with any third-party marketing networks or external entities under any circumstances.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>5. Cookies & Session Management</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          We use temporary session identifiers and local browser storage to keep you logged in, save your layout settings, and track basic anonymous diagnostics to optimize application performance.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>6. Data Deletion Rights</Text>
        <Text style={typography.body}>
          You have the right to request deletion of your account and related data at any time. Simply use the "Delete Account" button on your Profile page or email us at support@astroshine.com.
        </Text>
      </GlassCard>
      <GradientButton title="Back to Dashboard" onPress={() => navigation.navigate('Main')} style={{ marginTop: 12 }} />
    </ScreenWrapper>
  );
}

// Terms & Conditions Screen
export function TermsConditionsScreen({ navigation }: any) {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Terms & Conditions" />
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>1. Acceptance of Terms</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          By registering an account, purchasing wallet credits, or using any feature on Astro Shine, you agree to be bound by these Terms & Conditions. If you do not accept these terms, you must immediately deactivate your account and exit our services.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>2. Nature of Astrological Advice</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Astro Shine offers guidance tools based on traditional Vedic astrology, Numerology, and Tarot cards. Predictions, advice, and charts are provided for entertainment and self-reflection purposes only. They do not constitute certified medical, psychiatric, legal, or financial advice.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>3. Wallet Recharge & Fees</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Recharging your account wallet allows you to connect with astrologers. Rates are charged per-minute and are deducted in real-time. Recharge balances are non-refundable. Under rare technical dropouts, you may submit a support ticket within 24 hours to request a credit refund.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>4. Professional Code of Conduct</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Any form of abusive language, harassment, threats, or sharing of personal phone numbers, emails, or payment links during a consultation is strictly forbidden. Violations will result in permanent suspension without a refund.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>5. Limitation of Liability</Text>
        <Text style={typography.body}>
          Astro Shine is not liable for any direct, indirect, incidental, or consequential damages resulting from user actions taken based on advice or readings provided by astrologers on the platform.
        </Text>
      </GlassCard>
      <GradientButton title="Back to Dashboard" onPress={() => navigation.navigate('Main')} style={{ marginTop: 12 }} />
    </ScreenWrapper>
  );
}

// About App Screen
export function AboutAppScreen({ navigation }: any) {
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="About App" />
      <GlassCard style={{ alignItems: 'center', marginBottom: 16, paddingVertical: 32 }}>
        <Ionicons name="planet" size={64} color={colors.accentGold} style={{ marginBottom: 16 }} />
        <Text style={[typography.sectionTitle, { marginBottom: 4 }]}>Astro Shine</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 16 }]}>Version 1.0.0 (Release Build)</Text>
        
        <Text style={[typography.body, { textAlign: 'center', paddingHorizontal: 16, lineHeight: 22, marginBottom: 16 }]}>
          Astro Shine is the world's premier platform for spiritual guidance, connecting you directly with Vedic astrologers, Tarot card readers, Numerologists, and Vastu experts.
        </Text>

        <Text style={[typography.body, { textAlign: 'center', paddingHorizontal: 16, lineHeight: 22 }]}>
          Our mission is to combine ancient cosmic wisdom with modern mobile technology. Whether you seek answers about career, love, finance, or health, our verified advisors are here to guide you 24/7.
        </Text>

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 24 }]}>
          © 2026 Astro Shine Inc. All rights reserved.
        </Text>
      </GlassCard>
      <GradientButton title="Back to Dashboard" onPress={() => navigation.navigate('Main')} style={{ marginTop: 12 }} />
    </ScreenWrapper>
  );
}

interface CalendarProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}

export function CalendarPickerModal({ visible, value, onClose, onSelect }: CalendarProps) {
  const today = new Date();
  const initialDate = value ? new Date(value) : today;
  const [selectedYear, setSelectedYear] = useState(isNaN(initialDate.getTime()) ? today.getFullYear() : initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(isNaN(initialDate.getTime()) ? today.getMonth() : initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(isNaN(initialDate.getTime()) ? today.getDate() : initialDate.getDate());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years: number[] = [];
  for (let y = today.getFullYear(); y >= 1950; y--) {
    years.push(y);
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    onSelect(`${selectedYear}-${mm}-${dd}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: 340, backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 16 }}>
          <Text style={[typography.sectionTitle, { textAlign: 'center', marginBottom: 12, color: colors.accentGold }]}>Select Date of Birth</Text>

          <View style={{ backgroundColor: colors.surfaceLight, padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 }}>
            <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>
              {selectedDay} {months[selectedMonth]} {selectedYear}
            </Text>
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>Year</Text>
          <View style={{ height: 48, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => {
                    setSelectedYear(y);
                    const days = getDaysInMonth(selectedMonth, y);
                    if (selectedDay > days) setSelectedDay(days);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1,
                    borderColor: selectedYear === y ? colors.primary : colors.cardBorder,
                    backgroundColor: selectedYear === y ? colors.primary : colors.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: selectedYear === y ? colors.white : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>Month</Text>
          <View style={{ height: 48, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {months.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setSelectedMonth(idx);
                    const days = getDaysInMonth(idx, selectedYear);
                    if (selectedDay > days) setSelectedDay(days);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1,
                    borderColor: selectedMonth === idx ? colors.primary : colors.cardBorder,
                    backgroundColor: selectedMonth === idx ? colors.primary : colors.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: selectedMonth === idx ? colors.white : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>{m.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>Day</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            {daysArray.map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDay(d)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: selectedDay === d ? colors.primary : colors.cardBorder,
                  backgroundColor: selectedDay === d ? colors.primary : colors.surfaceLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: selectedDay === d ? colors.white : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, height: 44, borderRadius: radii.button, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={{ flex: 1, height: 44, borderRadius: radii.button, backgroundColor: colors.accentGold, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>Select Date</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
});
