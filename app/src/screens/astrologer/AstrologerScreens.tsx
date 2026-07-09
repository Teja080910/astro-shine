import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar, CustomModal, GlassCard, GradientButton, ScreenWrapper, SectionHeader, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Transaction } from '../../shared/types';

export function AstrologerHomeScreen({ navigation }: any) {
  const { astrologer, user, role } = useAuth();
  const [isOnline, setIsOnline] = useState(astrologer?.onlineStatus === 'online');
  const [stats, setStats] = useState({ todayEarnings: '₹0', totalCalls: '0', rating: '0', pendingReq: '0' });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { if (astrologer?.id) api.astrologers.get(astrologer.id).then(a => { setIsOnline(a.onlineStatus === 'online'); }); }, []);

  const toggleOnline = async (v: boolean) => { setIsOnline(v); if (astrologer?.id) await api.astrologers.updateStatus(astrologer.id, v ? 'online' : 'offline'); };

  const statItems = [
    { label: 'Today Earnings', value: stats.todayEarnings, icon: 'cash-outline', color: colors.success },
    { label: 'Total Calls', value: stats.totalCalls, icon: 'call-outline', color: colors.primaryLight },
    { label: 'Rating', value: astrologer?.rating || '0', icon: 'star-outline', color: colors.accentGold },
  ];

  return (
    <ScreenWrapper style={{ position: 'relative', zIndex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Dashboard</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{astrologer?.name || 'Astrologer'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {true && (
              <View style={{ alignItems: 'center' }}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{isOnline ? 'Online' : 'Offline'}</Text>
                <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: colors.textMuted, true: colors.success }} thumbColor={colors.white} />
              </View>
            )}
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
              <Ionicons name="menu-outline" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
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
      </ScrollView>

      {menuOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <TouchableOpacity onPress={() => { setMenuOpen(false); navigation.navigate('PrivacyPolicy'); }} style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.body, { marginLeft: 10, color: colors.textPrimary }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuOpen(false); navigation.navigate('TermsConditions'); }} style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.body, { marginLeft: 10, color: colors.textPrimary }]}>Terms & Conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuOpen(false); navigation.navigate('AboutApp'); }} style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.body, { marginLeft: 10, color: colors.textPrimary }]}>About App</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuOpen(false); navigation.navigate('Support'); }} style={[styles.dropdownItem, { borderBottomWidth: 0 }]}>
              <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[typography.body, { marginLeft: 10, color: colors.textPrimary }]}>Help & Support</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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
  const { astrologer, user, role, logout, updateUser, theme, setTheme } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
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
    { icon: 'time-outline', label: 'Schedule', route: 'Schedule' },
    { icon: 'wallet-outline', label: 'Transaction History', route: 'Wallet' },
    { icon: 'receipt-outline', label: 'Commission Logs', route: 'CommissionLogs' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
  ];

  const toggleTheme = async (val: boolean) => {
    const newTheme = val ? 'dark' : 'light';
    try {
      await setTheme(newTheme);
    } catch (e) {
      console.log(e);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirm password do not match.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await api.users.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password changed successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password. Make sure current password is correct.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!profile) return;
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.astrologers.delete(profile.id);
              await logout();
            } catch (err) {
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          }
        }
      ]
    );
  };

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <ScreenWrapper scroll>
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <Avatar size={80} uri={profile?.avatar} />
        <Text style={[typography.sectionTitle, { marginTop: 12, color: colors.textPrimary }]}>{profile?.name}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {role === 'admin' ? 'Admin' : ((profile as any)?.specialization?.join(', ') || 'Astrologer')}
        </Text>
      </View>

      <GlassCard style={{ marginTop: 24, backgroundColor: colors.glassBg, borderColor: colors.cardBorder }}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
            <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Dark Mode Toggle Item */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <Ionicons name="moon-outline" size={22} color={colors.textSecondary} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>Dark Mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={theme === 'dark' ? colors.accentGold : '#f4f3f4'} />
        </View>

        {/* Change Password Item */}
        <TouchableOpacity onPress={() => setPwOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <Ionicons name="key-outline" size={22} color={colors.textSecondary} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Delete Account Item */}
        {true && (
          <TouchableOpacity onPress={handleDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
            <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.danger }]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </GlassCard>
      
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16, marginBottom: 100 }} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Logout</Text>
      </TouchableOpacity>

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
  dropdownContainer: { position: 'absolute', top: 55, right: 16, width: 190, borderRadius: 12, borderWidth: 1, paddingVertical: 4, zIndex: 2000 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
});
