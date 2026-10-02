import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, StyleSheet, Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Image } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ScreenWrapper, GlassCard, SectionHeader, GradientButton, EmptyState, Chip, Toggle, TimePicker, DatePicker, CustomModal, colors, typography, radii, shadows, Navbar, resolveMediaUrl } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import type { Blog, MandirPooja, Notification, PoojaBooking, SupportTicket, TicketReply, NewsItem, Video, PanchangRecord, CommissionLog, HoroscopeRecord, Report } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationTarget } from '../../shared/notification-router';
import { useChat } from '../../context/ChatContext';
import * as DocumentPicker from 'expo-document-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import YoutubeIframe from 'react-native-youtube-iframe';

function SectionTitle({ title }: { title: string }) {
  return null;
}

function to12h(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

// Horoscope
const HOROSCOPE_SIGNS = [
  { sign: 'aries', label: 'Aries', emoji: '♈', range: 'Mar 21 – Apr 19' },
  { sign: 'taurus', label: 'Taurus', emoji: '♉', range: 'Apr 20 – May 20' },
  { sign: 'gemini', label: 'Gemini', emoji: '♊', range: 'May 21 – Jun 20' },
  { sign: 'cancer', label: 'Cancer', emoji: '♋', range: 'Jun 21 – Jul 22' },
  { sign: 'leo', label: 'Leo', emoji: '♌', range: 'Jul 23 – Aug 22' },
  { sign: 'virgo', label: 'Virgo', emoji: '♍', range: 'Aug 23 – Sep 22' },
  { sign: 'libra', label: 'Libra', emoji: '♎', range: 'Sep 23 – Oct 22' },
  { sign: 'scorpio', label: 'Scorpio', emoji: '♏', range: 'Oct 23 – Nov 21' },
  { sign: 'sagittarius', label: 'Sagittarius', emoji: '♐', range: 'Nov 22 – Dec 21' },
  { sign: 'capricorn', label: 'Capricorn', emoji: '♑', range: 'Dec 22 – Jan 19' },
  { sign: 'aquarius', label: 'Aquarius', emoji: '♒', range: 'Jan 20 – Feb 18' },
  { sign: 'pisces', label: 'Pisces', emoji: '♓', range: 'Feb 19 – Mar 20' },
];

export function HoroscopeScreen({ navigation }: any) {
  return (
    <ScreenWrapper scroll noPadding>
      <Navbar title="Horoscope" navigation={navigation} />
      <View style={{ padding: 16 }}>
        <Text style={[typography.sectionTitle, { color: colors.accentGold, fontSize: 24 }]}>
          Horoscope
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, marginBottom: 16 }]}>
          Select your zodiac sign to read today's prediction
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 }}>
          {HOROSCOPE_SIGNS.map((z) => (
            <TouchableOpacity
              key={z.sign}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HoroscopeDetail', { sign: z.sign, label: z.label })}
              style={{
                width: '31.5%',
                marginBottom: 12,
                paddingVertical: 16,
                borderRadius: radii.lg,
                alignItems: 'center',
                backgroundColor: colors.surfaceLight,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 30 }}>{z.emoji}</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13, marginTop: 6 }}>
                {z.label}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 2, textAlign: 'center' }}>
                {z.range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

export function HoroscopeDetailScreen({ route, navigation }: any) {
  const { horoscopeVersion } = useChat();
  const sign: string = (route?.params?.sign || 'aries').toLowerCase();
  const label: string = route?.params?.label || sign;
  const meta = HOROSCOPE_SIGNS.find((z) => z.sign === sign);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [record, setRecord] = useState<HoroscopeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request =
      period === 'daily'
        ? api.horoscope.bySign(sign, today)
        : api.horoscope.byPeriod(sign, period);
    request
      .then((h: any) => {
        if (cancelled) return;
        setRecord(Array.isArray(h) ? h[0] : h);
      })
      .catch((e: any) => {
        if (!cancelled) {
          console.warn('Horoscope fetch failed:', e?.message || e);
          setRecord(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sign, period, horoscopeVersion]);

  const PERIODS = [
    { key: 'daily' as const, label: 'Daily' },
    { key: 'weekly' as const, label: 'Weekly' },
    { key: 'monthly' as const, label: 'Monthly' },
  ];

  return (
    <ScreenWrapper scroll noPadding>
      <Navbar title={`${label} Horoscope`} navigation={navigation} />
      <View style={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 44 }}>{meta?.emoji || '✨'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[typography.sectionTitle, { color: colors.accentGold }]}>{label}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{meta?.range}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceLight, borderRadius: radii.lg, padding: 4, marginBottom: 16 }}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radii.md,
                alignItems: 'center',
                backgroundColor: period === p.key ? colors.accentGold : 'transparent',
              }}
            >
              <Text style={{ color: period === p.key ? '#FFF' : colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <GlassCard><Text style={[typography.body, { textAlign: 'center' }]}>Loading...</Text></GlassCard>
        ) : record?.prediction ? (
          <GlassCard style={{ padding: 16 }}>
            <Text style={[typography.caption, { color: colors.accentGold, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }]}>
              {period} prediction
            </Text>
            <Text style={[typography.body, { lineHeight: 23 }]}>{record.prediction}</Text>
            {period === 'daily' && (
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 16 }}>
                {record.luckyNumber != null && (
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Lucky #</Text>
                    <Text style={[typography.sectionTitle, { color: colors.accentGold }]}>{record.luckyNumber}</Text>
                  </View>
                )}
                {record.luckyColor && (
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Color</Text>
                    <Text style={[typography.sectionTitle, { color: colors.accentGold }]}>{record.luckyColor}</Text>
                  </View>
                )}
                {record.mood && (
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Mood</Text>
                    <Text style={[typography.sectionTitle, { color: colors.accentGold }]}>{record.mood}</Text>
                  </View>
                )}
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard>
            <Text style={[typography.body, { textAlign: 'center', marginVertical: 16 }]}>
              Horoscope is temporarily unavailable. Please try again later.
            </Text>
          </GlassCard>
        )}
      </View>
    </ScreenWrapper>
  );
}

