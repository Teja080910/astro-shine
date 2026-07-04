import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ScreenWrapper, GlassCard, GradientButton, SectionHeader, Avatar, StarRating, Chip, EmptyState, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, Transaction, CommissionLog } from '../../shared/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export function AstrologerHomeScreen() {
  const { astrologer } = useAuth();
  const [isOnline, setIsOnline] = useState(astrologer?.onlineStatus === 'online');
  const [stats, setStats] = useState({ todayEarnings: '₹0', totalCalls: '0', rating: '0', pendingReq: '0' });

  useEffect(() => { if (astrologer?.id) api.astrologers.get(astrologer.id).then(a => { setIsOnline(a.onlineStatus === 'online'); }); }, []);

  const toggleOnline = async (v: boolean) => { setIsOnline(v); if (astrologer?.id) await api.astrologers.updateStatus(astrologer.id, v ? 'online' : 'offline'); };

  const statItems = [
    { label: 'Today Earnings', value: stats.todayEarnings, icon: 'cash-outline', color: colors.success },
    { label: 'Total Calls', value: stats.totalCalls, icon: 'call-outline', color: colors.primaryLight },
    { label: 'Rating', value: astrologer?.rating || '0', icon: 'star-outline', color: colors.accentGold },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={typography.pageTitle}>Dashboard</Text>
          <Text style={typography.body}>{astrologer?.name || 'Astrologer'}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={typography.caption}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: colors.textMuted, true: colors.success }} thumbColor={colors.white} />
        </View>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map(s => (
          <GlassCard key={s.label} style={styles.stat}><Ionicons name={s.icon as any} size={28} color={s.color} /><Text style={[typography.cardTitle, { marginTop: 8 }]}>{s.value}</Text><Text style={typography.caption}>{s.label}</Text></GlassCard>
        ))}
      </View>

      <SectionHeader title="Quick Actions" />
      <View style={{ gap: 8, marginTop: 8 }}>
        <GradientButton title="Go Live" variant="gold" onPress={() => {}} />
      </View>
    </ScreenWrapper>
  );
}

export function AstrologerWalletScreen() {
  const { astrologer } = useAuth();
  const [balance, setBalance] = useState('0');
  const [txns, setTxns] = useState<Transaction[]>([]);

  useEffect(() => {
    api.wallet.get().then(w => setBalance(w.balance));
    api.transactions.list().then(setTxns);
  }, []);

  return (
    <ScreenWrapper scroll>
      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Text style={typography.caption}>Available Balance</Text>
        <Text style={{ fontSize: 42, fontWeight: '800', color: colors.accentGold, marginTop: 4 }}>₹{balance}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}><GradientButton title="Withdraw" variant="gold" onPress={() => {}} small /></View>
        </View>
      </GlassCard>
      <SectionHeader title="Transactions" />
      {txns.map(t => <GlassCard key={t.id} style={{ marginTop: 8, padding: 12 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View><Text style={typography.cardTitle}>{t.category?.replace(/_/g, ' ')}</Text><Text style={typography.caption}>{new Date(t.createdAt).toLocaleDateString()}</Text></View><Text style={{ fontWeight: '700', color: t.type === 'credit' ? colors.success : colors.danger }}>{t.type === 'credit' ? '+' : '-'}₹{t.amount}</Text></View></GlassCard>)}
    </ScreenWrapper>
  );
}

export function AstrologerProfileScreen() {
  const { astrologer, logout } = useAuth();
  const items = [
    { icon: 'person-outline', label: 'Edit Profile' },
    { icon: 'document-attach-outline', label: 'Documents & Verification' },
    { icon: 'time-outline', label: 'Schedule' },
    { icon: 'receipt-outline', label: 'Commission Logs' },
    { icon: 'notifications-outline', label: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Avatar size={80} online /><Text style={[typography.pageTitle, { marginTop: 12 }]}>{astrologer?.name}</Text><Text style={typography.body}>{astrologer?.specialization?.join(', ') || 'Astrologer'}</Text>
      </View>
      <GlassCard style={{ marginTop: 24 }}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: colors.divider }}>
            <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} /><Text style={[typography.body, { flex: 1, marginLeft: 12 }]}>{item.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </GlassCard>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16 }} onPress={logout}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Logout</Text></TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stat: { width: '30%', alignItems: 'center', padding: 14 },
});
