import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';
import { Avatar, Chip, ConfirmDialog, CustomModal, EmptyState, GlassCard, GradientButton, ScreenWrapper, SearchBar, SectionHeader, SkeletonLoader, StarRating, Toggle, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, Blog, HoroscopeRecord, MandirPooja, Notification, ShopProduct, Transaction, Video, Wallet } from '../../shared/types';

const ZODIAC_SIGNS = [
  { sign: 'aries', emoji: '♈', label: 'Aries' },
  { sign: 'taurus', emoji: '♉', label: 'Taurus' },
  { sign: 'gemini', emoji: '♊', label: 'Gemini' },
  { sign: 'cancer', emoji: '♋', label: 'Cancer' },
  { sign: 'leo', emoji: '♌', label: 'Leo' },
  { sign: 'virgo', emoji: '♍', label: 'Virgo' },
  { sign: 'libra', emoji: '♎', label: 'Libra' },
  { sign: 'scorpio', emoji: '♏', label: 'Scorpio' },
  { sign: 'sagittarius', emoji: '♐', label: 'Sagittarius' },
  { sign: 'capricorn', emoji: '♑', label: 'Capricorn' },
  { sign: 'aquarius', emoji: '♒', label: 'Aquarius' },
  { sign: 'pisces', emoji: '♓', label: 'Pisces' },
];

const ASTRO_CATEGORIES = ['All', 'Vedic', 'Tarot', 'Numerology', 'Palmistry', 'Vastu'];

function getAstrologerOnlineStatus(astro: Astrologer, astrologerStatuses: Record<string, 'online' | 'offline' | 'busy'>) {
  const wsStatus = astrologerStatuses[astro.id];
  if (wsStatus) return wsStatus === 'online';
  return astro.onlineStatus === 'online';
}

