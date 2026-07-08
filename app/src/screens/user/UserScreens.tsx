import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Switch, Alert, Modal, ScrollView, Image } from 'react-native';
import { ScreenWrapper, GlassCard, SectionHeader, SearchBar, GradientButton, CustomModal, Avatar, StarRating, Chip, SkeletonLoader, EmptyState, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, HoroscopeRecord, ShopProduct, Blog, Transaction, Wallet } from '../../shared/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

// User Home Dashboard
export function UserHomeScreen({ navigation }: any) {
  const { theme } = useAuth();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [horoscope, setHoroscope] = useState<HoroscopeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { (async () => { try { const [a, h] = await Promise.all([api.astrologers.list(), api.horoscope.bySign('aries')]); setAstrologers(a.slice(0, 5)); setHoroscope(h); } catch {} finally { setLoading(false); } })(); }, []);

  if (loading) return <ScreenWrapper scroll><SkeletonLoader height={200} /><View style={{ height: 20 }} /><SkeletonLoader height={120} /><View style={{ height: 20 }} /><SkeletonLoader height={120} /></ScreenWrapper>;

  return (
    <ScreenWrapper style={{ position: 'relative', zIndex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.pageTitle, { marginBottom: 4, color: colors.textPrimary }]}>Namaste ✨</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Discover what the stars hold for you</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
            <Ionicons name="menu-outline" size={32} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Live Astrologers" onSeeAll={() => navigation.navigate('AstrologerList')} />
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={astrologers} keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('AstrologerDetail', { id: item.id })} style={styles.astroCard}>
              <GlassCard style={styles.astroInner}>
                <Avatar size={56} online={item.onlineStatus === 'online'} />
                <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
                <StarRating rating={parseFloat(item.rating)} size={12} />
                <Text style={typography.caption}>{item.specialization?.[0] || 'Astrologer'}</Text>
                <Text style={typography.price}>₹{item.pricePerMin}/min</Text>
              </GlassCard>
            </TouchableOpacity>
          )} style={{ marginLeft: 8 }} />

        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          <QuickAction icon="planet" label="Kundli" onPress={() => navigation.navigate('Kundli')} />
          <QuickAction icon="heart" label="Matchmaking" onPress={() => navigation.navigate('Matchmaking')} />
          <QuickAction icon="calendar" label="Panchang" onPress={() => navigation.navigate('Panchang')} />
          <QuickAction icon="pricetags" label="Shop" onPress={() => navigation.navigate('Shop')} />
        </View>

        {horoscope.length > 0 && (
          <>
            <SectionHeader title="Today's Horoscope" />
            <GlassCard><Text style={typography.cardTitle}>♈ Aries</Text><Text style={[typography.body, { marginTop: 8 }]}>{horoscope[0]?.prediction?.slice(0, 150)}...</Text></GlassCard>
          </>
        )}
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

// Astrologers List
export function AstrologerListScreen({ navigation }: any) {
  const [data, setData] = useState<Astrologer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const cats = ['All', 'Vedic', 'Tarot', 'Numerology', 'Palmistry', 'Vastu'];
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.astrologers.list().then(setData).finally(() => setLoading(false)); }, []);
  
  const filtered = data.filter(a => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.specialization?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCat === 'All' || a.specialization?.some(s => s.toLowerCase() === selectedCat.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <ScreenWrapper noPadding>
      <View style={{ padding: 16, paddingBottom: 0 }}><Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Astrologers</Text></View>
      <SearchBar value={search} onChangeText={setSearch} />
      <FlatList 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        data={cats} 
        style={{ height: 44, flexGrow: 0, marginBottom: 8 }} 
        contentContainerStyle={{ paddingHorizontal: 16 }} 
        renderItem={({ item }) => (
          <Chip 
            label={item} 
            selected={item === selectedCat} 
            onPress={() => setSelectedCat(item)} 
            style={{ marginBottom: 0 }}
          />
        )} 
        keyExtractor={(c) => c} 
      />
      <FlatList data={filtered} keyExtractor={(a) => a.id} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />} title="No astrologers" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('AstrologerDetail', { id: item.id })} style={{ marginBottom: 12 }}>
            <GlassCard><View style={styles.row}><Avatar size={56} online={item.onlineStatus === 'online'} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={typography.cardTitle}>{item.name}</Text><StarRating rating={parseFloat(item.rating)} size={12} reviewCount={item.totalReviews} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>{item.specialization?.slice(0, 2).map((s) => <Chip key={s} label={s} />)}</View></View><View style={{ alignItems: 'flex-end' }}><Text style={typography.price}>₹{item.pricePerMin}/min</Text></View></View></GlassCard>
          </TouchableOpacity>
        )} />
    </ScreenWrapper>
  );
}

