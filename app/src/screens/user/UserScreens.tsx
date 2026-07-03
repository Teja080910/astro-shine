import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenWrapper, GlassCard, SectionHeader, SearchBar, GradientButton, CustomModal, Avatar, StarRating, Chip, SkeletonLoader, EmptyState, colors, typography, radii } from '@astro-shine/shared-ui';
import { api } from '@astro-shine/api-client';
import type { Astrologer, HoroscopeRecord, ShopProduct, Blog, Transaction, Wallet } from '@astro-shine/shared-types';
import { Ionicons } from '@expo/vector-icons';

// User Home Dashboard
export function UserHomeScreen({ navigation }: any) {
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [horoscope, setHoroscope] = useState<HoroscopeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const [a, h] = await Promise.all([api.astrologers.list(), api.horoscope.bySign('aries')]); setAstrologers(a.slice(0, 5)); setHoroscope(h); } catch {} finally { setLoading(false); } })(); }, []);

  if (loading) return <ScreenWrapper scroll><SkeletonLoader height={200} /><View style={{ height: 20 }} /><SkeletonLoader height={120} /><View style={{ height: 20 }} /><SkeletonLoader height={120} /></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <Text style={[typography.pageTitle, { marginBottom: 4 }]}>Namaste ✨</Text>
      <Text style={typography.body}>Discover what the stars hold for you</Text>

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
    </ScreenWrapper>
  );
}

// Astrologers List
export function AstrologerListScreen({ navigation }: any) {
  const [data, setData] = useState<Astrologer[]>([]);
  const [search, setSearch] = useState('');
  const cats = ['All', 'Vedic', 'Tarot', 'Numerology', 'Palmistry', 'Vastu'];
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.astrologers.list().then(setData).finally(() => setLoading(false)); }, []);
  const filtered = data.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.specialization?.some(s => s.toLowerCase().includes(search.toLowerCase())));

  return (
    <ScreenWrapper noPadding>
      <View style={{ padding: 16, paddingBottom: 0 }}><Text style={typography.pageTitle}>Astrologers</Text></View>
      <SearchBar value={search} onChangeText={setSearch} />
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={cats} style={{ paddingLeft: 16, marginBottom: 8 }} renderItem={({ item }) => <Chip label={item} selected={item === 'All'} />} keyExtractor={(c) => c} />
      <FlatList data={filtered} keyExtractor={(a) => a.id} contentContainerStyle={{ padding: 16 }}
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

  useEffect(() => { api.astrologers.get(id).then(setAstro); }, []);
  if (!astro) return <ScreenWrapper><Text style={typography.body}>Loading...</Text></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}><Avatar size={80} online={astro.onlineStatus === 'online'} /><Text style={[typography.pageTitle, { marginTop: 12 }]}>{astro.name}</Text><StarRating rating={parseFloat(astro.rating)} size={16} reviewCount={astro.totalReviews} /><Text style={[typography.body, { marginTop: 8 }]}>{astro.bio || 'Experienced astrologer'}</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: colors.surfaceLight, borderRadius: radii.card, marginTop: 16 }}>
        <Stat label="Experience" value={`${astro.experience}y`} /><Stat label="Calls" value={`${astro.totalCalls}`} /><Stat label="Price" value={`₹${astro.pricePerMin}/min`} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}><GradientButton title="Chat" onPress={() => navigation.navigate('Chat', { astrologerId: id })} /></View>
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

  const load = async () => { const w = await api.wallet.get(); setWallet(w); const t = await api.transactions.list(w.id); setTxns(t); };
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
      <Text style={typography.pageTitle}>Kundli</Text>
      <Text style={[typography.body, { marginBottom: 20 }]}>Enter birth details for chart calculation</Text>
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
      <Text style={typography.pageTitle}>Matchmaking</Text>
      <Text style={[typography.sectionTitle, { marginTop: 16 }]}>Person 1</Text>
      {['name', 'dob', 'tob', 'place'].map((f) => <Input key={'p1' + f} label={f} value={(p1 as any)[f]} onChange={(v: string) => setP1({ ...p1, [f]: v })} />)}
      <Text style={[typography.sectionTitle, { marginTop: 16 }]}>Person 2</Text>
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
      <Text style={typography.pageTitle}>Astro Shop</Text>
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

// Profile
export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const items = [
    { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
    { icon: 'document-text-outline', label: 'Order History', route: 'OrderHistory' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'newspaper-outline', label: 'Blogs', route: 'Blogs' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: 'Support' },
  ];

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}><Avatar size={80} /><Text style={[typography.pageTitle, { marginTop: 12 }]}>{user?.name}</Text><Text style={typography.body}>{user?.email}</Text></View>
      <GlassCard style={{ marginTop: 24 }}>
        {items.map((item, i) => (
          <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.route)} style={[styles.menuItem, i < items.length - 1 && styles.border]}>
            <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} /><Text style={[typography.body, { flex: 1, marginLeft: 12 }]}>{item.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </GlassCard>
      <TouchableOpacity style={styles.logout} onPress={logout}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Logout</Text></TouchableOpacity>
    </ScreenWrapper>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 6 }}><View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon as any} size={24} color={colors.primaryLight} /></View><Text style={typography.caption}>{label}</Text></TouchableOpacity>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '700', color: colors.primaryLight }}>{value}</Text><Text style={typography.caption}>{label}</Text></View>;
}

import { TextInput } from 'react-native';
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <View style={{ marginBottom: 14 }}><Text style={[typography.label, { marginBottom: 6 }]}>{label}</Text><TextInput style={{ backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 }} value={value} onChangeText={onChange} /></View>;
}

import { useAuth } from '../../context/AuthContext';

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
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 16 },
});
