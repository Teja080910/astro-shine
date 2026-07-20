import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar, Chip, ConfirmDialog, CustomModal, EmptyState, GlassCard, GradientButton, ScreenWrapper, SectionHeader, StarRating, Toggle, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { CallLog, Notification, Review, Transaction, WithdrawalRequest } from '../../shared/types';

export function AstrologerHomeScreen({ navigation }: any) {
  const { astrologer, theme, setTheme } = useAuth();
  const { astrologerStatuses, statsVersion } = useChat();
  const isFocused = useIsFocused();
  const [isOnline, setIsOnline] = useState(astrologer?.onlineStatus === 'online');
  const [stats, setStats] = useState({ todayEarnings: '₹0', totalCalls: '0', rating: '0', totalEarnings: '₹0' });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!astrologer?.id) return;
    try {
      const [astro, txns] = await Promise.all([
        api.astrologers.get(astrologer.id),
        api.transactions.listMy(),
      ]);
      setIsOnline(astro.onlineStatus === 'online');
      const todayTxns = txns.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString());
      const todayEarn = todayTxns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
      setStats({
        todayEarnings: `₹${todayEarn}`,
        totalCalls: String(astro.totalCalls || '0'),
        rating: astro.rating || '0',
        totalEarnings: `₹${astro.totalEarnings || '0'}`,
      });
      setRecentTxns(txns.slice(0, 5));
    } catch { }
  }, [astrologer?.id, statsVersion]);

  useEffect(() => { if (isFocused) loadData(); }, [isFocused, loadData]);

  useEffect(() => {
    if (astrologer?.id && astrologerStatuses[astrologer.id]) {
      setIsOnline(astrologerStatuses[astrologer.id] === 'online');
    }
  }, [astrologerStatuses, astrologer?.id]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const toggleOnline = async (v: boolean) => {
    setIsOnline(v);
    if (astrologer?.id) await api.astrologers.updateStatus(astrologer.id, v ? 'online' : 'offline');
  };

  const statItems = [
    { label: "Today's Earnings", value: stats.todayEarnings, icon: 'cash-outline', color: colors.success },
    { label: 'Total Calls', value: stats.totalCalls, icon: 'call-outline', color: colors.primaryLight },
    { label: 'Rating', value: stats.rating, icon: 'star-outline', color: colors.accentGold },
    { label: 'Total Earnings', value: stats.totalEarnings, icon: 'wallet-outline', color: colors.secondary },
  ];

  return (
    <ScreenWrapper style={{ position: 'relative', zIndex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>
              <Ionicons name="sunny" size={24} color={colors.accentGold} /> Namaste
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{astrologer?.name || 'Astrologer'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Toggle value={isOnline} onValueChange={toggleOnline} trackColor={{ false: colors.textMuted, true: colors.success }} />
            </View>
            <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: 8 }}>
              <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
              <Ionicons name="menu-outline" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {statItems.map(s => (
            <GlassCard key={s.label} style={styles.stat}>
              <Ionicons name={s.icon as any} size={24} color={s.color} />
              <Text style={[typography.cardTitle, { marginTop: 6, fontSize: 15 }]}>{s.value}</Text>
              <Text style={[typography.caption, { fontSize: 11, textAlign: 'center' }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        <SectionHeader title="Quick Actions" />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={() => navigation.navigate('GoLive')} style={[styles.quickAction, { backgroundColor: colors.accentGold + '20', borderColor: colors.accentGold }]}>
            <Ionicons name="radio" size={22} color={colors.accentGold} />
            <Text style={[typography.caption, { color: colors.accentGold, fontWeight: '600', marginTop: 4 }]}>Go Live</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')} style={[styles.quickAction, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <Ionicons name="time-outline" size={22} color={colors.primaryLight} />
            <Text style={[typography.caption, { color: colors.primaryLight, fontWeight: '600', marginTop: 4 }]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={[styles.quickAction, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
            <Ionicons name="wallet-outline" size={22} color={colors.success} />
            <Text style={[typography.caption, { color: colors.success, fontWeight: '600', marginTop: 4 }]}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {recentTxns.length > 0 && (
          <>
            <SectionHeader title="Recent Transactions" onSeeAll={() => navigation.navigate('Wallet')} />
            {recentTxns.map(t => (
              <GlassCard key={t.id} style={{ marginTop: 6, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.cardTitle, { fontSize: 14 }]}>{t.category?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                    <Text style={typography.caption}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: t.type === 'credit' ? colors.success : colors.danger }}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>

      {menuOpen && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            {[
              { icon: 'document-text-outline', label: 'Privacy Policy', route: 'PrivacyPolicy' },
              { icon: 'shield-checkmark-outline', label: 'Terms & Conditions', route: 'TermsConditions' },
              { icon: 'information-circle-outline', label: 'About App', route: 'AboutApp' },
              { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
            ].map((item, i) => (
              <TouchableOpacity key={item.label} onPress={() => { setMenuOpen(false); navigation.navigate(item.route); }}
                style={[styles.dropdownItem, { borderBottomColor: colors.divider, borderBottomWidth: i < 3 ? 1 : 0 }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.textSecondary} />
                <Text style={[typography.body, { marginLeft: 10, color: colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

export function AstrologerWalletScreen({ navigation }: any) {
  const { astrologer } = useAuth();
  const isFocused = useIsFocused();
  const [balance, setBalance] = useState('0');
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([api.wallet.get(), api.transactions.listMy()]);
      setBalance(w.balance);
      setTxns(t);
    } catch { }
  }, []);

  useEffect(() => { if (isFocused) loadData(); }, [isFocused, loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const filtered = filter === 'all' ? txns : txns.filter(t => t.type === filter);
  const totalCredits = txns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = txns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <GlassCard style={{ alignItems: 'center', padding: 24 }}>
          <Text style={typography.caption}>Available Balance</Text>
          <Text style={{ fontSize: 42, fontWeight: '800', color: colors.accentGold, marginTop: 4 }}>₹{balance}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' }}>
            <View style={{ flex: 1 }}><GradientButton title="Withdraw" variant="gold" onPress={() => navigation.navigate('Withdrawals')} small /></View>
          </View>
        </GlassCard>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 14 }}>
            <Text style={[typography.cardTitle, { color: colors.success }]}>+₹{totalCredits}</Text>
            <Text style={typography.caption}>Total Credits</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 14 }}>
            <Text style={[typography.cardTitle, { color: colors.danger }]}>-₹{totalDebits}</Text>
            <Text style={typography.caption}>Total Debits</Text>
          </GlassCard>
        </View>

        <SectionHeader title="Transactions" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
          {(['all', 'credit', 'debit'] as const).map(f => (
            <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />} title="No transactions" />
        ) : (
          filtered.map(t => (
            <GlassCard key={t.id} style={{ marginTop: 6, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.cardTitle, { fontSize: 14 }]}>{t.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                  <Text style={typography.caption}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: t.type === 'credit' ? colors.success : colors.danger }}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export function AstrologerWithdrawalScreen() {
  const { astrologer } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [amount, setAmount] = useState('');
  const [bankAc, setBankAc] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    try { const r = await api.withdrawals.list(); setRequests(r); } catch { }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleSubmit = async () => {
    if (!amount || !bankAc || !ifsc) return;
    setLoading(true);
    try {
      await api.withdrawals.create({ amount, bankAccount: { accountNumber: bankAc, ifsc }, astrologerId: astrologer?.id });
      setShowForm(false);
      setAmount(''); setBankAc(''); setIfsc('');
      await loadData();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to submit withdrawal request');
      setErrorVisible(true);
    }
    finally { setLoading(false); }
  };

  const statusColors: Record<string, string> = { pending: colors.warning, approved: colors.success, rejected: colors.danger, completed: colors.primaryLight };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <GlassCard style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={48} color={colors.accentGold} />
          <Text style={[typography.sectionTitle, { marginTop: 12 }]}>Withdraw Funds</Text>
          <Text style={[typography.body, { textAlign: 'center', marginTop: 4 }]}>Request a withdrawal to your bank account</Text>
          <GradientButton title="New Withdrawal Request" variant="gold" onPress={() => setShowForm(true)} style={{ marginTop: 16 }} />
        </GlassCard>

        {showForm && (
          <GlassCard style={{ marginTop: 16, padding: 20 }}>
            <Text style={[typography.cardTitle, { marginBottom: 16, color: colors.textPrimary }]}>Withdrawal Details</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={[typography.label, { marginBottom: 4, color: colors.textSecondary }]}>Amount (₹)</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={amount} onChangeText={setAmount} placeholder="Enter amount" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[typography.label, { marginBottom: 4, color: colors.textSecondary }]}>Account Number</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={bankAc} onChangeText={setBankAc} placeholder="Enter account number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[typography.label, { marginBottom: 4, color: colors.textSecondary }]}>IFSC Code</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]} value={ifsc} onChangeText={setIfsc} placeholder="Enter IFSC code" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={{ flex: 1, height: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}><GradientButton title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={loading} /></View>
            </View>
          </GlassCard>
        )}

        <SectionHeader title="Withdrawal History" />
        {requests.length === 0 ? (
          <EmptyState icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />} title="No withdrawal requests" />
        ) : (
          requests.map(r => (
            <GlassCard key={r.id} style={{ marginTop: 6, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[typography.cardTitle, { fontSize: 15 }]}>₹{r.amount}</Text>
                  <Text style={typography.caption}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColors[r.status] || colors.textMuted }} />
                  <Text style={[typography.caption, { color: statusColors[r.status] || colors.textMuted, fontWeight: '600' }]}>{r.status.toUpperCase()}</Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
      <ConfirmDialog
        visible={errorVisible}
        title="Withdrawal Error"
        subtitle={errorMsg}
        icon={<Ionicons name="alert-circle" size={48} color={colors.danger} />}
        actions={[{ label: 'OK', onPress: () => setErrorVisible(false), variant: 'primary' }]}
        onClose={() => setErrorVisible(false)}
      />
    </ScreenWrapper>
  );
}

export function AstrologerReviewsScreen() {
  const { astrologer } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!astrologer?.id) return;
    try { const r = await api.reviews.list({ astrologerId: astrologer.id }); setReviews(r); } catch { }
  }, [astrologer?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <GlassCard style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, fontWeight: '800', color: colors.accentGold }}>{avgRating}</Text>
          <StarRating rating={Number(avgRating)} size={20} showNumber={false} />
          <Text style={[typography.body, { marginTop: 8 }]}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
        </GlassCard>

        <SectionHeader title="All Reviews" />
        {reviews.length === 0 ? (
          <EmptyState icon={<Ionicons name="star-outline" size={48} color={colors.textMuted} />} title="No reviews yet" subtitle="Reviews from users will appear here" />
        ) : (
          reviews.map(r => (
            <GlassCard key={r.id} style={{ marginTop: 8, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <StarRating rating={r.rating} size={14} />
                <Text style={typography.caption}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
              {r.comment && <Text style={[typography.body, { marginTop: 8 }]}>{r.comment}</Text>}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export function AstrologerNotificationsScreen() {
  const { astrologer } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const n = await api.notifications.list({ astrologerId: astrologer?.id });
      setNotifs(n);
    } catch { }
  }, [astrologer?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const markRead = async (id: string) => {
    try { await api.notifications.markRead(id); setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); } catch { }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {notifs.length === 0 ? (
          <EmptyState icon={<Ionicons name="notifications-outline" size={48} color={colors.textMuted} />} title="No notifications" subtitle="You're all caught up!" />
        ) : (
          notifs.map(n => (
            <TouchableOpacity key={n.id} onPress={() => !n.isRead && markRead(n.id)}>
              <GlassCard style={{ marginBottom: 8, padding: 14, opacity: n.isRead ? 0.85 : 1 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.isRead ? colors.surfaceLight : colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={n.type === 'system' ? 'settings-outline' : n.type === 'promotional' ? 'megaphone-outline' : 'cash-outline'} size={20} color={n.isRead ? colors.textMuted : colors.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.cardTitle, { fontSize: 14 }]}>{n.title}</Text>
                    <Text style={[typography.body, { fontSize: 13, marginTop: 2 }]}>{n.body}</Text>
                    <Text style={[typography.caption, { marginTop: 4 }]}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight, marginTop: 4 }} />}
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export function AstrologerConsultationScreen() {
  const { astrologer } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'audio' | 'video'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!astrologer?.id) return;
    try { const c = await api.calls.list({ astrologerId: astrologer.id }); setCalls(c); } catch { }
  }, [astrologer?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const filtered = filter === 'all' ? calls : calls.filter(c => c.type === filter);
  const statusColors: Record<string, string> = { completed: colors.success, missed: colors.danger, cancelled: colors.textMuted, ongoing: colors.primaryLight, initiated: colors.warning };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['all', 'audio', 'video'] as const).map(f => (
            <Chip key={f} label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState icon={<Ionicons name="call-outline" size={48} color={colors.textMuted} />} title="No consultations yet" subtitle="Your call history will appear here" />
        ) : (
          filtered.map(c => (
            <GlassCard key={c.id} style={{ marginBottom: 8, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.type === 'video' ? colors.secondary + '20' : colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={c.type === 'video' ? 'videocam-outline' : 'call-outline'} size={20} color={c.type === 'video' ? colors.secondary : colors.primaryLight} />
                  </View>
                  <View>
                    <Text style={[typography.cardTitle, { fontSize: 14 }]}>{c.type === 'video' ? 'Video Call' : 'Audio Call'}</Text>
                    <Text style={typography.caption}>{(c as any).userName || 'User'} · {new Date(c.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} {c.duration ? `· ${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : ''}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColors[c.status] || colors.textMuted }} />
                    <Text style={[typography.caption, { color: statusColors[c.status] || colors.textMuted, fontWeight: '600' }]}>{c.status.toUpperCase()}</Text>
                  </View>
                  {c.cost && <Text style={[typography.caption, { marginTop: 2 }]}>₹{c.cost}</Text>}
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export function AstrologerProfileScreen({ navigation }: any) {
  const { astrologer, role, logout, updateUser, theme, setTheme } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const profile = astrologer;

  const items = [
    { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
    { icon: 'document-attach-outline', label: 'Documents & Verification', route: 'Documents' },
    { icon: 'time-outline', label: 'Availability Schedule', route: 'Schedule' },
    { icon: 'wallet-outline', label: 'Wallet & Earnings', route: 'Wallet' },
    { icon: 'receipt-outline', label: 'Commission Logs', route: 'CommissionLogs' },
    { icon: 'call-outline', label: 'Consultation History', route: 'Consultations' },
    { icon: 'star-outline', label: 'Ratings & Reviews', route: 'Reviews' },
    { icon: 'cash-outline', label: 'Withdrawals', route: 'Withdrawals' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
  ];

  const toggleTheme = async (val: boolean) => { try { await setTheme(val ? 'dark' : 'light'); } catch { } };

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwError('Please fill in all password fields.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true); setPwError(''); setPwSuccess('');
    try {
      await api.users.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  const handleDeleteAccount = () => {
    setDeleteOpen(true);
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ paddingBottom: 120 }}>
        {/* Hero Header Card */}
        <View style={{ backgroundColor: '#FFFBEB', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A', marginTop: 8 }}>
          <View style={{ position: 'relative' }}>
            <View style={{ padding: 3, borderRadius: 44, borderWidth: 2.5, borderColor: '#F59E0B', backgroundColor: '#FFFFFF' }}>
              <Avatar size={76} uri={profile?.avatar} />
            </View>
            <View style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: '#16A34A', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
              <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
            </View>
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#7F1D1D', marginTop: 10 }}>{profile?.name || 'Astrologer Profile'}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#FCD34D', marginTop: 6 }}>
            <Ionicons name="ribbon" size={13} color="#D97706" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }}>{profile?.specialization?.join(', ') || 'Vedic Astrologer'}</Text>
          </View>

          {/* Quick Stats Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, marginTop: 16, borderWidth: 1, borderColor: '#FEF08A' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#7F1D1D' }}>₹{profile?.totalEarnings || 0}</Text>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>Earnings</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#FDE68A' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#7F1D1D' }}>★ {profile?.rating || '4.9'}</Text>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>Rating</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#FDE68A' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#7F1D1D' }}>{profile?.totalCalls || 0}+</Text>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Main Options Cards */}
        <View style={{ gap: 14, marginTop: 16 }}>
          {/* Services & Schedule Group */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#FEF08A' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>SERVICES & MANAGEMENT</Text>
            {items.slice(0, 5).map((item, i) => (
              <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={item.icon as any} size={20} color="#D97706" />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* History & Earnings Group */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#FEF08A' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>EARNINGS & HISTORY</Text>
            {items.slice(5).map((item, i) => (
              <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: i < items.slice(5).length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={item.icon as any} size={20} color="#D97706" />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Account & Security Group */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#FEF08A' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>SECURITY & PREFERENCES</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="moon-outline" size={20} color="#D97706" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Dark Mode</Text>
              <Toggle value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#D1D5DB', true: '#7F1D1D' }} />
            </View>

            <TouchableOpacity onPress={() => setPwOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="key-outline" size={20} color="#D97706" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Change Password</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#DC2626' }}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 18, paddingVertical: 14, marginTop: 24, marginBottom: 80 }} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '700', marginLeft: 8 }}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <CustomModal visible={pwOpen} onClose={() => setPwOpen(false)} title="Change Password">
        <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
          {pwError ? <Text style={{ color: colors.danger, fontSize: 14, marginBottom: 10 }}>{pwError}</Text> : null}
          {pwSuccess ? <Text style={{ color: '#22c55e', fontSize: 14, marginBottom: 10 }}>{pwSuccess}</Text> : null}
          <PasswordInput label="Current Password" value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" />
          <PasswordInput label="New Password" value={newPw} onChange={setNewPw} placeholder="Enter new password" />
          <PasswordInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} placeholder="Confirm new password" />
          <GradientButton title={pwLoading ? 'Changing...' : 'Change Password'} onPress={handlePasswordChange} disabled={pwLoading} style={{ marginTop: 8 }} />
        </View>
      </CustomModal>

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete Account"
        subtitle="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        actions={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setDeleteOpen(false) },
          {
            label: 'Delete', variant: 'danger', onPress: async () => {
              setDeleteOpen(false);
              try { await api.astrologers.delete(profile!.id); await logout(); } catch { }
            }
          },
        ]}
        onClose={() => setDeleteOpen(false)}
      />
    </ScreenWrapper>
  );
}

function PasswordInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48 }}>
        <TextInput style={{ flex: 1, color: colors.textPrimary, fontSize: 15, paddingRight: 8 }} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} secureTextEntry={!show} />
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShow(!show)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stat: { width: '47%', alignItems: 'center', padding: 14 },
  quickAction: { flex: 1, height: 70, borderRadius: radii.card, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dropdownContainer: { position: 'absolute', top: 55, right: 16, width: 200, borderRadius: 12, borderWidth: 1, paddingVertical: 4, zIndex: 2000 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  input: { backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
});

export { AstrologerMuhuratScreen } from './AstrologerMuhuratScreen';