// Astrologer Detail
export function AstrologerDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [astro, setAstro] = useState<Astrologer | null>(null);
  const [showCall, setShowCall] = useState(false);
  const { openConversation } = useChat();

  useEffect(() => { api.astrologers.get(id).then(setAstro); }, []);
  if (!astro) return <ScreenWrapper><Text style={typography.body}>Loading...</Text></ScreenWrapper>;

  const handleChat = async () => {
    const convId = await openConversation(id, 'astrologer');
    navigation.navigate('ChatRoom', { conversationId: convId, participantId: id, participantRole: 'astrologer' });
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}><Avatar size={80} online={astro.onlineStatus === 'online'} /><Text style={[typography.pageTitle, { marginTop: 12, color: colors.textPrimary }]}>{astro.name}</Text><StarRating rating={parseFloat(astro.rating)} size={16} reviewCount={astro.totalReviews} /><Text style={[typography.body, { marginTop: 8, color: colors.textSecondary }]}>{astro.bio || 'Experienced astrologer'}</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: colors.surfaceLight, borderRadius: radii.card, marginTop: 16 }}>
        <Stat label="Experience" value={`${astro.experience}y`} /><Stat label="Calls" value={`${astro.totalCalls}`} /><Stat label="Price" value={`₹${astro.pricePerMin}/min`} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}><GradientButton title="Chat" onPress={handleChat} /></View>
        <View style={{ flex: 1 }}><GradientButton title="Call" variant="gold" onPress={() => setShowCall(true)} /></View>
      </View>
      <CustomModal visible={showCall} onClose={() => setShowCall(false)}>
        <View style={{ padding: 24, alignItems: 'center', gap: 16 }}><Ionicons name="call" size={48} color={colors.success} /><Text style={typography.pageTitle}>Start Call</Text><Text style={typography.body}>Audio call with {astro.name} at ₹{astro.pricePerMin}/min</Text><GradientButton title="Connect Now" onPress={() => { setShowCall(false); }} /></View>
      </CustomModal>
    </ScreenWrapper>
  );
}

// Wallet
export function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => { const w = await api.wallet.get(); setWallet(w); const t = await api.transactions.listMy(); setTxns(t); };
  useEffect(() => { load(); }, []);

  return (
    <ScreenWrapper scroll>
      <GlassCard style={styles.balanceCard}>
        <Text style={typography.caption}>Available Balance</Text>
        <Text style={styles.balance}>₹{wallet?.balance || '0'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}><GradientButton title="Add Funds" onPress={() => setShowAdd(true)} small /></View>
          <View style={{ flex: 1 }}><GradientButton title="Donate" variant="gold" onPress={() => {}} small /></View>
        </View>
      </GlassCard>
      {txns.map((t) => <GlassCard key={t.id} style={{ marginTop: 8, padding: 12 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View><Text style={typography.cardTitle}>{t.category?.replace(/_/g, ' ')}</Text><Text style={typography.caption}>{new Date(t.createdAt).toLocaleDateString()}</Text></View><Text style={{ fontWeight: '700', color: t.type === 'credit' ? colors.success : colors.danger }}>{t.type === 'credit' ? '+' : '-'}₹{t.amount}</Text></View></GlassCard>)}
    </ScreenWrapper>
  );
}

// Chat
export function ChatScreen() {
  const [input, setInput] = useState('');
  return (
    <ScreenWrapper noPadding>
      <FlatList data={[]} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />} title="No messages yet" subtitle="Start chatting with an astrologer" />}
        renderItem={() => null} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.divider }}>
        <TextInput style={{ flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 20, paddingHorizontal: 16, height: 44, color: colors.textPrimary, fontSize: 15 }} placeholder="Type a message..." placeholderTextColor={colors.textMuted} value={input} onChangeText={setInput} />
        <GradientButton title="Send" onPress={() => {}} small style={{ width: 70 }} />
      </View>
    </ScreenWrapper>
  );
}

// Kundli
export function KundliScreen() {
  const [form, setForm] = useState({ name: '', dob: '', tob: '', place: '' });
  return (
    <ScreenWrapper scroll>
      <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Kundli</Text>
      <Text style={[typography.body, { marginBottom: 20, color: colors.textSecondary }]}>Enter birth details for chart calculation</Text>
      {['name', 'dob', 'tob', 'place'].map((f) => <Input key={f} label={f} value={(form as any)[f]} onChange={(v: string) => setForm({ ...form, [f]: v })} />)}
      <GradientButton title="Generate Kundli" onPress={() => {}} />
    </ScreenWrapper>
  );
}

