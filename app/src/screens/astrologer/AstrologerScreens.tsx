import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, TextInput, Alert } from 'react-native';
import { ScreenWrapper, GlassCard, GradientButton, SectionHeader, Avatar, StarRating, Chip, EmptyState, CustomModal, colors, typography, radii } from '../../shared';
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
    api.transactions.listMy().then(setTxns);
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

function PasswordInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48 }}>
        <TextInput
          style={{ flex: 1, color: colors.textPrimary, fontSize: 15, paddingRight: 8 }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show}
        />
        <Ionicons
          name={show ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.textMuted}
          onPress={() => setShow(!show)}
        />
      </View>
    </View>
  );
}

export function AstrologerProfileScreen({ navigation }: any) {
  const { astrologer, user, role, logout, updateUser } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const profile = role === 'admin' ? user : astrologer;

  const items = role === 'admin' ? [
    { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
  ] : [
    { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
    { icon: 'document-attach-outline', label: 'Documents & Verification', route: 'Documents' },
    { icon: 'time-outline', label: 'Schedule', route: 'Schedule' },
    { icon: 'receipt-outline', label: 'Commission Logs', route: 'CommissionLogs' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
  ];

  const toggleTheme = async (val: boolean) => {
    if (!profile) return;
    const newTheme = val ? 'dark' : 'light';
    try {
      let updated;
      if (role === 'admin') {
        updated = await api.admins.update(profile.id, { theme: newTheme });
      } else {
        updated = await api.astrologers.update(profile.id, { theme: newTheme });
      }
      await updateUser(updated);
    } catch (e) {
      console.log(e);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill all fields');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await api.users.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password changed successfully');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setPwOpen(false);
        setPwSuccess('');
      }, 1500);
    } catch (e: any) {
      setPwError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!astrologer) return;
            try {
              await api.astrologers.delete(astrologer.id);
              await logout();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Avatar size={80} online={role !== 'admin'} /><Text style={[typography.pageTitle, { marginTop: 12 }]}>{profile?.name}</Text><Text style={typography.body}>{role === 'admin' ? 'Admin' : (profile as any)?.specialization?.join(', ') || 'Astrologer'}</Text>
      </View>
      <GlassCard style={{ marginTop: 24 }}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} /><Text style={[typography.body, { flex: 1, marginLeft: 12 }]}>{item.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Dark Mode Toggle Item */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <Ionicons name="moon-outline" size={22} color={colors.textSecondary} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12 }]}>Dark Mode</Text>
          <Switch value={profile?.theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={profile?.theme === 'dark' ? colors.accentGold : '#f4f3f4'} />
        </View>

        {/* Change Password Item */}
        <TouchableOpacity onPress={() => setPwOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: role === 'admin' ? 0 : 1, borderBottomColor: colors.divider }}>
          <Ionicons name="key-outline" size={22} color={colors.textSecondary} /><Text style={[typography.body, { flex: 1, marginLeft: 12 }]}>Change Password</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Delete Account Item */}
        {role !== 'admin' && (
          <TouchableOpacity onPress={handleDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} /><Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.danger }]}>Delete Account</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </GlassCard>
      
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16 }} onPress={logout}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Logout</Text></TouchableOpacity>

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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stat: { width: '30%', alignItems: 'center', padding: 14 },
});