// Panchang
export function PanchangScreen() {
  const { panchangVersion } = useChat();
  const [data, setData] = useState<PanchangRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.panchang.byDate(today).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [panchangVersion]);

  if (loading) {
    return (
      <ScreenWrapper scroll>
        <SectionTitle title="Panchang" />
        <GlassCard><Text style={typography.body}>Loading...</Text></GlassCard>
      </ScreenWrapper>
    );
  }

  const abhijit = data?.data?.abhijitMuhurta;
  const inauspicious = data?.data?.rahuKaal || data?.rahuKaal;

  const gridItems = data
    ? [
        { icon: 'star', label: 'Nakshatra', value: data.nakshatra },
        { icon: 'leaf', label: 'Yoga', value: data.yoga },
        { icon: 'time', label: 'Karana', value: data.karana },
        { icon: 'partly-sunny', label: 'Paksha', value: data.tithi?.startsWith('Shukla') ? 'Shukla' : data.tithi?.startsWith('Krishna') ? 'Krishna' : undefined },
      ].filter((i) => i.value)
    : [];

  return (
    <ScreenWrapper scroll>
      <View style={{ paddingBottom: 100 }}>
        <Text style={[typography.sectionTitle, { color: colors.accentGold, fontSize: 24 }]}>Panchang</Text>
        {data ? (
          <>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, marginBottom: 16 }]}>
              {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>

            <GlassCard style={{ padding: 18, alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="moon" size={26} color={colors.accentGold} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>Tithi</Text>
              <Text style={[typography.sectionTitle, { color: colors.textPrimary, fontSize: 22, marginTop: 2, textAlign: 'center' }]}>
                {data.tithi || '-'}
              </Text>
            </GlassCard>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {gridItems.map((item) => (
                <GlassCard key={item.label} style={{ width: '48.5%', padding: 14, marginBottom: 10 }}>
                  <Ionicons name={item.icon as any} size={18} color={colors.accentGold} />
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>{item.label}</Text>
                  <Text style={[typography.cardTitle, { color: colors.textPrimary, marginTop: 2 }]} numberOfLines={2}>
                    {item.value}
                  </Text>
                </GlassCard>
              ))}
            </View>

            <GlassCard style={{ padding: 16, marginTop: 2 }}>
              <Text style={[typography.caption, { color: colors.accentGold, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }]}>
                Sun & Moon
              </Text>
              <Row icon="sunny" label="Sunrise" value={data.sunrise ? to12h(data.sunrise) : undefined} />
              <Row icon="sunny" label="Sunset" value={data.sunset ? to12h(data.sunset) : undefined} />
              <Row icon="moon" label="Moonrise" value={data.moonrise ? to12h(data.moonrise) : undefined} />
              <Row icon="moon" label="Moonset" value={data.moonset ? to12h(data.moonset) : undefined} />
            </GlassCard>

            <GlassCard style={{ padding: 16, marginTop: 12 }}>
              <Text style={[typography.caption, { color: colors.accentGold, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }]}>
                Muhurta
              </Text>
              {inauspicious && (
                <Row
                  icon="alert-circle"
                  label="Rahu Kaal (avoid)"
                  value={`${to12h(inauspicious.start)} - ${to12h(inauspicious.end)}`}
                />
              )}
              {abhijit && (
                <Row
                  icon="checkmark-circle"
                  label="Abhijit (auspicious)"
                  value={`${to12h(abhijit.start)} - ${to12h(abhijit.end)}`}
                />
              )}
            </GlassCard>
          </>
        ) : (
          <GlassCard>
            <Text style={[typography.body, { textAlign: 'center', marginVertical: 16 }]}>
              No panchang data available for today
            </Text>
          </GlassCard>
        )}
      </View>
    </ScreenWrapper>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
      <Ionicons name={icon as any} size={18} color={colors.accentGold} style={{ marginRight: 10 }} />
      <Text style={[typography.body, { flex: 1, color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.body, { fontWeight: '600', color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

// Videos
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function VideosScreen({ route }: any) {
  const isFocused = useIsFocused();
  const { videoVersion } = useChat();
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const videoRef = useRef<ExpoVideo>(null);
  const { width } = Dimensions.get('window');
  useEffect(() => { if (isFocused) api.videos.list().then(setVideos).catch(() => {}); }, [isFocused, videoVersion]);
  useEffect(() => {
    if (route?.params?.videoId && videos.length > 0) {
      const found = videos.find(v => v.id === route.params.videoId);
      if (found) setPlayingVideo(found);
    }
  }, [route?.params?.videoId, videos]);
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Videos" />
      {videos.length === 0 ? <EmptyState icon={<Ionicons name="videocam-outline" size={48} color={colors.textMuted} />} title="No videos yet" /> :
        videos.map(v => {
          const ytId = getYouTubeId(v.url);
          const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : v.thumbnail;
          return (
          <TouchableOpacity key={v.id} style={{ marginBottom: 12 }} onPress={() => {
            setPlayingVideo(v);
          }}>
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ height: 180, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                {thumbUrl ? (
                  <Image source={{ uri: thumbUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : null}
                <View style={{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
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
          );
        })}
      <Modal visible={!!playingVideo} transparent animationType="slide" onRequestClose={() => { setPlayingVideo(null); videoRef.current?.stopAsync(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => { setPlayingVideo(null); videoRef.current?.stopAsync(); }}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {playingVideo?.url ? (
            getYouTubeId(playingVideo.url) ? (
              <YoutubeIframe
                height={width * 0.5625}
                width={width}
                videoId={getYouTubeId(playingVideo.url)!}
                play
                webViewStyle={{ backgroundColor: '#000' }}
              />
            ) : (
              <ExpoVideo ref={videoRef} source={{ uri: playingVideo.url }} style={{ width, height: width * 0.5625 }} resizeMode={ResizeMode.CONTAIN} shouldPlay useNativeControls />
            )
          ) : null}
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// Blogs with data
export function BlogsScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { blogVersion } = useChat();
  const { role } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  useEffect(() => { if (isFocused) api.blogs.list({ published: 'true' }).then(setBlogs).catch(() => {}); }, [isFocused, blogVersion]);
  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Blogs" />
      {(role === 'astrologer' || role === 'admin') && (
        <GradientButton
          title="Create Blog"
          onPress={() => navigation.navigate('CreateBlog')}
          style={{ marginBottom: 16 }}
        />
      )}
      {blogs.length === 0 ? <EmptyState icon={<Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />} title="No blogs yet" /> :
        blogs.map(b => (
          <TouchableOpacity key={b.id} onPress={() => navigation.navigate('BlogDetail', { blogId: b.id })} style={{ marginBottom: 12 }}>
            <GlassCard>
              <Text style={typography.cardTitle}>{b.title}</Text>
              <Text style={typography.body} numberOfLines={3}>{b.excerpt || b.content?.slice(0, 150)}</Text>
              {b.tags?.length > 0 && <Text style={typography.caption}>{b.tags.join(', ')}</Text>}
            </GlassCard>
          </TouchableOpacity>
        ))}
      <View style={{ height: 40 }} />
    </ScreenWrapper>
  );
}

function NewsCard({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 12 }}>
      <GlassCard>
        {!!item.image && (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 10 }} resizeMode="cover" />
        )}
        <Text style={typography.cardTitle}>{item.title}</Text>
        <Text style={[typography.body, { marginTop: 4 }]} numberOfLines={3}>{item.content}</Text>
        <Text style={[typography.caption, { marginTop: 6 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

export function NewsScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { newsVersion } = useChat();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setNews(await api.news.list()); } catch {}
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, newsVersion, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScreenWrapper noPadding>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {news.length === 0 ? (
          <EmptyState icon={<Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />} title="No news yet" subtitle="Check back soon for updates" />
        ) : (
          news.map((n) => (
            <NewsCard key={n.id} item={n} onPress={() => navigation.navigate('NewsDetail', { newsId: n.id })} />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

export function NewsDetailScreen({ route }: any) {
  const { newsId } = route.params;
  const { newsVersion } = useChat();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.news.get(newsId).then(setItem).catch(() => setItem(null)).finally(() => setLoading(false));
  }, [newsId, newsVersion]);

  if (loading) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>Loading...</Text></GlassCard></ScreenWrapper>;
  if (!item) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>News not found</Text></GlassCard></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}>
        <GlassCard style={{ padding: 20 }}>
          {!!item.image && (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />
          )}
          <Text style={[typography.pageTitle, { color: colors.textPrimary, marginBottom: 6 }]}>{item.title}</Text>
          <Text style={[typography.caption, { marginBottom: 12 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>{item.content}</Text>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
}

// Notifications with data
export function NotificationsScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user, astrologer, role } = useAuth();
  const { notificationVersion } = useChat();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = useCallback(async () => {
    const uid = route?.params?.userId || user?.id || astrologer?.userId;
    if (uid) {
      try {
        const data = await api.notifications.list({ userId: uid });
        setNotifs(data);
      } catch {}
    }
  }, [route?.params?.userId, user?.id, astrologer?.userId]);

  useEffect(() => {
    if (isFocused) {
      loadNotifs();
    }
  }, [isFocused, loadNotifs, notificationVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifs();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    try { await api.notifications.markRead(id); setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); } catch {}
  };

  const handlePress = (n: Notification) => {
    if (!n.isRead) markRead(n.id);
    const target = resolveNotificationTarget(n, role || 'user');
    if (target) navigation.navigate(target.screen, target.params);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />}
      >
        {notifs.length === 0 ? (
          <EmptyState icon={<Ionicons name="notifications-outline" size={48} color={colors.textMuted} />} title="No notifications" subtitle="You're all caught up!" />
        ) : (
          notifs.map(n => {
            const isOrder = (n.data as any)?.screen === 'OrderHistory';
            const iconName = isOrder
              ? 'cube-outline'
              : n.type === 'system'
              ? 'settings-outline'
              : n.type === 'promotional'
              ? 'megaphone-outline'
              : 'cash-outline';
            return (
              <TouchableOpacity key={n.id} onPress={() => handlePress(n)}>
                <GlassCard style={{ marginBottom: 8, padding: 14, opacity: n.isRead ? 0.85 : 1 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.isRead ? colors.surfaceLight : colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={iconName} size={20} color={n.isRead ? colors.textMuted : colors.primaryLight} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: n.type === 'system' ? colors.primary + '20' : n.type === 'promotional' ? '#9333EA30' : n.type === 'transactional' ? '#10B98130' : '#F59E0B30' }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: n.type === 'system' ? colors.primaryLight : n.type === 'promotional' ? '#A855F7' : n.type === 'transactional' ? '#10B981' : '#F59E0B', textTransform: 'uppercase' }}>{n.type}</Text>
                        </View>
                        <Text style={[typography.cardTitle, { fontSize: 14, flex: 1 }]}>{n.title}</Text>
                      </View>
                      <Text style={[typography.body, { fontSize: 13, marginTop: 2 }]}>{n.body}</Text>
                      <Text style={[typography.caption, { marginTop: 4 }]}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                    </View>
                    {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight, marginTop: 4 }} />}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// Edit Profile
export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, astrologer, role, updateUser } = useAuth();
  const profile = role === 'astrologer' ? astrologer : user;
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [gender, setGender] = useState((profile as any)?.gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState((profile as any)?.dateOfBirth ? (profile as any).dateOfBirth.split('T')[0] : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Astrologer-specific fields
  const [bio, setBio] = useState((profile as any)?.bio || '');
  const [experience, setExperience] = useState(String((profile as any)?.experience || ''));
  const [specialization, setSpecialization] = useState(((profile as any)?.specialization || []).join(', '));
  const [languages, setLanguages] = useState(((profile as any)?.languages || []).join(', '));
  const [skills, setSkills] = useState(((profile as any)?.skills || []).join(', '));
  const [chatPricePerMin, setChatPricePerMin] = useState((profile as any)?.chatPricePerMin || (profile as any)?.pricePerMin || '');
  const [audioCallPricePerMin, setAudioCallPricePerMin] = useState((profile as any)?.audioCallPricePerMin || (profile as any)?.pricePerMin || '');
  const [videoCallPricePerMin, setVideoCallPricePerMin] = useState((profile as any)?.videoCallPricePerMin || (profile as any)?.pricePerMin || '');

  useEffect(() => {
    const fetchLatest = async () => {
      const id = (profile as any)?.userId || profile?.id;
      if (!id) return;
      try {
        if (role === 'astrologer') {
          const fresh = await api.astrologers.get(id);
          if (fresh) await updateUser(fresh as any);
        } else if (role === 'user') {
          const fresh = await api.users.get(id);
          if (fresh) await updateUser(fresh as any);
        }
      } catch (err) {}
    };
    fetchLatest();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setGender((profile as any).gender || 'male');
      setDateOfBirth((profile as any).dateOfBirth ? (profile as any).dateOfBirth.split('T')[0] : '');
      if (role === 'astrologer') {
        setBio((profile as any).bio || '');
        setExperience(String((profile as any).experience || ''));
        setSpecialization(((profile as any).specialization || []).join(', '));
        setLanguages(((profile as any).languages || []).join(', '));
        setSkills(((profile as any).skills || []).join(', '));
        setChatPricePerMin((profile as any).chatPricePerMin || (profile as any).pricePerMin || '');
        setAudioCallPricePerMin((profile as any).audioCallPricePerMin || (profile as any).pricePerMin || '');
        setVideoCallPricePerMin((profile as any).videoCallPricePerMin || (profile as any).pricePerMin || '');
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    const targetId = (profile as any)?.userId || profile?.id;
    if (!targetId) {
      Alert.alert('Error', 'User ID not found.');
      return;
    }
    setLoading(true);
    try {
      let updated;
      if (role === 'astrologer') {
        updated = await api.astrologers.update(targetId, {
          name: name.trim(),
          phone: phone.trim(),
          gender,
          dateOfBirth: dateOfBirth || null,
          bio,
          experience: parseInt(experience) || 0,
          specialization: specialization.split(',').map((s: string) => s.trim()).filter(Boolean),
          languages: languages.split(',').map((s: string) => s.trim()).filter(Boolean),
          skills: skills.split(',').map((s: string) => s.trim()).filter(Boolean),
          chatPricePerMin,
          audioCallPricePerMin,
          videoCallPricePerMin,
        });
      } else if (role === 'admin') {
        updated = await api.admins.update(targetId, { name: name.trim() });
      } else {
        updated = await api.users.update(targetId, {
          name: name.trim(),
          phone: phone.trim(),
          gender,
          dateOfBirth: dateOfBirth || null,
        });
      }
      if (updated) {
        await updateUser(updated as any);
      }
      Alert.alert('Profile Updated', 'Your changes have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message;
      const msg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      Alert.alert('Update Failed', msg || e?.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper noPadding>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: keyboardOpen ? 300 : 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16 }}>
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

              <DatePicker
                visible={showDatePicker}
                value={dateOfBirth}
                onClose={() => setShowDatePicker(false)}
                onSelect={setDateOfBirth}
              />
            </>
          )}

          {role === 'astrologer' && (
            <>
              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Bio</Text>
                <TextInput
                  style={[styles.input, { height: 80, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell clients about yourself"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Experience (years)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Specialization (comma separated)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholder="e.g. Vedic, Palmistry, Vastu"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Languages (comma separated)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="e.g. Hindi, English, Tamil"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Skills (comma separated)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="e.g. Birth Chart, Predictions, Remedies"
                  placeholderTextColor={colors.textMuted}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Chat price per minute (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={chatPricePerMin}
                  onChangeText={setChatPricePerMin}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Audio call price per minute (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={audioCallPricePerMin}
                  onChangeText={setAudioCallPricePerMin}
                  placeholder="e.g. 15"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
              <View style={{ marginBottom: 14 }}>
                <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Video call price per minute (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
                  value={videoCallPricePerMin}
                  onChangeText={setVideoCallPricePerMin}
                  placeholder="e.g. 20"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
            </>
          )}

          <GradientButton title={loading ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={loading} style={{ marginTop: 16 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// Support (moved to SupportScreens.tsx)

// Donation
export function DonationScreen() {
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid donation amount'); return; }
    setLoading(true);
    try {
      const order = await api.payments.createOrder({ amount: amt, purpose: 'donation' });
      navigation.navigate('Payment', {
        razorpayOrderId: order.razorpayOrderId,
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        purpose: 'donation',
        paymentOrderId: order.id,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to initiate donation');
    } finally {
      setLoading(false);
    }
  };

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
        <GradientButton title={loading ? 'Processing...' : 'Donate Now'} variant="gold" onPress={handleDonate} disabled={loading} style={{ marginTop: 12 }} />
      </GlassCard>
    </ScreenWrapper>
  );
}

// Report
export function ReportScreen({ route, navigation }: any) {
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const reasons = ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'];
  const { reportedUserId, reportedAstrologerId, astrologerName, userName, reportedUserName } = route.params || {};
  const targetName = astrologerName || userName || reportedUserName;

  const handleSubmitReport = async () => {
    try {
      setSubmitting(true);
      await api.reports.create({ reason, description: desc, reportedUserId, reportedAstrologerId });
      Alert.alert('Reported', 'Your report has been submitted successfully.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper scroll style={{ padding: 16 }}>
      <SectionTitle title={targetName ? `Report ${targetName}` : 'Report Profile'} />
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 14 }]}>
        Please select the reason for reporting this profile. Our team reviews all reports carefully.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {reasons.map(r => (
          <Chip key={r} label={r.replace(/_/g, ' ')} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </View>
      <View style={{ marginBottom: 16 }}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          Additional Details (Optional)
        </Text>
        <TextInput
          style={[styles.input, { height: 100, backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, color: colors.textPrimary }]}
          value={desc}
          onChangeText={setDesc}
          placeholder="Please describe the issue..."
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />
      </View>
      <GradientButton
        title={submitting ? 'Submitting...' : 'Submit Report'}
        variant="danger"
        disabled={submitting}
        onPress={() => {
          if (!reason) { Alert.alert('Required', 'Please select a reason'); return; }
          handleSubmitReport();
        }}
      />
    </ScreenWrapper>
  );
}

function ReportsStatusScreen({ navigation, mode }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (mode === 'received' ? api.reports.received() : api.reports.my())
      .then((r) => {
        if (!cancelled) setReports(r);
      })
      .catch((e: any) => console.warn('Reports fetch failed:', e?.message || e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <ScreenWrapper scroll noPadding>
      <Navbar
        title={mode === 'received' ? 'Reports Against Me' : 'My Reports'}
        navigation={navigation}
      />
      <View style={{ padding: 16, paddingBottom: 100 }}>
        {loading ? (
          <GlassCard><Text style={typography.body}>Loading...</Text></GlassCard>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />}
            title="No reports"
            subtitle={mode === 'received' ? 'No reports have been filed against you.' : 'You have not filed any reports yet.'}
          />
        ) : (
          reports.map((r) => {
            const reviewed = (r.status || '').toLowerCase() === 'reviewed';
            return (
              <GlassCard key={r.id} style={{ padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.cardTitle, { flex: 1, textTransform: 'capitalize' }]}>
                    {String(r.reason || '').replace(/_/g, ' ')}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: reviewed ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: reviewed ? colors.success : colors.warning }}>
                      {reviewed ? 'Reviewed' : 'Pending'}
                    </Text>
                  </View>
                </View>
                {r.description ? (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                    {r.description}
                  </Text>
                ) : null}
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 8 }]}>
                  Filed {new Date(r.createdAt).toLocaleDateString()}
                  {r.resolvedAt ? ` · Reviewed ${new Date(r.resolvedAt).toLocaleDateString()}` : ''}
                </Text>
              </GlassCard>
            );
          })
        )}
      </View>
    </ScreenWrapper>
  );
}

export function MyReportsScreen(props: any) {
  return <ReportsStatusScreen {...props} mode="mine" />;
}

export function AstrologerReportsScreen(props: any) {
  return <ReportsStatusScreen {...props} mode="received" />;
}

// Mandir Pooja
export function MandirPoojaScreen({ route, navigation }: any) {
  const { user, theme } = useAuth();
  const isDark = theme === 'dark';
  const isFocused = useIsFocused();
  const initialTab = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState<'available' | 'bookings'>(initialTab === 'bookings' ? 'bookings' : 'available');
  const [poojas, setPoojas] = useState<MandirPooja[]>([]);
  const [bookings, setBookings] = useState<PoojaBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<PoojaBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab === 'bookings') {
      setActiveTab('bookings');
    }
  }, [initialTab]);

  const loadData = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([
        api.mandirPooja.list(),
        api.mandirPooja.bookings({ userId: user?.id }).catch(() => []),
      ]);
      setPoojas(p);
      setBookings(b);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const getStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'completed') {
      return {
        label: 'Completed',
        icon: 'checkmark-circle' as const,
        color: '#10B981',
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
        desc: 'The sacred rituals have been successfully performed by temple priests.',
      };
    }
    if (s === 'confirmed') {
      return {
        label: 'Scheduled',
        icon: 'time' as const,
        color: '#F59E0B',
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        desc: 'Puja is confirmed. Priests will perform the rituals on the scheduled date.',
      };
    }
    if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        icon: 'close-circle' as const,
        color: '#EF4444',
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
        desc: 'This puja booking has been cancelled.',
      };
    }
    return {
      label: 'Pending',
      icon: 'hourglass-outline' as const,
      color: '#6B7280',
      bg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
      border: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB',
      desc: 'Awaiting confirmation from temple management.',
    };
  };

  if (loading) {
    return (
      <ScreenWrapper scroll>
        <SectionTitle title="Mandir Pooja" />
        <GlassCard><Text style={typography.body}>Loading...</Text></GlassCard>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Mandir Pooja" />

      {/* Segmented Tab Switcher */}
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceLight, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('available')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: activeTab === 'available' ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Ionicons name="flame" size={16} color={activeTab === 'available' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'available' ? '#FFF' : colors.textSecondary }}>
            Available Pujas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('bookings')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: activeTab === 'bookings' ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Ionicons name="calendar-outline" size={16} color={activeTab === 'bookings' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'bookings' ? '#FFF' : colors.textSecondary }}>
            My Bookings{bookings.length > 0 ? ` (${bookings.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Available Pujas */}
      {activeTab === 'available' && (
        poojas.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', padding: 28 }}>
            <Ionicons name="flame" size={48} color={colors.accentGold} />
            <Text style={[typography.cardTitle, { marginTop: 12 }]}>No Pujas Available</Text>
            <Text style={[typography.body, { textAlign: 'center', marginTop: 8, color: colors.textSecondary }]}>
              Check back soon for upcoming sacred pujas and temple ceremonies.
            </Text>
          </GlassCard>
        ) : (
          <View style={{ gap: 10 }}>
            {poojas.map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('MandirPoojaDetail', { poojaId: p.id })}>
                <GlassCard style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="flame" size={24} color={colors.accentGold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.cardTitle}>{p.name}</Text>
                    {p.description && <Text style={typography.caption} numberOfLines={2}>{p.description}</Text>}
                    <Text style={[typography.price, { marginTop: 4 }]}>₹{p.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )
      )}

      {/* Tab 2: My Bookings */}
      {activeTab === 'bookings' && (
        bookings.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', padding: 28, marginTop: 12 }}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.accentGold} />
            <Text style={[typography.cardTitle, { marginTop: 14, textAlign: 'center' }]}>No Puja Bookings Yet</Text>
            <Text style={[typography.body, { textAlign: 'center', marginTop: 8, color: colors.textSecondary, lineHeight: 20 }]}>
              Book sacred Vedic pujas performed by experienced temple priests for health, peace, and prosperity.
            </Text>
            <GradientButton
              title="Browse Available Pujas"
              onPress={() => setActiveTab('available')}
              style={{ marginTop: 20, minWidth: 200 }}
            />
          </GlassCard>
        ) : (
          <View style={{ gap: 12 }}>
            {bookings.map(b => {
              const matchedPooja = poojas.find(p => p.id === b.poojaId);
              const poojaName = b.poojaName || matchedPooja?.name || 'Sacred Mandir Puja';
              const poojaDesc = b.poojaDescription || matchedPooja?.description;
              const badge = getStatusBadge(b.status);

              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBooking({ ...b, poojaName, poojaDescription: poojaDesc })}
                >
                  <GlassCard style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="flame" size={22} color={colors.accentGold} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.cardTitle, { fontSize: 16 }]} numberOfLines={1}>
                            {poojaName}
                          </Text>
                          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                            Booking ID: #{b.id.slice(0, 8).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: badge.bg,
                        borderWidth: 1,
                        borderColor: badge.border,
                      }}>
                        <Ionicons name={badge.icon} size={13} color={badge.color} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: badge.color }}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', marginVertical: 12 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar" size={15} color={colors.primary} />
                        <Text style={[typography.caption, { color: colors.textPrimary, fontWeight: '600' }]}>
                          Date: {new Date(b.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.accentGold }}>
                        ₹{b.amount}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10, lineHeight: 17 }}>
                      {badge.desc}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        View Full Details
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )
      )}

      {/* Puja Details Modal */}
      <CustomModal
        visible={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking?.poojaName || "Puja Booking Details"}
      >
        {selectedBooking && (
          <View style={{ padding: 16, gap: 16, paddingBottom: 36 }}>
            {/* Status Card */}
            {(() => {
              const badge = getStatusBadge(selectedBooking.status);
              return (
                <View
                  style={{
                    backgroundColor: badge.bg,
                    borderColor: badge.border,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name={badge.icon} size={28} color={badge.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: badge.color }}>
                      Status: {badge.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: badge.color, marginTop: 2, lineHeight: 16, opacity: 0.9 }}>
                      {badge.desc}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Puja Info Grid */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.surfaceLight,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Scheduled Date</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>
                  {new Date(selectedBooking.bookingDate).toLocaleDateString([], {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.divider }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Amount Paid</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.accentGold }}>
                  ₹{selectedBooking.amount}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.divider }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Booking ID</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textPrimary }}>
                  #{selectedBooking.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>

              {selectedBooking.transactionReference && (
                <>
                  <View style={{ height: 1, backgroundColor: colors.divider }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Transaction Ref</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textPrimary }}>
                      {selectedBooking.transactionReference}
                    </Text>
                  </View>
                </>
              )}

              <View style={{ height: 1, backgroundColor: colors.divider }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Booked On</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {new Date(selectedBooking.createdAt).toLocaleDateString()} · {new Date(selectedBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {/* About Puja */}
            {selectedBooking.poojaDescription && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textPrimary, marginBottom: 6 }}>
                  About this Puja & Rituals
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
                  {selectedBooking.poojaDescription}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <GradientButton
                title="Book Another Puja"
                onPress={() => {
                  setSelectedBooking(null);
                  setActiveTab("available");
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </CustomModal>
    </ScreenWrapper>
  );
}

// Mandir Pooja Detail (moved to MandirPoojaDetailScreen.tsx)

// Order History
const ORDER_STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: colors.warning, icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: colors.accentGold, icon: 'checkmark-circle-outline' },
  processing: { label: 'Processing', color: colors.accentGold, icon: 'sync-outline' },
  shipped: { label: 'Shipped', color: '#0EA5E9', icon: 'cube-outline' },
  delivered: { label: 'Delivered', color: colors.success, icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: colors.danger, icon: 'close-circle-outline' },
};

function orderStatusMeta(status: string) {
  const key = (status || '').toLowerCase().trim();
  return (
    ORDER_STATUS_META[key] || {
      label: status || 'Unknown',
      color: colors.textMuted,
      icon: 'ellipse-outline',
    }
  );
}

export function OrderHistoryScreen() {
  const isFocused = useIsFocused();
  const { orderVersion } = useChat();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.orders.my();
      setOrders(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadOrders().finally(() => setLoading(false));
    }
  }, [isFocused, loadOrders, orderVersion]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={typography.pageTitle}>Order History</Text>
        <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }}>
          <Ionicons
            name={refreshing ? 'hourglass-outline' : 'refresh-outline'}
            size={22}
            color={colors.accentGold}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={[typography.body, { textAlign: 'center', marginTop: 20 }]}>Loading orders...</Text>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />}
          title="No orders yet"
          subtitle="Items you purchase will appear here"
        />
      ) : (
        orders.map((order) => {
          const meta = orderStatusMeta(order.status);
          const isOpen = expandedId === order.id;
          const items: any[] = order.items || [];
          const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

          return (
            <GlassCard key={order.id} style={{ marginBottom: 12, padding: 16 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setExpandedId(isOpen ? null : order.id)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.cardTitle}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={[typography.caption, { marginTop: 2 }]}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                    <Text style={[typography.caption, { marginTop: 2 }]}>
                      {itemCount} item{itemCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: meta.color + '22',
                      }}
                    >
                      <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                      <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700' }}>
                        {meta.label.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={typography.price}>₹{order.totalAmount}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textMuted}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View
                  style={{
                    marginTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder,
                    paddingTop: 12,
                  }}
                >
                  <Text style={[typography.cardTitle, { marginBottom: 8 }]}>Order Details</Text>
                  {items.length === 0 ? (
                    <Text style={typography.caption}>No items recorded for this order</Text>
                  ) : (
                    items.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.cardBorder,
                        }}
                      >
                        {item.productImage ? (
                          <Image
                            source={{ uri: resolveMediaUrl(item.productImage) }}
                            style={{ width: 40, height: 40, borderRadius: 8 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              backgroundColor: colors.surfaceLight,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="cube-outline" size={20} color={colors.accentGold} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                            {item.productName || 'Product'}
                          </Text>
                          <Text style={typography.caption}>
                            Qty {item.quantity} x ₹{item.unitPrice}
                          </Text>
                        </View>
                        <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
                          ₹{item.totalPrice}
                        </Text>
                      </View>
                    ))
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '700' }]}>
                      Order Total
                    </Text>
                    <Text style={typography.price}>₹{order.totalAmount}</Text>
                  </View>

                  {order.shippingAddress && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>
                        Shipping Address
                      </Text>
                      <Text style={typography.body}>
                        {typeof order.shippingAddress === 'string'
                          ? order.shippingAddress
                          : JSON.stringify(order.shippingAddress)}
                      </Text>
                    </View>
                  )}

                  <Text style={[typography.caption, { marginTop: 10, color: colors.textMuted }]}>
                    Order ID: {order.id}
                  </Text>
                </View>
              )}
            </GlassCard>
          );
        })
      )}
    </ScreenWrapper>
  );
}

// Astrologer: Requests
export function AstrologerRequestsScreen() {
  const { astrologer } = useAuth();
  const isFocused = useIsFocused();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      if (astrologer?.userId) {
        api.calls.list({ astrologerId: astrologer.userId })
          .then(c => setRequests(c.filter((r: any) => r.status === 'initiated')))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isFocused, astrologer?.userId]);

  if (loading) return <ScreenWrapper scroll><SectionTitle title="User Requests" /><GlassCard><Text style={typography.body}>Loading...</Text></GlassCard></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="User Requests" />
      {requests.length === 0 ? (
        <EmptyState icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />} title="No pending requests" subtitle="Users who want to connect will appear here" />
      ) : (
        requests.map(r => (
          <GlassCard key={r.id} style={{ marginBottom: 8, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[typography.cardTitle, { fontSize: 14 }]}>{(r as any).userName || 'User'}</Text>
                <Text style={typography.caption}>{r.type === 'video' ? 'Video Call' : 'Audio Call'} · {new Date(r.createdAt).toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <GradientButton title="Accept" onPress={() => api.calls.updateStatus(r.id, 'ongoing').then(() => setRequests(prev => prev.filter(x => x.id !== r.id)))} small />
                <GradientButton title="Decline" variant="danger" onPress={() => api.calls.updateStatus(r.id, 'cancelled').then(() => setRequests(prev => prev.filter(x => x.id !== r.id)))} small />
              </View>
            </View>
          </GlassCard>
        ))
      )}
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
    if (!astrologer?.userId) return;
    api.schedule.byAstrologer(astrologer.userId).then((data: any[]) => {
      const map: Record<number, any> = {};
      data.forEach(s => { map[s.dayOfWeek] = { startTime: s.startTime.slice(0, 5), endTime: s.endTime.slice(0, 5), isAvailable: s.isAvailable }; });
      setSchedules(map);
    }).catch(() => {});
  }, [astrologer?.userId]);

  const updateDay = (day: number, field: string, value: string | boolean) => {
    setSchedules(prev => ({ ...prev, [day]: { ...prev[day] || { startTime: '09:00', endTime: '18:00', isAvailable: true }, [field]: value } }));
  };

  const saveAll = async () => {
    if (!astrologer?.userId) return;
    setLoading(true);
    try {
      const bulk = Object.entries(schedules).map(([day, s]) => ({
        dayOfWeek: Number(day), startTime: s.startTime, endTime: s.endTime, isAvailable: s.isAvailable,
      }));
      await api.schedule.bulkUpsert(astrologer.userId, bulk);
      Alert.alert('Saved', 'Schedule updated successfully');
    } catch { Alert.alert('Error', 'Failed to save schedule'); }
    finally { setLoading(false); }
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', padding: 16 }}>
        <SectionTitle title="Availability Schedule" />
        <Text style={[typography.body, { marginBottom: 16, paddingHorizontal: 4 }]}>Set your weekly availability for consultations</Text>
        {days.map((d, i) => {
          const s = schedules[i];
          const isAvail = s?.isAvailable ?? true;
          return (
            <GlassCard key={d} style={{ marginBottom: 8, padding: 14 }}>
              <View style={{ gap: 8 }}>
                {/* Header Row: Day Name + Toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.cardTitle, { opacity: isAvail ? 1 : 0.4, fontSize: 15 }]}>
                    {d}
                  </Text>
                  <Toggle
                    value={isAvail}
                    onValueChange={(v) => updateDay(i, 'isAvailable', v)}
                    trackColor={{ false: colors.textMuted, true: colors.success }}
                  />
                </View>

                {/* Time Picker Row (Fills width dynamically, hides if unavailable) */}
                {isAvail && (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <TimePicker
                        value={s?.startTime || '09:00'}
                        onChange={(v) => updateDay(i, 'startTime', v)}
                      />
                    </View>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>to</Text>
                    <View style={{ flex: 1 }}>
                      <TimePicker
                        value={s?.endTime || '18:00'}
                        onChange={(v) => updateDay(i, 'endTime', v)}
                      />
                    </View>
                  </View>
                )}
              </View>
            </GlassCard>
          );
        })}
        <GradientButton title={loading ? 'Saving...' : 'Save Schedule'} onPress={saveAll} disabled={loading} style={{ marginTop: 16 }} />
      </View>
    </ScreenWrapper>
  );
}

// Astrologer: Documents
export function AstrologerDocumentsScreen() {
  const { astrologer, updateUser } = useAuth();
  const [docs, setDocs] = useState<string[]>(astrologer?.verificationDoc || []);
  const [status, setStatus] = useState(astrologer?.verificationStatus || 'pending');
  const [note, setNote] = useState(astrologer?.verificationNote || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!astrologer?.userId) return;
    api.astrologers.get(astrologer.userId).then((fresh) => {
      setDocs(fresh.verificationDoc || []);
      setStatus(fresh.verificationStatus || 'pending');
      setNote(fresh.verificationNote || '');
    }).catch(() => {});
  }, [astrologer?.userId]);

  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setUploading(true);
      const uploaded = await api.uploadFile({ uri: file.uri, name: file.name, mimeType: file.mimeType }, 'minio');
      const newDocs = [...docs, uploaded.url];
      setDocs(newDocs);
      const updatePayload: any = { verificationDoc: newDocs };
      if (status === 'rejected') {
        updatePayload.verificationStatus = 'pending';
        setStatus('pending');
        setNote('');
      }
      await api.astrologers.update((astrologer!.userId || astrologer!.id) as string, updatePayload);
      updateUser({ ...astrologer!, verificationDoc: newDocs, verificationStatus: updatePayload.verificationStatus || status });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (index: number) => {
    const newDocs = docs.filter((_, i) => i !== index);
    setDocs(newDocs);
    await api.astrologers.update((astrologer!.userId || astrologer!.id) as string, { verificationDoc: newDocs });
    updateUser({ ...astrologer!, verificationDoc: newDocs });
  };

  const statusBadge = { pending: { color: '#F59E0B', label: 'Pending Review' }, approved: { color: '#22C55E', label: 'Approved' }, rejected: { color: '#EF4444', label: 'Rejected' } } as const;
  const badge = statusBadge[status as keyof typeof statusBadge] || statusBadge.pending;

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Verification Documents" />

      <View style={{ backgroundColor: badge.color + '20', borderColor: badge.color, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Text style={[typography.cardTitle, { color: badge.color, marginBottom: 4 }]}>{badge.label}</Text>
        {note ? <Text style={[typography.body, { color: colors.textSecondary }]}>{note}</Text> : null}
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
          {status === 'pending' && 'Your documents are being reviewed by the admin team.'}
          {status === 'approved' && 'Your profile has been verified. You can now receive consultation requests.'}
          {status === 'rejected' && 'Your verification was rejected. Please re-upload valid documents.'}
        </Text>
      </View>

      {docs.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[typography.sectionTitle, { marginBottom: 8 }]}>Uploaded Documents</Text>
          {docs.map((doc, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <Ionicons name="document-text-outline" size={20} color={colors.primaryLight} style={{ marginRight: 10 }} />
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                {doc.split('/').pop()?.substring(14) || `Document ${i + 1}`}
              </Text>
              <TouchableOpacity onPress={() => removeDoc(i)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <GlassCard style={{ alignItems: 'center', padding: 24 }}>
        <Ionicons name="cloud-upload-outline" size={48} color={colors.primaryLight} />
        <Text style={[typography.body, { textAlign: 'center', marginTop: 12, color: colors.textSecondary }]}>
          Upload ID proof, certificates, or degree documents for verification
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, marginBottom: 16 }]}>
          Supported: JPG, PNG, PDF
        </Text>
        <GradientButton
          title={uploading ? 'Uploading...' : 'Upload Document'}
          onPress={pickAndUpload}
          disabled={uploading}
        />
      </GlassCard>
    </ScreenWrapper>
  );
}

// Astrologer: Commission Logs
export function AstrologerCommissionScreen() {
  const { astrologer } = useAuth();
  const [logs, setLogs] = useState<CommissionLog[]>([]);
  const [commissionPct, setCommissionPct] = useState('0');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!astrologer?.userId) return;
    try {
      const [l, c] = await Promise.all([
        api.commissions.logs(astrologer.userId),
        api.commissions.findByAstrologer(astrologer.userId).catch(() => null),
      ]);
      setLogs(l || []);
      setCommissionPct(c?.value || '0');
    } catch {}
  }, [astrologer?.userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const totalEarned = logs.reduce((s, l) => s + Number(l.totalEarned), 0);
  const totalFees = logs.reduce((s, l) => s + Number(l.platformFee), 0);
  const totalRevenue = logs.reduce((s, l) => s + Number(l.amount), 0);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <GlassCard style={{ alignItems: 'center', padding: 20 }}>
          <Ionicons name="receipt-outline" size={40} color={colors.accentGold} />
          <Text style={[typography.sectionTitle, { marginTop: 8, color: colors.textPrimary }]}>Commission Breakdown</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Your commission rate: {commissionPct}%</Text>
        </GlassCard>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 14 }}>
            <Text style={[typography.cardTitle, { color: colors.success }]}>₹{totalEarned.toFixed(2)}</Text>
            <Text style={typography.caption}>Your Earnings</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 14 }}>
            <Text style={[typography.cardTitle, { color: colors.danger }]}>₹{totalFees.toFixed(2)}</Text>
            <Text style={typography.caption}>Platform Fees</Text>
          </GlassCard>
        </View>

        <GlassCard style={{ marginTop: 10, alignItems: 'center', padding: 14 }}>
          <Text style={[typography.cardTitle, { color: colors.accentGold }]}>₹{totalRevenue.toFixed(2)}</Text>
          <Text style={typography.caption}>Total Revenue Generated</Text>
        </GlassCard>

        <SectionHeader title="Commission Logs" />
        {logs.length === 0 ? (
          <EmptyState icon={<Ionicons name="receipt-outline" size={48} color={colors.textMuted} />} title="No logs yet" subtitle="Earnings from calls will appear here" />
        ) : (
          logs.map(l => (
            <GlassCard key={l.id} style={{ marginTop: 6, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.cardTitle, { fontSize: 14, color: colors.textPrimary }]}>Call Earnings</Text>
                  <Text style={typography.caption}>{new Date(l.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.cardTitle, { fontSize: 14, color: colors.success }]}>+₹{l.totalEarned}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>Fee: ₹{l.platformFee}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Total: ₹{l.amount}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Rate: {l.percentage}%</Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// Astrologer: Go Live
export function AstrologerGoLiveScreen({ navigation }: any) {
  const { astrologer } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && astrologer?.userId) {
      api.liveSessions.byAstrologer(astrologer.userId)
        .then(setSessions)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isFocused, astrologer?.userId]);

  const handleGoLive = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a session title'); return; }
    setCreating(true);
    try {
      const session = await api.liveSessions.create({ astrologerId: astrologer?.userId, title, status: 'live' });
      setSessions(prev => [session, ...prev]);
      setTitle('');
      Alert.alert('Live!', 'Your live session has started.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to start live session');
    } finally { setCreating(false); }
  };

  if (loading) return <ScreenWrapper scroll><SectionTitle title="Go Live" /><GlassCard><Text style={typography.body}>Loading...</Text></GlassCard></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <SectionTitle title="Go Live" />
      <GlassCard style={{ padding: 20, marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="radio" size={48} color={colors.danger} />
          <Text style={[typography.cardTitle, { marginTop: 12 }]}>Start a Live Session</Text>
          <Text style={[typography.body, { textAlign: 'center', marginTop: 8 }]}>Stream to your followers in real-time.</Text>
        </View>
        <TextInput
          style={{ backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15, marginBottom: 12 }}
          value={title} onChangeText={setTitle} placeholder="Session title" placeholderTextColor={colors.textMuted}
        />
        <GradientButton title={creating ? 'Starting...' : 'Go Live Now'} variant="gold" onPress={handleGoLive} disabled={creating} />
      </GlassCard>

      {sessions.length > 0 && (
        <>
          <Text style={[typography.sectionTitle, { marginBottom: 12 }]}>Your Live Sessions</Text>
          {sessions.map(s => (
            <GlassCard key={s.id} style={{ marginBottom: 8, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.cardTitle, { fontSize: 14 }]}>{s.title || 'Live Session'}</Text>
                  <Text style={typography.caption}>{new Date(s.createdAt).toLocaleDateString()} · {s.viewerCount || 0} viewers</Text>
                </View>
                <Text style={[typography.caption, { color: s.status === 'live' ? colors.success : colors.textMuted, fontWeight: '600' }]}>{s.status.toUpperCase()}</Text>
              </View>
            </GlassCard>
          ))}
        </>
      )}
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
          Astroshine respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, store, share, and protect your personal information when you use our website, mobile application, or online consultation services.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>2. Information We Collect</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          • Personal Identification: Name, email address, telephone number, and gender.{'\n'}
          • Astrological Profile Details: Date, time, and precise city/country of birth. This data is strictly used to compile your natal chart, horoscope calculations, and matching reports.{'\n'}
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
      <View style={{ height: 40 }} />
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
          By registering an account, purchasing wallet credits, or using any feature on Astroshine, you agree to be bound by these Terms & Conditions. If you do not accept these terms, you must immediately deactivate your account and exit our services.
        </Text>

        <Text style={[typography.cardTitle, { color: colors.accentGold, marginBottom: 8 }]}>2. Nature of Astrological Advice</Text>
        <Text style={[typography.body, { marginBottom: 12 }]}>
          Astroshine offers guidance tools based on traditional Vedic astrology, Numerology, and Tarot cards. Predictions, advice, and charts are provided for entertainment and self-reflection purposes only. They do not constitute certified medical, psychiatric, legal, or financial advice.
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
          Astroshine is not liable for any direct, indirect, incidental, or consequential damages resulting from user actions taken based on advice or readings provided by astrologers on the platform.
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
        <Text style={[typography.sectionTitle, { marginBottom: 4 }]}>Astroshine</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 16 }]}>Version 1.0.0 (Release Build)</Text>
        
        <Text style={[typography.body, { textAlign: 'center', paddingHorizontal: 16, lineHeight: 22, marginBottom: 16 }]}>
          Astroshine is the world's premier platform for spiritual guidance, connecting you directly with Vedic astrologers, Tarot card readers, Numerologists, and Vastu experts.
        </Text>

        <Text style={[typography.body, { textAlign: 'center', paddingHorizontal: 16, lineHeight: 22 }]}>
          Our mission is to combine ancient cosmic wisdom with modern mobile technology. Whether you seek answers about career, love, finance, or health, our verified advisors are here to guide you 24/7.
        </Text>

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 24 }]}>
          © 2026 Astroshine Inc. All rights reserved.
        </Text>
      </GlassCard>
      <GradientButton title="Back to Dashboard" onPress={() => navigation.navigate('Main')} style={{ marginTop: 12 }} />
    </ScreenWrapper>
  );
}

// Create Blog
export function CreateBlogScreen({ navigation, route }: any) {
  const { role } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      await api.blogs.create({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        slug,
        status: 'published',
      });
      navigation.goBack();
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}>
        <Text style={[typography.pageTitle, { marginBottom: 16 }]}>Create Blog</Text>
        <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Title</Text>
        <TextInput
          style={[styles.input, { marginBottom: 12 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Blog title"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Excerpt (optional)</Text>
        <TextInput
          style={[styles.input, { marginBottom: 12 }]}
          value={excerpt}
          onChangeText={setExcerpt}
          placeholder="Short summary"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Content</Text>
        <TextInput
          style={[styles.input, { marginBottom: 12, height: 200, textAlignVertical: 'top', paddingTop: 12 }]}
          value={content}
          onChangeText={setContent}
          placeholder="Write your blog content..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Text style={[typography.label, { marginBottom: 6, color: colors.textSecondary }]}>Tags (comma separated, optional)</Text>
        <TextInput
          style={[styles.input, { marginBottom: 20 }]}
          value={tags}
          onChangeText={setTags}
          placeholder="e.g. astrology, vedic, gemstones"
          placeholderTextColor={colors.textMuted}
        />
        <GradientButton
          title={loading ? 'Publishing...' : 'Publish Blog'}
          onPress={handleCreate}
          disabled={loading || !title.trim() || !content.trim()}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
});

export { SupportScreen, TicketDetailScreen, AdminSupportScreen, AdminTicketDetailScreen } from './SupportScreens';
export { MandirPoojaDetailScreen } from './MandirPoojaDetailScreen';
export { BlogDetailScreen } from './BlogDetailScreen';