// Matchmaking
export function MatchmakingScreen() {
  const [p1, setP1] = useState({ name: '', dob: '', tob: '', place: '' });
  const [p2, setP2] = useState({ name: '', dob: '', tob: '', place: '' });
  return (
    <ScreenWrapper scroll>
      <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Matchmaking</Text>
      <Text style={[typography.sectionTitle, { marginTop: 16, color: colors.textPrimary }]}>Person 1</Text>
      {['name', 'dob', 'tob', 'place'].map((f) => <Input key={'p1' + f} label={f} value={(p1 as any)[f]} onChange={(v: string) => setP1({ ...p1, [f]: v })} />)}
      <Text style={[typography.sectionTitle, { marginTop: 16, color: colors.textPrimary }]}>Person 2</Text>
      {['name', 'dob', 'tob', 'place'].map((f) => <Input key={'p2' + f} label={f} value={(p2 as any)[f]} onChange={(v: string) => setP2({ ...p2, [f]: v })} />)}
      <GradientButton title="Check Compatibility" onPress={() => {}} />
    </ScreenWrapper>
  );
}

// Shop
export function ShopScreen() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.shop.list().then(setProducts).finally(() => setLoading(false)); }, []);

  if (loading) return <ScreenWrapper scroll><SkeletonLoader height={180} /></ScreenWrapper>;
  return (
    <ScreenWrapper scroll>
      <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Astro Shop</Text>
      <FlatList data={products} numColumns={2} keyExtractor={(p) => p.id} scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ flex: 0.5, margin: 6 }}>
            <GlassCard style={{ padding: 12 }}>
              <View style={{ height: 120, backgroundColor: colors.surfaceLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Ionicons name="diamond-outline" size={40} color={colors.primaryLight} /></View>
              <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={typography.price}>₹{item.price}</Text>
              <GradientButton title="Add to Cart" onPress={() => {}} small style={{ marginTop: 8 }} />
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="cart-outline" size={48} color={colors.textMuted} />} title="No products yet" />}
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

// Profile
export function ProfileScreen({ navigation }: any) {
  const { user, logout, updateUser, theme, setTheme } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const items = [
    { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
    { icon: 'document-text-outline', label: 'Order History', route: 'OrderHistory' },
    { icon: 'wallet-outline', label: 'Transaction History', route: 'Wallet' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'newspaper-outline', label: 'Blogs', route: 'Blogs' },
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
    if (!user) return;
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
              await api.users.delete(user.id);
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
        <Avatar size={80} uri={user?.avatar} />
        <Text style={[typography.sectionTitle, { marginTop: 12, color: colors.textPrimary }]}>{user?.name}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <GlassCard style={{ marginTop: 24, backgroundColor: colors.glassBg, borderColor: colors.cardBorder }}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={[styles.menuItem, styles.border, { borderBottomColor: colors.divider }]}>
            <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
            <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Dark Mode Toggle Item */}
        <View style={[styles.menuItem, styles.border, { paddingVertical: 8, borderBottomColor: colors.divider }]}>
          <Ionicons name="moon-outline" size={22} color={colors.textSecondary} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>Dark Mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={theme === 'dark' ? colors.accentGold : '#f4f3f4'} />
        </View>

        {/* Change Password Item */}
        <TouchableOpacity onPress={() => setPwOpen(true)} style={[styles.menuItem, styles.border, { borderBottomColor: colors.divider }]}>
          <Ionicons name="key-outline" size={22} color={colors.textSecondary} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.textPrimary }]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Delete Account Item */}
        <TouchableOpacity onPress={handleDeleteAccount} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
          <Text style={[typography.body, { flex: 1, marginLeft: 12, color: colors.danger }]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </GlassCard>

      <TouchableOpacity style={styles.logout} onPress={logout}>
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

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 6 }}><View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon as any} size={24} color={colors.primaryLight} /></View><Text style={typography.caption}>{label}</Text></TouchableOpacity>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '700', color: colors.primaryLight }}>{value}</Text><Text style={typography.caption}>{label}</Text></View>;
}

function Input({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void; [key: string]: any }) {
  return <View style={{ marginBottom: 14 }}><Text style={[typography.label, { marginBottom: 6 }]}>{label}</Text><TextInput style={{ backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 }} value={value} onChangeText={onChange} {...rest} /></View>;
}

const styles = StyleSheet.create({
  astroCard: { width: 140, marginRight: 12 },
  astroInner: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 16 },
  balanceCard: { alignItems: 'center', padding: 24 },
  balance: { fontSize: 42, fontWeight: '800', color: colors.accentGold, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16, marginBottom: 100 },
  dropdownContainer: { position: 'absolute', top: 55, right: 16, width: 190, borderRadius: 12, borderWidth: 1, paddingVertical: 4, zIndex: 2000 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
});