// User Home Dashboard
export function UserHomeScreen({ navigation }: any) {
  const { user, theme, setTheme } = useAuth();
  const { astrologerStatuses, horoscopeVersion } = useChat();
  const isFocused = useIsFocused();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [horoscope, setHoroscope] = useState<HoroscopeRecord[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [poojas, setPoojas] = useState<MandirPooja[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedSign, setSelectedSign] = useState('aries');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const [a, h, v, b, p, n] = await Promise.all([
        api.astrologers.list(),
        api.horoscope.bySign(selectedSign, todayStr),
        api.videos.list(),
        api.blogs.list(),
        api.mandirPooja.list(),
        api.notifications.list({ userId: user?.id }),
      ]);
      setAstrologers(a);
      setHoroscope(Array.isArray(h) ? h : [h]);
      setVideos(v);
      setBlogs(b);
      setPoojas(p);
      setNotifications(n);
    } catch {} finally { setLoading(false); }
  }, [user?.id, selectedSign, todayStr, horoscopeVersion]);

  useEffect(() => { if (isFocused) loadData(); }, [isFocused, loadData]);

  const fetchHoroscope = async (sign: string) => {
    setHoroscopeLoading(true);
    try {
      const h = await api.horoscope.bySign(sign, todayStr);
      setHoroscope(Array.isArray(h) ? h : [h]);
    } catch {} finally { setHoroscopeLoading(false); }
  };

  const handleSignSelect = (sign: string) => {
    setSelectedSign(sign);
    if (sign !== selectedSign) fetchHoroscope(sign);
  };

  const filteredCategoryAstro = selectedCategory === 'All'
    ? astrologers
    : astrologers.filter(a => a.specialization?.some(s => s.toLowerCase() === selectedCategory.toLowerCase()));

  if (loading) return (
    <ScreenWrapper scroll>
      <SkeletonLoader height={80} />
      <View style={{ height: 16 }} />
      <SkeletonLoader height={48} />
      <View style={{ height: 16 }} />
      <SkeletonLoader height={180} />
      <View style={{ height: 24 }} />
      <SkeletonLoader height={120} />
      <View style={{ height: 16 }} />
      <SkeletonLoader height={48} />
      <View style={{ height: 16 }} />
      <SkeletonLoader height={160} />
      <View style={{ height: 24 }} />
      <SkeletonLoader height={120} />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper style={{ position: 'relative', zIndex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.pageTitle, { marginBottom: 4, color: colors.textPrimary }]}>
              <Ionicons name="sunny" size={24} color={colors.accentGold} /> Namaste
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{user?.name || 'User'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: 8 }}>
              <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ padding: 8, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={28} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
              <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="Today's Horoscope" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
          {ZODIAC_SIGNS.map(z => (
            <TouchableOpacity key={z.sign} onPress={() => handleSignSelect(z.sign)} style={[
              styles.zodiacChip,
              { backgroundColor: selectedSign === z.sign ? colors.primary : colors.surfaceLight, borderColor: selectedSign === z.sign ? colors.primaryLight : colors.cardBorder },
            ]}>
              <Text style={{ fontSize: 16 }}>{z.emoji}</Text>
              <Text style={[typography.caption, { color: selectedSign === z.sign ? colors.white : colors.textSecondary, marginTop: 2 }]}>{z.label.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {horoscopeLoading ? (
          <SkeletonLoader height={120} />
        ) : horoscope.length > 0 ? (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 28 }}>
                {ZODIAC_SIGNS.find(z => z.sign === selectedSign)?.emoji}
              </Text>
              <View>
                <Text style={typography.cardTitle}>{ZODIAC_SIGNS.find(z => z.sign === selectedSign)?.label}</Text>
                <Text style={typography.caption}>{horoscope[0]?.date ? new Date(horoscope[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Today'}</Text>
              </View>
            </View>
            <Text style={[typography.body, { marginBottom: 8 }]}>{horoscope[0]?.prediction?.slice(0, 200)}{(horoscope[0]?.prediction?.length || 0) > 200 ? '...' : ''}</Text>
            {horoscope[0]?.mood && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {horoscope[0].mood && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="moon" size={14} color={colors.accentGold} /><Text style={typography.caption}>{horoscope[0].mood}</Text></View>}
                {horoscope[0].luckyNumber && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="dice" size={14} color={colors.accentGold} /><Text style={typography.caption}>Lucky: {horoscope[0].luckyNumber}</Text></View>}
                {horoscope[0].luckyColor && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="color-palette" size={14} color={colors.accentGold} /><Text style={typography.caption}>{horoscope[0].luckyColor}</Text></View>}
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard><Text style={[typography.body, { textAlign: 'center', marginVertical: 16 }]}>No horoscope available for this sign today. Check back tomorrow!</Text></GlassCard>
        )}

        <View style={{ height: 24 }} />

        <SectionHeader title="Quick Actions" />
        <View style={[styles.quickActions, { marginBottom: 8 }]}>
          <QuickAction icon="planet" label="Kundli" onPress={() => navigation.navigate('Kundli')} />
          <QuickAction icon="heart" label="Matchmaking" onPress={() => navigation.navigate('Matchmaking')} />
          <QuickAction icon="calendar" label="Panchang" onPress={() => navigation.navigate('Panchang')} />
          <QuickAction icon="pricetags" label="Shop" onPress={() => navigation.navigate('Shop')} />
        </View>
        <View style={styles.quickActions}>
          <QuickAction icon="flame" label="Pooja" onPress={() => navigation.navigate('MandirPooja')} />
          <QuickAction icon="heart-circle" label="Donate" onPress={() => navigation.navigate('Donation')} />
          <QuickAction icon="newspaper" label="Blogs" onPress={() => navigation.navigate('Blogs')} />
          <QuickAction icon="videocam" label="Videos" onPress={() => navigation.navigate('Videos')} />
        </View>

        <View style={{ height: 24 }} />

        <SectionHeader title="Live Astrologers" onSeeAll={() => navigation.navigate('AstrologerList', { onlyLive: true })} />
        {astrologers.length > 0 ? (
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={astrologers.filter(a => getAstrologerOnlineStatus(a, astrologerStatuses)).slice(0, 6)} keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('AstrologerDetail', { id: item.id })} style={styles.astroCard}>
                <GlassCard style={styles.astroInner}>
                  <Avatar size={56} online={getAstrologerOnlineStatus(item, astrologerStatuses)} />
                  <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <StarRating rating={parseFloat(item.rating)} size={12} />
                  <Text style={typography.caption}>{item.specialization?.[0] || 'Astrologer'}</Text>
                  <Text style={typography.price}>₹{item.pricePerMin}/min</Text>
                </GlassCard>
              </TouchableOpacity>
            )} style={{ marginLeft: 8 }} />
        ) : (
          <GlassCard><Text style={[typography.body, { textAlign: 'center' }]}>No astrologers available right now</Text></GlassCard>
        )}

        <View style={{ height: 24 }} />

        <SectionHeader title="By Category" onSeeAll={() => navigation.navigate('AstrologerList')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {ASTRO_CATEGORIES.map(cat => (
            <Chip key={cat} label={cat} selected={cat === selectedCategory} onPress={() => setSelectedCategory(cat)} />
          ))}
        </ScrollView>
        {filteredCategoryAstro.length > 0 ? (
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={filteredCategoryAstro.slice(0, 6)} keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('AstrologerDetail', { id: item.id })} style={styles.astroCard}>
                <GlassCard style={styles.astroInner}>
                  <Avatar size={56} online={getAstrologerOnlineStatus(item, astrologerStatuses)} />
                  <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <StarRating rating={parseFloat(item.rating)} size={12} />
                  <Text style={typography.caption}>{item.specialization?.[0] || 'Astrologer'}</Text>
                  <Text style={typography.price}>₹{item.pricePerMin}/min</Text>
                </GlassCard>
              </TouchableOpacity>
            )} style={{ marginLeft: 8 }} />
        ) : (
          <GlassCard><Text style={[typography.body, { textAlign: 'center' }]}>No astrologers in this category</Text></GlassCard>
        )}

        {poojas.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader title="Mandir Pooja" onSeeAll={() => navigation.navigate('MandirPooja')} />
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={poojas.slice(0, 4)} keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate('MandirPooja')} style={{ width: 180, marginRight: 12 }}>
                  <GlassCard style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="flame" size={24} color={colors.accentGold} />
                    </View>
                    <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
                    {item.description && <Text style={[typography.caption, { textAlign: 'center' }]} numberOfLines={2}>{item.description}</Text>}
                    <Text style={typography.price}>₹{item.price}</Text>
                  </GlassCard>
                </TouchableOpacity>
              )} style={{ marginLeft: 8 }} />
          </>
        )}

        {videos.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader title="Videos" onSeeAll={() => navigation.navigate('Videos')} />
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={videos.slice(0, 5)} keyExtractor={(v) => v.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={{ width: 220, marginRight: 12 }}>
                  <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                    <View style={{ height: 120, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="play" size={22} color={colors.white} style={{ marginLeft: 3 }} />
                      </View>
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text style={typography.cardTitle} numberOfLines={2}>{item.title}</Text>
                      {item.category && <Text style={[typography.caption, { marginTop: 4 }]}>{item.category}</Text>}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              )} style={{ marginLeft: 8 }} />
          </>
        )}

        {blogs.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader title="Latest Blogs" onSeeAll={() => navigation.navigate('Blogs')} />
            <FlatList horizontal showsHorizontalScrollIndicator={false} data={blogs.slice(0, 5)} keyExtractor={(b) => b.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate('Blogs')} style={{ width: 240, marginRight: 12 }}>
                  <GlassCard style={{ padding: 16 }}>
                    <Text style={typography.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={[typography.body, { marginTop: 6 }]} numberOfLines={3}>{item.excerpt || item.content?.slice(0, 120)}</Text>
                    {item.tags && item.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {item.tags.slice(0, 3).map(tag => <Chip key={tag} label={tag} />)}
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              )} style={{ marginLeft: 8 }} />
          </>
        )}

        <View style={{ height: 24 }} />
        <SectionHeader title="Support Our Mission" />
        <GlassCard style={{ alignItems: 'center', padding: 24 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="heart" size={28} color={colors.danger} />
          </View>
          <Text style={[typography.cardTitle, { textAlign: 'center' }]}>Make a Donation</Text>
          <Text style={[typography.body, { textAlign: 'center', marginTop: 4, marginBottom: 12 }]}>Your contribution helps us maintain this sacred platform and support our spiritual community.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {['101', '501', '1100', '2100'].map(a => <Chip key={a} label={`₹${a}`} />)}
          </View>
          <GradientButton title="Donate Now" variant="gold" onPress={() => navigation.navigate('Donation')} style={{ width: '100%' }} />
        </GlassCard>

        <View style={{ height: 40 }} />
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
export function AstrologerListScreen({ route, navigation }: any) {
  const { astrologerStatuses } = useChat();
  const isFocused = useIsFocused();
  const [data, setData] = useState<Astrologer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const cats = ['All', 'Vedic', 'Tarot', 'Numerology', 'Palmistry', 'Vastu'];
  const [loading, setLoading] = useState(true);
  const onlyLive = route?.params?.onlyLive ?? false;

  useEffect(() => { if (isFocused) api.astrologers.list().then(setData).finally(() => setLoading(false)); }, [isFocused]);
  
  const filtered = data.filter(a => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.specialization?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCat === 'All' || a.specialization?.some(s => s.toLowerCase() === selectedCat.toLowerCase());
    const matchesLive = !onlyLive || getAstrologerOnlineStatus(a, astrologerStatuses);
    return matchesSearch && matchesCategory && matchesLive;
  });

  return (
    <ScreenWrapper noPadding>
      <View style={{ padding: 16, paddingBottom: 0 }}><Text style={[typography.pageTitle, { color: colors.textPrimary }]}>{onlyLive ? 'Live Astrologers' : 'Astrologers'}</Text></View>
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
            <GlassCard>
              <View style={styles.row}>
                <Avatar size={56} online={getAstrologerOnlineStatus(item, astrologerStatuses)} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={typography.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <StarRating rating={parseFloat(item.rating)} size={12} reviewCount={item.totalReviews} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
                    {item.specialization?.slice(0, 2).map((s) => <Chip key={s} label={s} />)}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={typography.price}>₹{item.pricePerMin}/min</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )} />
    </ScreenWrapper>
  );
}

// Astrologer Detail
export function AstrologerDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const isFocused = useIsFocused();
  const [astro, setAstro] = useState<Astrologer | null>(null);
  const { openConversation } = useChat();
  const { astrologerStatuses } = useChat();
  const { initiateCall } = useCall();
  const [offlineDialogVisible, setOfflineDialogVisible] = useState(false);

  useEffect(() => { if (isFocused) api.astrologers.get(id).then(setAstro); }, [id, isFocused]);
  if (!astro) return <ScreenWrapper><Text style={typography.body}>Loading...</Text></ScreenWrapper>;

  const isVerified = astro.verificationStatus === 'approved';
  const isOnline = getAstrologerOnlineStatus(astro, astrologerStatuses);

  const handleChat = async () => {
    if (!isVerified) { Alert.alert('Not Verified', 'This astrologer is not yet verified. Please choose a verified astrologer.'); return; }
    const convId = await openConversation(id, 'astrologer');
    navigation.navigate('ChatRoom', { conversationId: convId, participantId: id, participantRole: 'astrologer', participantName: astro.name });
  };

  const handleAudioCall = () => {
    if (!isVerified) { Alert.alert('Not Verified', 'This astrologer is not yet verified.'); return; }
    if (!isOnline) { setOfflineDialogVisible(true); return; }
    initiateCall(id, astro.name, 'audio');
  };

  const handleVideoCall = () => {
    if (!isVerified) { Alert.alert('Not Verified', 'This astrologer is not yet verified.'); return; }
    if (!isOnline) { setOfflineDialogVisible(true); return; }
    initiateCall(id, astro.name, 'video');
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Avatar size={80} online={isOnline} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>{astro.name}</Text>
          {isVerified && <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />}
        </View>
        {isOnline ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
            <Text style={[typography.caption, { color: colors.success }]}>Online</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted }} />
            <Text style={[typography.caption, { color: colors.textMuted }]}>Offline</Text>
          </View>
        )}
        <Text style={[typography.body, { marginTop: 8, color: colors.textSecondary }]}>{astro.bio || 'Experienced astrologer'}</Text>
        {!isVerified && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: colors.warning + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
            <Ionicons name="warning-outline" size={14} color={colors.warning} />
            <Text style={[typography.caption, { color: colors.warning }]}>Verification Pending</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: colors.surfaceLight, borderRadius: radii.card, marginTop: 16 }}>
        <Stat label="Experience" value={`${astro.experience}y`} /><Stat label="Price" value={`₹${astro.pricePerMin}/min`} />
      </View>

      <GlassCard style={{ marginTop: 16, padding: 16 }}>
        <Text style={[typography.sectionTitle, { marginBottom: 12 }]}>Details</Text>
        {astro.specialization?.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 4 }]}>Specialization</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {astro.specialization.map(s => <Chip key={s} label={s} />)}
            </View>
          </View>
        )}
        {astro.languages?.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 4 }]}>Languages</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {astro.languages.map(l => <Chip key={l} label={l} />)}
            </View>
          </View>
        )}
        {astro.skills?.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 4 }]}>Skills</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {astro.skills.map(s => <Chip key={s} label={s} />)}
            </View>
          </View>
        )}
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}><GradientButton title="Chat" onPress={handleChat} /></View>
        <View style={{ flex: 1 }}><GradientButton title="Audio Call" variant="gold" onPress={handleAudioCall} /></View>
      </View>
      <View style={{ marginTop: 10 }}>
        <GradientButton title="Video Call" variant="gold" onPress={handleVideoCall} />
      </View>
      <ConfirmDialog
        visible={offlineDialogVisible}
        title="Astrologer Offline"
        subtitle={`${astro.name} is currently offline. Please try again later.`}
        icon={<Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />}
        actions={[
          {
            label: 'OK',
            onPress: () => setOfflineDialogVisible(false),
            variant: 'primary',
          },
        ]}
        onClose={() => setOfflineDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

// Wallet
export function WalletScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const load = useCallback(async () => { const w = await api.wallet.get(); setWallet(w); const t = await api.transactions.listMy(); setTxns(t); }, []);
  useEffect(() => { if (isFocused) load(); }, [isFocused, load]);

  const handleAddFunds = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid amount'); return; }
    setLoadingPayment(true);
    try {
      const order = await api.payments.createOrder({ amount: amt, purpose: 'wallet_recharge' });
      setShowAdd(false);
      setAmount('');
      navigation.navigate('Payment', {
        razorpayOrderId: order.razorpayOrderId,
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        purpose: 'wallet_recharge',
        paymentOrderId: order.id,
      });
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message;
      const msg = serverMsg || e?.message || 'Failed to initiate payment';
      Alert.alert('Payment Error', msg);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleDonate = () => {
    navigation.navigate('Donation');
  };

  return (
    <ScreenWrapper scroll>
      <GlassCard style={styles.balanceCard}>
        <Text style={typography.caption}>Available Balance</Text>
        <Text style={styles.balance}>₹{wallet?.balance || '0'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}><GradientButton title="Add Funds" onPress={() => setShowAdd(true)} small /></View>
          <View style={{ flex: 1 }}><GradientButton title="Donate" variant="gold" onPress={handleDonate} small /></View>
        </View>
      </GlassCard>

      {showAdd && (
        <GlassCard style={{ padding: 20, marginTop: 12 }}>
          <Text style={[typography.cardTitle, { marginBottom: 12 }]}>Enter Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
            value={amount} onChangeText={setAmount}
            placeholder="Amount in ₹" placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, height: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <GradientButton title={loadingPayment ? 'Processing...' : 'Pay Now'} onPress={handleAddFunds} disabled={loadingPayment} />
            </View>
          </View>
        </GlassCard>
      )}

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
  const isFocused = useIsFocused();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (isFocused) { api.shop.list().then(setProducts).finally(() => setLoading(false)); } }, [isFocused]);

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
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    setDeleteOpen(true);
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
          <Toggle value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} />
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

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete Account"
        subtitle="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        actions={[
          { label: 'Cancel', variant: 'secondary', onPress: () => setDeleteOpen(false) },
          { label: 'Delete', variant: 'danger', onPress: async () => {
            setDeleteOpen(false);
            try { await api.users.delete(user!.id); await logout(); } catch {}
          }},
        ]}
        onClose={() => setDeleteOpen(false)}
      />
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
  zodiacChip: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  input: { backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
});

export { MuhuratScreen } from './MuhuratScreen';
