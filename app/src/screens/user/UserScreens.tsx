import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import { useChat } from "../../context/ChatContext";
import {
  Avatar,
  Chip,
  ConfirmDialog,
  InsufficientBalanceDialog,
  CustomModal,
  EmptyState,
  GlassCard,
  GradientButton,
  ScreenWrapper,
  SearchBar,
  SectionHeader,
  SkeletonLoader,
  StarRating,
  Toggle,
  DatePicker,
  TimePicker,
  colors,
  radii,
  typography,
  OmIcon,
  Navbar,
  resolveMediaUrl,
} from "../../shared";
import { api } from "../../shared/api-client";
import { config } from "../../config";
import type {
  Astrologer,
  Blog,
  CallLog,
  HoroscopeRecord,
  MandirPooja,
  Notification,
  PanchangRecord,
  ShopProduct,
  Transaction,
  Video,
  Wallet,
} from "../../shared/types";
import * as Location from "expo-location";

const ZODIAC_SIGNS = [
  { sign: "aries", emoji: "♈", label: "Aries", range: "Mar 21 – Apr 19" },
  { sign: "taurus", emoji: "♉", label: "Taurus", range: "Apr 20 – May 20" },
  { sign: "gemini", emoji: "♊", label: "Gemini", range: "May 21 – Jun 20" },
  { sign: "cancer", emoji: "♋", label: "Cancer", range: "Jun 21 – Jul 22" },
  { sign: "leo", emoji: "♌", label: "Leo", range: "Jul 23 – Aug 22" },
  { sign: "virgo", emoji: "♍", label: "Virgo", range: "Aug 23 – Sep 22" },
  { sign: "libra", emoji: "♎", label: "Libra", range: "Sep 23 – Oct 22" },
  { sign: "scorpio", emoji: "♏", label: "Scorpio", range: "Oct 23 – Nov 21" },
  { sign: "sagittarius", emoji: "♐", label: "Sagittarius", range: "Nov 22 – Dec 21" },
  { sign: "capricorn", emoji: "♑", label: "Capricorn", range: "Dec 22 – Jan 19" },
  { sign: "aquarius", emoji: "♒", label: "Aquarius", range: "Jan 20 – Feb 18" },
  { sign: "pisces", emoji: "♓", label: "Pisces", range: "Feb 19 – Mar 20" },
];

const zodiacImages: { [key: string]: any } = {
  aries: require("../../../assets/aries_ram.png"),
  taurus: require("../../../assets/taurus_bull.png"),
  gemini: require("../../../assets/gemini_twins.png"),
  cancer: require("../../../assets/cancer_crab.png"),
  leo: require("../../../assets/leo_lion.png"),
  virgo: require("../../../assets/virgo_maiden.png"),
  libra: require("../../../assets/libra_scales.png"),
  scorpio: require("../../../assets/scorpio_scorpion.png"),
  sagittarius: require("../../../assets/sagittarius_archer.png"),
  capricorn: require("../../../assets/capricorn_goat.png"),
  aquarius: require("../../../assets/aquarius_bearer.png"),
  pisces: require("../../../assets/pisces_fish.png"),
};

const ASTRO_CATEGORIES = [
  "All",
  "Vedic",
  "Palmistry",
  "Vastu",
];

function to12h(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function getAstrologerOnlineStatus(
  astro: Astrologer,
  astrologerStatuses: Record<string, "online" | "offline" | "busy">,
  onlineUsers?: Record<string, boolean>,
) {
  const wsStatus = astrologerStatuses[astro.userId];
  if (wsStatus) return wsStatus === "online";
  if (onlineUsers && onlineUsers[astro.userId]) return true;
  return astro.onlineStatus === "online";
}

// User Home Dashboard
export function UserHomeScreen({ navigation }: any) {
  const { user, theme, setTheme } = useAuth();
  const { conversations, openConversation, astrologerStatuses, onlineUsers, horoscopeVersion, blogVersion, notificationVersion, walletVersion, panchangVersion } = useChat();
  const { initiateCall } = useCall();
  const isFocused = useIsFocused();
  const isDark = theme === "dark";

  const titleColor = isDark ? "#FBBF24" : "#7F1D1D";
  const iconColor = isDark ? "#F59E0B" : "#7F1D1D";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const cardLightBg = isDark ? "#1F2937" : "#FFFBEB";
  const cardBorderColor = isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A";
  const textPrimaryColor = isDark ? "#F9FAFB" : "#1F2937";
  const bodyTextColor = isDark ? "#E5E7EB" : "#374151";
  const mutedTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const goldTextColor = isDark ? "#FBBF24" : "#D97706";
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [favoriteAstrologers, setFavoriteAstrologers] = useState<Astrologer[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [balanceDialogVisible, setBalanceDialogVisible] = useState(false);
  const [horoscope, setHoroscope] = useState<HoroscopeRecord[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [poojas, setPoojas] = useState<MandirPooja[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedSign, setSelectedSign] = useState("aries");
  const selectedSignRef = useRef("aries");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHoroscopeTab, setActiveHoroscopeTab] = useState<
    "love" | "career" | "finance" | "health"
  >("career");
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [weather, setWeather] = useState<{
    temp: string;
    condition: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [location, setLocation] = useState<{
    city: string;
    region: string;
  } | null>(null);
  const [panchangData, setPanchangData] = useState<PanchangRecord | null>(null);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12)
      return { text: "Good Morning!", icon: "sunny-outline" as const };
    if (hour < 17)
      return { text: "Good Afternoon!", icon: "partly-sunny" as const };
    if (hour < 21)
      return { text: "Good Evening!", icon: "moon-outline" as const };
    return { text: "Good Night!", icon: "moon" as const };
  })();

  const formatDate = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    fetchHoroscope(selectedSign);
    try {
      const [a, v, b, p, n, w, favs, calls] = await Promise.all([
        api.astrologers.list(),
        api.videos.list(),
        api.blogs.list({ published: 'true' }),
        api.mandirPooja.list(),
        api.notifications.list({ userId: user?.id }),
        api.wallet.get().catch(() => null),
        api.favorites.list().catch(() => []),
        user?.id ? api.calls.list({ userId: user.id }).catch(() => []) : Promise.resolve([]),
      ]);
      setAstrologers(a);
      setVideos(v);
      setBlogs(b);
      setPoojas(p);
      setNotifications(n);
      setWallet(w);
      setFavoriteAstrologers(favs);
      setCallLogs(calls);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedSign, todayStr, horoscopeVersion, blogVersion, notificationVersion, walletVersion]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  useEffect(() => {
    if (blogVersion > 0) loadData();
  }, [blogVersion]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setWeatherLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const { latitude, longitude } = loc.coords;
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo && geo[0]) {
          const city = geo[0].city || geo[0].district || geo[0].subregion || "";
          const region = geo[0].region || geo[0].country || "";
          setLocation({ city, region });
        }
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}`);
        const data = await res.json();
        if (data.main) setWeather({ temp: `${Math.round(data.main.temp)}°C`, condition: data.weather[0].main });
      } catch {} finally { setWeatherLoading(false); }
    })();
  }, []);

  useEffect(() => {
    api.panchang
      .byDate(todayStr)
      .then(setPanchangData)
      .catch(() => {});
  }, [todayStr, panchangVersion]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const fetchHoroscope = async (sign: string) => {
    setHoroscopeLoading(true);
    try {
      const h = await api.horoscope.bySign(sign, todayStr);
      if (selectedSignRef.current !== sign) return;
      setHoroscope(Array.isArray(h) ? h : [h]);
    } catch (e: any) {
      console.warn("Horoscope fetch failed:", e?.message || e);
    } finally {
      if (selectedSignRef.current === sign) setHoroscopeLoading(false);
    }
  };

  const handleSignSelect = (sign: string) => {
    selectedSignRef.current = sign;
    setSelectedSign(sign);
    if (sign !== selectedSign) fetchHoroscope(sign);
  };

  const activeHoroscope =
    horoscope[0]?.zodiacSign?.toLowerCase() === selectedSign
      ? horoscope[0]
      : undefined;

  const filteredCategoryAstro =
    selectedCategory === "All"
      ? astrologers
      : astrologers.filter((a) =>
          a.specialization?.some(
            (s) => s.toLowerCase() === selectedCategory.toLowerCase(),
          ),
        );

  const chattedAstroIds = useMemo(() => {
    return (conversations || [])
      .filter((c) => c.participantRole === "astrologer")
      .map((c) => c.participantId);
  }, [conversations]);

  const chatAstrologers = useMemo(() => {
    const chatted = astrologers.filter((a) => chattedAstroIds.includes(a.userId));
    return chatted.length > 0 ? chatted : astrologers;
  }, [astrologers, chattedAstroIds]);

  const audioCallAstroIds = useMemo(() => {
    const ids = (callLogs || [])
      .filter((c) => c.type === "audio")
      .map((c) => c.astrologerId);
    return ids.filter((val, index) => ids.indexOf(val) === index);
  }, [callLogs]);

  const audioCallAstrologers = useMemo(() => {
    const talked = astrologers.filter((a) => audioCallAstroIds.includes(a.userId));
    return talked.length > 0 ? talked : astrologers;
  }, [astrologers, audioCallAstroIds]);

  const videoCallAstroIds = useMemo(() => {
    const ids = (callLogs || [])
      .filter((c) => c.type === "video")
      .map((c) => c.astrologerId);
    return ids.filter((val, index) => ids.indexOf(val) === index);
  }, [callLogs]);

  const videoCallAstrologers = useMemo(() => {
    const talked = astrologers.filter((a) => videoCallAstroIds.includes(a.userId));
    return talked.length > 0 ? talked : astrologers;
  }, [astrologers, videoCallAstroIds]);

  const handleAstroAction = async (item: Astrologer, type: "chat" | "audio" | "video") => {
    const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers);
    const isVerified = item.verificationStatus === "approved";

    if (!isVerified) {
      Alert.alert("Not Verified", "This astrologer is not yet verified.");
      return;
    }

    if (type === "chat") {
      try {
        const convId = await openConversation(item.userId, "astrologer");
        navigation.navigate("ChatRoom", {
          conversationId: convId,
          participantId: item.userId,
          participantRole: "astrologer",
          participantName: item.name,
          participantAvatar: item.avatar,
        });
      } catch (err: any) {
        Alert.alert("Error", err?.message || "Failed to start chat");
      }
    } else {
      // Audio or Video Call
      if (!isOnline) {
        Alert.alert("Offline", `${item.name || "Astrologer"} is currently offline.`);
        return;
      }
      
      let rate = "0";
      if (type === "audio") rate = item.audioCallPricePerMin || item.pricePerMin || "10";
      else if (type === "video") rate = item.videoCallPricePerMin || item.pricePerMin || "20";
      
      const rateNum = parseFloat(rate);
      const balance = wallet?.balance ? parseFloat(wallet.balance) : 0;
      if (balance < rateNum) {
        setBalanceDialogVisible(true);
        return;
      }
      
      initiateCall(
        item.userId,
        item.name || "",
        type,
      );
    }
  };

  const handleToggleFavorite = async (astrologerId: string) => {
    try {
      const res = await api.favorites.toggle(astrologerId);
      if (res.isFavorite) {
        const astro = astrologers.find((a) => a.userId === astrologerId);
        if (astro) {
          setFavoriteAstrologers((prev) => [
            ...prev.filter((a) => a.userId !== astrologerId),
            astro,
          ]);
        }
      } else {
        setFavoriteAstrologers((prev) =>
          prev.filter((a) => a.userId !== astrologerId)
        );
      }
    } catch {
      // optimistic toggle fallback
      setFavoriteAstrologers((prev) => {
        const exists = prev.some((a) => a.userId === astrologerId);
        if (exists) return prev.filter((a) => a.userId !== astrologerId);
        const astro = astrologers.find((a) => a.userId === astrologerId);
        return astro ? [...prev, astro] : prev;
      });
    }
  };

  const renderAstroRowCard = (item: Astrologer, type: "chat" | "audio" | "video") => {
    const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers);
    const isVerified = item.verificationStatus === "approved";
    const isFav = favoriteAstrologers.some((f) => f.userId === item.userId);
    
    let rate = "0";
    if (type === "chat") rate = item.chatPricePerMin || item.pricePerMin || "25.00";
    else if (type === "audio") rate = item.audioCallPricePerMin || item.pricePerMin || "18.00";
    else if (type === "video") rate = item.videoCallPricePerMin || item.pricePerMin || "50.00";
    
    const rateNum = parseFloat(rate);
    const priceVal = isNaN(rateNum) ? "25.00" : rateNum.toFixed(2);
    
    const absoluteAvatar = item.avatar
      ? (item.avatar.startsWith("http") || item.avatar.startsWith("data:") ? item.avatar : `${config.apiUrl}${item.avatar}`)
      : null;

    const rawSkills = (item.skills && item.skills.length > 0 ? item.skills : item.specialization) || [
      type === "chat" ? "Nadi" : type === "audio" ? "Tarot" : "Nadi",
      type === "chat" ? "Past Life" : type === "audio" ? "Numerology" : "Past Life",
      type === "chat" ? "Life Guidance" : type === "audio" ? "Relationship Guidance" : "Life Guidance",
    ];

    const formattedSkills = rawSkills.map((s: string) => {
      if (s === "Psychological Astrology") return "Astro-Psych";
      if (s === "Past Life Regression") return "Past Life";
      if (s === "Relationship Guidance" || s === "Relationship Advice") return "Relationship";
      if (s === "Marriage Guidance") return "Marriage";
      if (s === "Career Guidance") return "Career";
      if (s === "Personal Growth") return "Growth";
      if (s === "Nadi Astrology" || s === "Nadi Reading") return "Nadi";
      if (s === "Love Predictions" || s === "Love Astrology") return "Love";
      if (s === "Birth Chart Analysis") return "Birth Chart";
      if (s === "Tarot Reading") return "Tarot";
      if (s === "Palm Reading") return "Palmistry";
      if (s === "Vastu Correction") return "Vastu";
      if (s === "Gemstone Advice") return "Gemstones";
      if (s === "Business Astrology") return "Business";
      if (s === "Muhurat Fixing") return "Muhurat";
      if (s === "Energy Healing") return "Healing";
      if (s === "Karma Analysis") return "Karma";
      if (s === "Horary Predictions") return "Horary";
      if (s === "Stock Market Astrology") return "Stock Market";
      if (s === "Crystal Therapy") return "Crystals";
      if (s === "Chakra Balancing") return "Chakra";
      if (s === "Intuitive Reading") return "Intuitive";
      return s;
    });

    const displaySkills: string[] = [];
    let totalLen = 0;
    for (const sk of formattedSkills) {
      if (displaySkills.length >= 3) break;
      if (displaySkills.length >= 2 && totalLen + sk.length > 20) break;
      displaySkills.push(sk);
      totalLen += sk.length;
    }

    return (
      <View
        style={[
          styles.astroRowCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorderColor,
          },
        ]}
      >
        {/* Top Info Row: Avatar on Left, Details on Right */}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {/* Avatar with Gold Ring & Online Pill */}
          <TouchableOpacity
            onPress={() => navigation.navigate("AstrologerDetail", { id: item.userId })}
            style={styles.astroCardAvatarWrap}
            activeOpacity={0.8}
          >
            <View style={styles.astroAvatarGoldRing}>
              {absoluteAvatar ? (
                <Image source={{ uri: absoluteAvatar }} style={styles.astroAvatarImg} />
              ) : (
                <View
                  style={[
                    styles.astroAvatarImg,
                    {
                      backgroundColor: isDark ? "#374151" : "#FFF8E7",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: isDark ? "#FBBF24" : "#7F1D1D",
                    }}
                  >
                    {item.name ? item.name.charAt(0).toUpperCase() : "A"}
                  </Text>
                </View>
              )}
            </View>

            {/* Online Status Badge */}
            <View
              style={[
                styles.onlinePill,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  borderColor: isOnline ? "#BBF7D0" : (isDark ? "#374151" : "#E5E7EB"),
                },
              ]}
            >
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isOnline ? "#22C55E" : "#9CA3AF" },
                ]}
              />
              <Text
                style={[
                  styles.onlineText,
                  { color: isOnline ? "#16A34A" : (isDark ? "#9CA3AF" : "#6B7280") },
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Details Column */}
          <View style={{ flex: 1, paddingLeft: 12 }}>
            {/* Name + Verified + Heart */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate("AstrologerDetail", { id: item.userId })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  flex: 1,
                  minWidth: 0,
                  paddingRight: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: isDark ? "#F9FAFB" : "#111827",
                  }}
                  numberOfLines={1}
                >
                  {item.name || "Astrologer"}
                </Text>
                {isVerified && (
                  <Ionicons name="checkmark-circle" size={15} color="#3B82F6" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleToggleFavorite(item.userId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={19}
                  color={isFav ? "#DC2626" : (isDark ? "#9CA3AF" : "#DC2626")}
                />
              </TouchableOpacity>
            </View>

            {/* Subtitle / Specialization */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {item.specialization?.length
                ? item.specialization.join(", ")
                : "Nadi Astrology, Past Life"}
            </Text>

            {/* Rating Stars + Review Count */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const ratingVal = parseFloat(String(item.rating || "4.5"));
                  return (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(ratingVal) ? "star" : "star-outline"}
                      size={12}
                      color="#F59E0B"
                    />
                  );
                })}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: isDark ? "#F3F4F6" : "#1F2937",
                }}
              >
                {item.rating ? parseFloat(String(item.rating)).toFixed(1) : "4.5"}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? "#9CA3AF" : "#6B7280" }}>
                ({item.totalReviews
                  ? (item.totalReviews >= 1000
                    ? `${(item.totalReviews / 1000).toFixed(1)}K`
                    : item.totalReviews)
                  : type === "chat" ? "2.3K" : type === "audio" ? "1.8K" : "2.3K"})
              </Text>
            </View>

            {/* Experience & Languages */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Ionicons
                  name="briefcase-outline"
                  size={11}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: isDark ? "#E5E7EB" : "#4B5563",
                    fontWeight: "500",
                  }}
                >
                  {item.experience || 8}+ Years Exp
                </Text>
              </View>

              <Text style={{ color: isDark ? "#4B5563" : "#D1D5DB", fontSize: 10 }}>|</Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={11}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: isDark ? "#E5E7EB" : "#4B5563",
                    fontWeight: "500",
                  }}
                  numberOfLines={1}
                >
                  {item.languages?.length
                    ? item.languages.slice(0, 2).join(" · ")
                    : "Hindi · English"}
                </Text>
              </View>
            </View>

            {/* Skill Chips / Tags */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 6,
                flexWrap: "nowrap",
                overflow: "hidden",
                maxWidth: "100%",
              }}
            >
              {displaySkills.map((skill, sIdx) => (
                <View
                  key={sIdx}
                  style={{
                    backgroundColor: isDark ? "rgba(217, 119, 6, 0.15)" : "#FFF7ED",
                    borderColor: isDark ? "rgba(217, 119, 6, 0.3)" : "#FED7AA",
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2.5,
                    flexShrink: 1,
                  }}
                >
                  {sIdx === 0 && (
                    <Ionicons
                      name="flower-outline"
                      size={9}
                      color={isDark ? "#FBBF24" : "#D97706"}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 8.5,
                      fontWeight: "600",
                      color: isDark ? "#FDE68A" : "#7C2D12",
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Row: Price, Best Offer Badge, Action Button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "#FDE68A",
          }}
        >
          {/* Rate */}
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: isDark ? "#F59E0B" : "#7F1D1D",
              }}
            >
              ₹{priceVal}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: isDark ? "#FBBF24" : "#7F1D1D",
              }}
            >
              /min
            </Text>
          </View>

          {/* Best Offer Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: isDark ? "#372015" : "#451A03",
              borderRadius: 12,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 9 }}>👑</Text>
            <Text
              style={{
                color: "#FDE68A",
                fontSize: 10,
                fontWeight: "800",
              }}
            >
              Best Offer
            </Text>
          </View>

          {/* Vertical Divider */}
          <View
            style={{
              width: 1,
              height: 18,
              backgroundColor: isDark ? "#374151" : "#E5E7EB",
              marginHorizontal: 1,
            }}
          />

          {/* Action Button */}
          <TouchableOpacity
            onPress={() => handleAstroAction(item, type)}
            style={{
              backgroundColor: "#EA580C",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              shadowColor: "#EA580C",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name={
                type === "chat"
                  ? "chatbubble-ellipses"
                  : type === "audio"
                  ? "call"
                  : "videocam"
              }
              size={13}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "800",
              }}
            >
              {type === "chat"
                ? "Chat Now ›"
                : type === "audio"
                ? "Call Now ›"
                : "Video Call ›"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <ScreenWrapper scroll>
        <SkeletonLoader height={80} />
        <View style={{ height: 16 }} />
        <SkeletonLoader height={48} />
        <View style={{ height: 16 }} />
        <SkeletonLoader height={180} />
        <View style={{ height: 24 }} />
        <SkeletonLoader height={120} />
        <SkeletonLoader height={160} />
        <View style={{ height: 24 }} />
        <SkeletonLoader height={120} />
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper style={{ position: "relative", zIndex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={{ padding: 4, width: 40 }}
          >
            <Ionicons name="menu-outline" size={28} color={iconColor} />
          </TouchableOpacity>

          <View style={{ alignItems: "center", flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <OmIcon isDark={isDark} />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: isDark ? "#FBBF24" : "#8B1E1E",
                  letterSpacing: 0.5,
                }}
              >
                ASTROSHINE
              </Text>
            </View>
            <Text
              style={{
                fontSize: 8,
                fontWeight: "800",
                color: isDark ? "#FBBF24" : "#D97706",
                letterSpacing: 1,
                marginTop: 1,
                textAlign: "center",
              }}
            >
              YOUR DESTINY, OUR GUIDANCE
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <TouchableOpacity
              onPress={() => setTheme(isDark ? "light" : "dark")}
              style={{ padding: 4 }}
            >
              <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={22}
                color={iconColor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Astrologers")}
              style={{ padding: 4 }}
            >
              <Ionicons name="search-outline" size={22} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
              style={{ padding: 4, position: "relative" }}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={iconColor}
              />
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting & Ganesha Banner */}
        <View
          style={[
            styles.greetingRow,
            {
              backgroundColor: isDark ? cardBg : "#FFF8ED",
              borderColor: isDark ? cardBorderColor : "#FDE68A",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 10,
              minHeight: 128,
              shadowColor: "#D97706",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0 : 0.08,
              shadowRadius: 8,
              elevation: 2,
              overflow: "hidden",
              position: "relative",
              flexDirection: "row",
              justifyContent: "space-between",
            },
          ]}
        >
          {/* Left Column: Greeting, Name, Wallet, Date, Location */}
          <View
            style={{
              flex: 1,
              maxWidth: "58%",
              justifyContent: "space-between",
              zIndex: 5,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#F59E0B" : "#8B1E1E",
                  fontWeight: "600",
                }}
              >
                Namaste, 👋
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: isDark ? "#F9FAFB" : "#7F1D1D",
                  marginTop: 1,
                  marginBottom: 6,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {user?.name || "Khushboo Sharma"}
              </Text>
            </View>

            {/* Wallet Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                marginBottom: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons
                  name="wallet"
                  size={15}
                  color="#DC2626"
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#DC2626",
                    fontWeight: "800",
                  }}
                >
                  ₹{wallet?.balance || "1131.00"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("Wallet")}
                style={{
                  backgroundColor: "#EA580C",
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 3.5,
                  shadowColor: "#EA580C",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 10.5,
                    fontWeight: "700",
                  }}
                >
                  + Add Money
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 4,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color="#EA580C"
              />
              <Text
                style={{
                  fontSize: 10.5,
                  color: isDark ? "#D1D5DB" : "#4B5563",
                  fontWeight: "500",
                }}
              >
                {formatDate(new Date())}
              </Text>
            </View>

            {/* Location Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons
                name="location-sharp"
                size={12}
                color="#EA580C"
              />
              <Text
                style={{
                  fontSize: 10.5,
                  color: isDark ? "#D1D5DB" : "#4B5563",
                  fontWeight: "500",
                }}
              >
                {location
                  ? `${location.city}, ${location.region}`
                  : "Jaipur, Rajasthan"}
              </Text>
            </View>
          </View>

          {/* Right Section: Weather at Top Right & Lord Ganesha filling Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "48%",
              zIndex: 1,
            }}
            pointerEvents="box-none"
          >
            {/* Weather Top Right */}
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                zIndex: 10,
              }}
            >
              <Ionicons name="sunny" size={22} color="#F59E0B" />
              <View>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: "800",
                    color: isDark ? "#F9FAFB" : "#7F1D1D",
                    lineHeight: 14,
                  }}
                >
                  {weather?.temp || (weatherLoading ? "--" : "28°C")}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontWeight: "500",
                    lineHeight: 11,
                  }}
                >
                  {weather?.condition || (weatherLoading ? "--" : "Sunny")}
                </Text>
              </View>
            </View>

            {/* Lord Ganesha Image Filling Right Side to Edge */}
            <Image
              source={require("../../../assets/ganesha_header.png")}
              style={{
                position: "absolute",
                right: -4,
                bottom: -6,
                width: 155,
                height: 125,
              }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Zodiac Signs Horizontal Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {ZODIAC_SIGNS.map((z) => {
            const active = selectedSign === z.sign;
            return (
              <TouchableOpacity
                key={z.sign}
                onPress={() => handleSignSelect(z.sign)}
                style={{ alignItems: "center", width: 62 }}
              >
                <View
                  style={[
                    styles.zodiacCircle,
                    active
                      ? {
                          backgroundColor: "#8B1E1E",
                          borderColor: "#F59E0B",
                          borderWidth: 2,
                          borderRadius: 28,
                          width: 54,
                          height: 54,
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }
                      : {
                          backgroundColor: isDark ? cardLightBg : "#FFFDF7",
                          borderColor: cardBorderColor,
                          borderWidth: 1.5,
                          borderRadius: 28,
                          width: 54,
                          height: 54,
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        },
                  ]}
                >
                  <Image
                    source={zodiacImages[z.sign]}
                    style={{ width: 38, height: 38, borderRadius: 19 }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? "800" : "600",
                    color: active ? (isDark ? "#FBBF24" : "#8B1E1E") : bodyTextColor,
                    marginTop: 4,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {z.label}
                </Text>
                {active && (
                  <View
                    style={{
                      width: 22,
                      height: 2.5,
                      backgroundColor: "#DC2626",
                      borderRadius: 2,
                      marginTop: 2,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Zodiac Horoscope Detailed Card */}
        <View
          style={[
            styles.horoscopeCard,
            {
              backgroundColor: isDark ? cardBg : "#FFF8ED",
              borderColor: isDark ? cardBorderColor : "#FDE68A",
              borderRadius: 22,
              padding: 16,
              overflow: "hidden",
              shadowColor: "#D97706",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.06,
              shadowRadius: 10,
              elevation: 2,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            {/* Radiant Gold Ring Avatar */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                borderWidth: 2,
                borderColor: "#F59E0B",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#8B1E1E",
              }}
            >
              <Image
                source={zodiacImages[selectedSign]}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            </View>

            <View style={{ flex: 1, minWidth: 140 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: isDark ? "#FBBF24" : "#8B1E1E",
                }}
              >
                Your Daily Horoscope
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "800", color: isDark ? "#F9FAFB" : "#7F1D1D" }}
                >
                  {ZODIAC_SIGNS.find((z) => z.sign === selectedSign)?.label || "Aries"}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: "600",
                    color: isDark ? "#F59E0B" : "#EA580C",
                  }}
                >
                  ({ZODIAC_SIGNS.find((z) => z.sign === selectedSign)?.range || "Mar 21 – Apr 19"})
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: bodyTextColor,
                  lineHeight: 16,
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {activeHoroscope?.[
                  activeHoroscopeTab === "love" ? "lovePrediction" :
                  activeHoroscopeTab === "career" ? "careerPrediction" :
                  activeHoroscopeTab === "finance" ? "financePrediction" :
                  activeHoroscopeTab === "health" ? "healthPrediction" :
                  "prediction"
                ] || activeHoroscope?.prediction ||
                  (horoscopeLoading
                    ? "Loading..."
                    : "Horoscope is temporarily unavailable. Please try again.")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("Horoscope")}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#DC2626",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 4,
              }}
            >
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Sub-tabs Row (Directly below preview, NO lucky stats) */}
          <View
            style={[
              styles.subTabsRow,
              {
                borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "#FDE68A",
                justifyContent: "space-between",
                paddingHorizontal: 0,
                paddingTop: 12,
                marginTop: 12,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("love")}
              style={[
                styles.subTabItem,
                {
                  backgroundColor: isDark
                    ? activeHoroscopeTab === "love" ? "rgba(225, 29, 72, 0.25)" : "rgba(225, 29, 72, 0.12)"
                    : "#FFF1F2",
                  borderColor: isDark
                    ? activeHoroscopeTab === "love" ? "#E11D48" : "rgba(225, 29, 72, 0.3)"
                    : activeHoroscopeTab === "love" ? "#E11D48" : "#FECDD3",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                },
              ]}
            >
              <Ionicons
                name="heart"
                size={14}
                color={isDark ? "#FDA4AF" : "#E11D48"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "love" ? "800" : "600",
                  color: isDark ? "#FDA4AF" : "#BE123C",
                }}
              >
                Love
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("career")}
              style={[
                styles.subTabItem,
                {
                  backgroundColor: isDark
                    ? activeHoroscopeTab === "career" ? "rgba(220, 38, 38, 0.25)" : "rgba(220, 38, 38, 0.12)"
                    : "#FEF2F2",
                  borderColor: isDark
                    ? activeHoroscopeTab === "career" ? "#DC2626" : "rgba(220, 38, 38, 0.3)"
                    : activeHoroscopeTab === "career" ? "#DC2626" : "#FECACA",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                },
              ]}
            >
              <Ionicons
                name="briefcase"
                size={14}
                color={isDark ? "#F87171" : "#DC2626"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "career" ? "800" : "600",
                  color: isDark ? "#F87171" : "#991B1B",
                }}
              >
                Career
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("finance")}
              style={[
                styles.subTabItem,
                {
                  backgroundColor: isDark
                    ? activeHoroscopeTab === "finance" ? "rgba(217, 119, 6, 0.25)" : "rgba(217, 119, 6, 0.12)"
                    : "#FEF9C3",
                  borderColor: isDark
                    ? activeHoroscopeTab === "finance" ? "#D97706" : "rgba(217, 119, 6, 0.3)"
                    : activeHoroscopeTab === "finance" ? "#D97706" : "#FDE047",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                },
              ]}
            >
              <Ionicons
                name="wallet"
                size={14}
                color={isDark ? "#FBBF24" : "#D97706"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "finance" ? "800" : "600",
                  color: isDark ? "#FBBF24" : "#854D0E",
                }}
              >
                Finance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("health")}
              style={[
                styles.subTabItem,
                {
                  backgroundColor: isDark
                    ? activeHoroscopeTab === "health" ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.12)"
                    : "#ECFDF5",
                  borderColor: isDark
                    ? activeHoroscopeTab === "health" ? "#10B981" : "rgba(16, 185, 129, 0.3)"
                    : activeHoroscopeTab === "health" ? "#10B981" : "#A7F3D0",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                },
              ]}
            >
              <Ionicons
                name="leaf"
                size={14}
                color={isDark ? "#34D399" : "#059669"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "health" ? "800" : "600",
                  color: isDark ? "#34D399" : "#065F46",
                }}
              >
                Health
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Panchang */}
        <View
          style={[
            styles.panchangContainer,
            {
              backgroundColor: cardBg,
              borderColor: cardBorderColor,
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#D97706",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0 : 0.05,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <View
            style={[
              styles.panchangHeaderBanner,
              {
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFF8E7",
                borderBottomWidth: 1,
                borderBottomColor: cardBorderColor,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="calendar-sharp" size={16} color={isDark ? "#F59E0B" : "#EA580C"} />
              <Text style={{ fontSize: 14, fontWeight: "800", color: isDark ? "#FBBF24" : "#7F1D1D" }}>
                Today's Panchang
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Panchang")}>
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#FBBF24" : "#EA580C" }}
              >
                View All ›
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.panchangContent, { backgroundColor: cardBg }]}
          >
            {/* Top 4 Panchang factors */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <View style={styles.panchangItem}>
                <Ionicons
                  name="sunny-outline"
                  size={16}
                  color={isDark ? "#F59E0B" : "#D97706"}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Tithi
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                    numberOfLines={1}
                  >
                    {panchangData?.tithi || "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.panchangItem}>
                <Ionicons name="star-outline" size={16} color={isDark ? "#F59E0B" : "#D97706"} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Nakshatra
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                    numberOfLines={1}
                  >
                    {panchangData?.nakshatra || "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.panchangItem}>
                <Ionicons
                  name="ribbon-outline"
                  size={16}
                  color={isDark ? "#F59E0B" : "#D97706"}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Yoga
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                    numberOfLines={1}
                  >
                    {panchangData?.yoga || "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.panchangItem}>
                <Ionicons
                  name="compass-outline"
                  size={16}
                  color={isDark ? "#F59E0B" : "#D97706"}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Karan
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                    numberOfLines={1}
                  >
                    {panchangData?.karana || "--"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom 3 Panchang factors */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "#FDE68A",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="sunny" size={14} color="#F59E0B" />
                <View>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Sunrise
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                  >
                    {panchangData?.sunrise ? to12h(panchangData.sunrise) : "--"}
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="partly-sunny" size={14} color="#EA580C" />
                <View>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Sunset
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                  >
                    {panchangData?.sunset ? to12h(panchangData.sunset) : "--"}
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="time-outline" size={14} color="#DC2626" />
                <View>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Rahukal
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#F9FAFB" : "#7F1D1D",
                    }}
                  >
                    {panchangData?.rahuKaal
                      ? `${to12h(panchangData.rahuKaal.start)} - ${to12h(panchangData.rahuKaal.end)}`
                      : "--"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={{ marginHorizontal: 16, marginVertical: 14 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: titleColor,
              }}
            >
              Quick Actions
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Kundli")}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isDark ? "#FBBF24" : "#DC2626",
                }}
              >
                See All ›
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate("Kundli")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF9C3",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FEF08A",
                },
              ]}
            >
              <Ionicons name="grid-outline" size={24} color={isDark ? "#FBBF24" : "#D97706"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#FDE68A" : "#78350F" },
                ]}
                numberOfLines={1}
              >
                Kundli
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Matchmaking")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(225, 29, 72, 0.15)" : "#FCE7F3",
                  borderColor: isDark ? "rgba(225, 29, 72, 0.3)" : "#FBCFE8",
                },
              ]}
            >
              <Ionicons name="heart" size={24} color={isDark ? "#FDA4AF" : "#E11D48"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#FDA4AF" : "#881337" },
                ]}
                numberOfLines={1}
              >
                Matchmaking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Panchang")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(234, 88, 12, 0.15)" : "#FFEDD5",
                  borderColor: isDark ? "rgba(234, 88, 12, 0.3)" : "#FED7AA",
                },
              ]}
            >
              <Ionicons name="calendar" size={24} color={isDark ? "#FB923C" : "#EA580C"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#FDBA74" : "#7C2D12" },
                ]}
                numberOfLines={1}
              >
                Panchang
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("MandirPooja")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(124, 58, 237, 0.15)" : "#F3E8FF",
                  borderColor: isDark ? "rgba(124, 58, 237, 0.3)" : "#E9D5FF",
                },
              ]}
            >
              <Ionicons name="flame" size={24} color={isDark ? "#C084FC" : "#7C3AED"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#D8B4FE" : "#581C87" },
                ]}
                numberOfLines={1}
              >
                Pooja
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Astrologers")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE",
                  borderColor: isDark ? "rgba(2, 132, 199, 0.3)" : "#BAE6FD",
                },
              ]}
            >
              <Ionicons name="people" size={24} color={isDark ? "#38BDF8" : "#0284C7"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#7DD3FC" : "#0C4A6E" },
                ]}
                numberOfLines={1}
              >
                Astrologers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Shop")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "#DCFCE7",
                  borderColor: isDark ? "rgba(22, 163, 74, 0.3)" : "#BBF7D0",
                },
              ]}
            >
              <Ionicons name="bag-handle" size={24} color={isDark ? "#4ADE80" : "#16A34A"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#86EFAC" : "#14532D" },
                ]}
                numberOfLines={1}
              >
                Shop
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("News")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(13, 148, 136, 0.15)" : "#CCFBF1",
                  borderColor: isDark ? "rgba(13, 148, 136, 0.3)" : "#99F6E4",
                },
              ]}
            >
              <Ionicons name="newspaper" size={24} color={isDark ? "#2DD4BF" : "#0D9488"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#5EEAD4" : "#134E4A" },
                ]}
                numberOfLines={1}
              >
                News
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Videos")}
              style={[
                styles.pastelCard,
                {
                  backgroundColor: isDark ? "rgba(225, 29, 72, 0.15)" : "#FFE4E6",
                  borderColor: isDark ? "rgba(225, 29, 72, 0.3)" : "#FECDD3",
                },
              ]}
            >
              <Ionicons name="play-circle" size={24} color={isDark ? "#FB7185" : "#E11D48"} />
              <Text
                style={[
                  styles.pastelCardText,
                  { color: isDark ? "#FDA4AF" : "#881337" },
                ]}
                numberOfLines={1}
              >
                Videos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shravan Month Special Banner */}
        <LinearGradient
          colors={
            isDark
              ? ["rgba(127, 29, 29, 0.55)", "rgba(217, 119, 6, 0.25)"]
              : ["#FFFDF7", "#FEF3C7"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.specialBanner,
            {
              backgroundColor: isDark ? undefined : "#FFF8E7",
              borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "#FDE68A",
              borderRadius: 18,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              marginHorizontal: 16,
              marginVertical: 12,
              shadowColor: "#D97706",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0 : 0.08,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <Image
            source={require("../../../assets/pooja_kalash.png")}
            style={{ width: 84, height: 84 }}
            resizeMode="contain"
          />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "800", color: isDark ? "#FBBF24" : "#7F1D1D" }}
            >
              Shravan Special 🔱
            </Text>
            <Text style={{ fontSize: 11, color: bodyTextColor, marginTop: 4, marginBottom: 10 }}>
              Get special blessings & discounts on Puja services
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("MandirPooja")}
              style={[
                styles.bookNowBtn,
                {
                  backgroundColor: "#EA580C",
                  alignSelf: "flex-start",
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 7,
                  elevation: 2,
                  shadowColor: "#EA580C",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "800" }}>
                Book Now ›
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={{ height: 24 }} />

        {/* Chat with Astrologer Section */}
        <SectionHeader
          title="Chat With Astrologer"
          icon="chatbubble"
          onSeeAll={() => navigation.navigate("AstrologerList", { onlyChat: true })}
        />
        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : chatAstrologers.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={chatAstrologers.slice(0, 8)}
            keyExtractor={(a) => `chat-${a.userId}`}
            renderItem={({ item }) => renderAstroRowCard(item, "chat")}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        ) : (
          <GlassCard style={{ marginHorizontal: 16, padding: 12 }}>
            <Text style={[typography.body, { textAlign: "center", color: bodyTextColor }]}>
              No chat astrologers available
            </Text>
          </GlassCard>
        )}

        <View style={{ height: 20 }} />

        {/* Audio Call with Astrologer Section */}
        <SectionHeader
          title="Audio Call With Astrologer"
          icon="call"
          onSeeAll={() => navigation.navigate("AstrologerList", { onlyAudio: true })}
        />
        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : audioCallAstrologers.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={audioCallAstrologers.slice(0, 8)}
            keyExtractor={(a) => `audio-${a.userId}`}
            renderItem={({ item }) => renderAstroRowCard(item, "audio")}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        ) : (
          <GlassCard style={{ marginHorizontal: 16, padding: 12 }}>
            <Text style={[typography.body, { textAlign: "center", color: bodyTextColor }]}>
              No audio call astrologers available
            </Text>
          </GlassCard>
        )}

        <View style={{ height: 20 }} />

        {/* Video Call with Astrologer Section */}
        <SectionHeader
          title="Video Call With Astrologer"
          icon="videocam"
          onSeeAll={() => navigation.navigate("AstrologerList", { onlyVideo: true })}
        />
        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : videoCallAstrologers.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={videoCallAstrologers.slice(0, 8)}
            keyExtractor={(a) => `video-${a.userId}`}
            renderItem={({ item }) => renderAstroRowCard(item, "video")}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        ) : (
          <GlassCard style={{ marginHorizontal: 16, padding: 12 }}>
            <Text style={[typography.body, { textAlign: "center", color: bodyTextColor }]}>
              No video call astrologers available
            </Text>
          </GlassCard>
        )}

        <View style={{ height: 24 }} />

        {favoriteAstrologers.length > 0 && (
          <>
            <SectionHeader
              title="Favorite Astrologers"
              onSeeAll={() => navigation.navigate("AstrologerList", { onlyFavorites: true })}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={favoriteAstrologers}
              keyExtractor={(a) => `fav-${a.userId}`}
              renderItem={({ item }) => {
                const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers);
                return (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("AstrologerDetail", { id: item.userId })
                    }
                    style={styles.astroCard}
                  >
                    <GlassCard style={styles.astroInner}>
                      <Avatar
                        size={56}
                        online={isOnline}
                        uri={item.avatar}
                        name={item.name}
                      />
                      <Text style={typography.cardTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <StarRating
                        rating={
                          typeof item.rating === "string"
                            ? parseFloat(item.rating)
                            : item.rating
                        }
                        size={12}
                      />
                      <Text style={typography.caption}>
                        {item.specialization?.[0] || "Astrologer"}
                      </Text>
                      <Text style={typography.price}>
                        ₹{item.chatPricePerMin || item.pricePerMin}/min
                      </Text>
                    </GlassCard>
                  </TouchableOpacity>
                );
              }}
              style={{ marginLeft: 8 }}
            />
            <View style={{ height: 16 }} />
          </>
        )}

        <SectionHeader
          title="Live Astrologers"
          onSeeAll={() =>
            navigation.navigate("AstrologerList", { onlyLive: true })
          }
        />
        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : astrologers.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={astrologers
              .filter((a) => getAstrologerOnlineStatus(a, astrologerStatuses, onlineUsers))
              .slice(0, 6)}
            keyExtractor={(a) => a.userId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AstrologerDetail", { id: item.userId })
                }
                style={styles.astroCard}
              >
                <GlassCard style={styles.astroInner}>
                  <Avatar
                    size={56}
                    online={getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers)}
                    uri={item.avatar}
                    name={item.name}
                  />
                  <Text style={typography.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <StarRating
                    rating={
                      typeof item.rating === "string"
                        ? parseFloat(item.rating)
                        : item.rating
                    }
                    size={12}
                  />
                  <Text style={typography.caption}>
                    {item.specialization?.[0] || "Astrologer"}
                  </Text>
                  <Text style={typography.price}>
                    ₹{item.chatPricePerMin || item.pricePerMin}/min
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            )}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <GlassCard>
            <Text style={[typography.body, { textAlign: "center" }]}>
              No astrologers available right now
            </Text>
          </GlassCard>
        )}

        {/* <View style={{ height: 24 }} />

        <SectionHeader
          title="By Category"
          onSeeAll={() => navigation.navigate("AstrologerList")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {ASTRO_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={cat === selectedCategory}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
        {filteredCategoryAstro.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filteredCategoryAstro.slice(0, 6)}
            keyExtractor={(a) => a.userId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AstrologerDetail", { id: item.userId })
                }
                style={styles.astroCard}
              >
                <GlassCard style={styles.astroInner}>
                  <Avatar
                    size={56}
                    online={getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers)}
                    uri={item.avatar}
                    name={item.name}
                  />
                  <Text style={typography.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <StarRating
                    rating={
                      typeof item.rating === "string"
                        ? parseFloat(item.rating)
                        : item.rating
                    }
                    size={12}
                  />
                  <Text style={typography.caption}>
                    {item.specialization?.[0] || "Astrologer"}
                  </Text>
                  <Text style={typography.price}>
                    ₹{item.chatPricePerMin || item.pricePerMin}/min
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            )}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <GlassCard>
            <Text style={[typography.body, { textAlign: "center" }]}>
              No astrologers in this category
            </Text>
          </GlassCard>
        )} */}

        {poojas.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader
              title="Mandir Pooja"
              onSeeAll={() => navigation.navigate("MandirPooja")}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={poojas.slice(0, 4)}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("MandirPoojaDetail", { poojaId: item.id })}
                  style={{ width: 180, marginRight: 12 }}
                >
                  <GlassCard
                    style={{
                      alignItems: "center",
                      paddingVertical: 20,
                      gap: 8,
                      height: 180,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.accentGold + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="flame"
                        size={24}
                        color={colors.accentGold}
                      />
                    </View>
                    <Text style={typography.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text
                        style={[typography.caption, { textAlign: "center" }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
                    <Text style={typography.price}>₹{item.price}</Text>
                  </GlassCard>
                </TouchableOpacity>
              )}
              style={{ marginLeft: 0 }}
            />
          </>
        )}

        {videos.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader
              title="Videos"
              onSeeAll={() => navigation.navigate("Videos")}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={videos.slice(0, 5)}
              keyExtractor={(v) => v.id}
              renderItem={({ item }) => {
                const ytMatch = (item.url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const thumbUrl = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : item.thumbnail;
                return (
                <TouchableOpacity style={{ width: 220, marginRight: 12 }} onPress={() => navigation.navigate("Videos", { videoId: item.id })}>
                  <GlassCard style={{ padding: 0, overflow: "hidden", height: 175 }}>
                    <View
                      style={{
                        height: 110,
                        backgroundColor: colors.surfaceLight,
                        alignItems: "center",
                        justifyContent: "center",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        overflow: "hidden",
                      }}
                    >
                      {thumbUrl ? (
                        <Image source={{ uri: thumbUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : null}
                      <View
                        style={{
                          position: "absolute",
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="play"
                          size={22}
                          color={colors.white}
                          style={{ marginLeft: 3 }}
                        />
                      </View>
                    </View>
                    <View style={{ padding: 10 }}>
                      <Text style={typography.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.category && (
                        <Text style={[typography.caption, { marginTop: 2 }]}>
                          {item.category}
                        </Text>
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
                );
              }}
              style={{ marginLeft: 0 }}
            />
          </>
        )}

        {blogs.length > 0 && (
          <>
            <View style={{ height: 24 }} />
            <SectionHeader
              title="Latest Blogs"
              onSeeAll={() => navigation.navigate("Blogs")}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={blogs.slice(0, 5)}
              keyExtractor={(b) => b.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("BlogDetail", { blogId: item.id })}
                  style={{ width: 240, marginRight: 12 }}
                >
                  <GlassCard style={{ padding: 14, height: 155 }}>
                    <Text style={typography.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text
                      style={[typography.body, { marginTop: 4 }]}
                      numberOfLines={2}
                    >
                      {item.excerpt || item.content?.slice(0, 120)}
                    </Text>
                    {item.tags && item.tags.length > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 4,
                          marginTop: 6,
                        }}
                      >
                        {item.tags.slice(0, 2).map((tag) => (
                          <Chip key={tag} label={tag} />
                        ))}
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              )}
              style={{ marginLeft: 0 }}
            />
          </>
        )}

        <View style={{ height: 24 }} />
        <SectionHeader title="Support Our Mission" />
        <GlassCard style={{ alignItems: "center", padding: 24 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.danger + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="heart" size={28} color={colors.danger} />
          </View>
          <Text style={[typography.cardTitle, { textAlign: "center" }]}>
            Make a Donation
          </Text>
          <Text
            style={[
              typography.body,
              { textAlign: "center", marginTop: 4, marginBottom: 12 },
            ]}
          >
            Your contribution helps us maintain this sacred platform and support
            our spiritual community.
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
              paddingHorizontal: 8,
            }}
          >
            {["101", "501", "1100", "2100"].map((a) => (
              <Chip key={a} label={`₹${a}`} />
            ))}
          </View>
          <GradientButton
            title="Donate Now"
            variant="gold"
            onPress={() => navigation.navigate("Donation")}
            style={{ width: "100%" }}
          />
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {menuOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("PrivacyPolicy");
              }}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.divider },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.body,
                  { marginLeft: 10, color: colors.textPrimary },
                ]}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("TermsConditions");
              }}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.divider },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.body,
                  { marginLeft: 10, color: colors.textPrimary },
                ]}
              >
                Terms & Conditions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("AboutApp");
              }}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.divider },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.body,
                  { marginLeft: 10, color: colors.textPrimary },
                ]}
              >
                About App
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("Support");
              }}
              style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
            >
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.body,
                  { marginLeft: 10, color: colors.textPrimary },
                ]}
              >
                Help & Support
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <InsufficientBalanceDialog
        visible={balanceDialogVisible}
        onClose={() => setBalanceDialogVisible(false)}
        onRecharge={() => {
          setBalanceDialogVisible(false);
          navigation.navigate("Wallet");
        }}
      />
    </ScreenWrapper>
  );
}

// Astrologers List
export function AstrologerListScreen({ route, navigation }: any) {
  const { openConversation, astrologerStatuses, onlineUsers } = useChat();
  const { initiateCall } = useCall();
  const isFocused = useIsFocused();
  const [data, setData] = useState<Astrologer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const rawCats = data.flatMap((a) => a.specialization || []).filter(Boolean);
  const uniqueCats = rawCats.filter((val, index) => rawCats.indexOf(val) === index);
  const cats = ["All", ...uniqueCats];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [balanceDialogVisible, setBalanceDialogVisible] = useState(false);
  const onlyLive = route?.params?.onlyLive ?? false;
  const onlyFavorites = route?.params?.onlyFavorites ?? false;
  const onlyChat = route?.params?.onlyChat ?? false;
  const onlyAudio = route?.params?.onlyAudio ?? false;
  const onlyVideo = route?.params?.onlyVideo ?? false;

  const fetchData = useCallback(() => api.astrologers.list().then(setData), []);
  useEffect(() => {
    if (isFocused) {
      if (data.length === 0) setLoading(true);
      fetchData().finally(() => setLoading(false));
      api.wallet.get().then((w) => setWalletBalance(Number(w.balance))).catch(() => {});
    }
  }, [isFocused, fetchData, data.length]);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  useEffect(() => {
    if (isFocused && onlyFavorites) {
      api.favorites.list().then((favs: any[]) => setFavoriteIds(favs.map((f: any) => f.userId))).catch(() => {});
    }
  }, [isFocused, onlyFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  const filtered = data.filter((a) => {
    const matchesSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.specialization?.some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      );
    const matchesCategory =
      selectedCat === "All" ||
      a.specialization?.some(
        (s) => s.toLowerCase() === selectedCat.toLowerCase(),
      );
    const matchesLive =
      !onlyLive || getAstrologerOnlineStatus(a, astrologerStatuses, onlineUsers);
    const matchesFav =
      !onlyFavorites || favoriteIds.includes(a.userId);
    const matchesChat =
      !onlyChat || a.isChatEnabled !== false;
    const matchesAudio =
      !onlyAudio || a.isAudioCallEnabled !== false;
    const matchesVideo =
      !onlyVideo || a.isVideoCallEnabled !== false;
    return matchesSearch && matchesCategory && matchesLive && matchesFav && matchesChat && matchesAudio && matchesVideo;
  });

  const getHeaderTitle = () => {
    if (onlyLive) return "Live Astrologers";
    if (onlyFavorites) return "Favorite Astrologers";
    if (onlyChat) return "Chat with Astrologer";
    if (onlyAudio) return "Audio Call with Astrologer";
    if (onlyVideo) return "Video Call with Astrologer";
    return "Astrologers";
  };

  return (
    <ScreenWrapper noPadding>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>
          {getHeaderTitle()}
        </Text>
      </View>
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
      <FlatList
        data={filtered}
        keyExtractor={(a) => a.userId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon={
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={colors.textMuted}
                />
              }
              title="No astrologers"
            />
          )
        }
        renderItem={({ item }) => {
          const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses, onlineUsers);
          const isVerified = item.verificationStatus === "approved";
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AstrologerDetail", { id: item.userId })
              }
              style={{ marginBottom: 12 }}
            >
              <GlassCard>
                <View style={styles.row}>
                  <Avatar size={56} online={isOnline} uri={item.avatar} name={item.name} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={typography.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <StarRating
                      rating={
                        typeof item.rating === "string"
                          ? parseFloat(item.rating)
                          : item.rating
                      }
                      size={12}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        marginTop: 4,
                        gap: 4,
                      }}
                    >
                      {item.specialization?.slice(0, 2).map((s) => (
                        <Chip key={s} label={s} />
                      ))}
                    </View>
                  </View>
                </View>

                {/* Quick Action Buttons Row */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    marginTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                    paddingTop: 10,
                  }}
                >
                  <TouchableOpacity
                    disabled={item.isChatEnabled === false}
                    onPress={async () => {
                      if (!isVerified) {
                        Alert.alert(
                          "Not Verified",
                          "This astrologer is not yet verified.",
                        );
                        return;
                      }
                      const convId = await openConversation(
                        item.userId,
                        "astrologer",
                      );
                      navigation.navigate("ChatRoom", {
                        conversationId: convId,
                        participantId: item.userId,
                        participantRole: "astrologer",
                        participantName: item.name,
                      });
                    }}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: item.isChatEnabled === false ? colors.surfaceLight : "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="chatbubbles" size={14} color={item.isChatEnabled === false ? colors.textMuted : "#FFF"} />
                    <Text
                      style={{ color: item.isChatEnabled === false ? colors.textMuted : "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      {item.isChatEnabled === false
                        ? "Chat N/A"
                        : `Chat ₹${parseFloat(item.chatPricePerMin || item.pricePerMin || "15").toFixed(0)}/m`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={item.isAudioCallEnabled === false}
                    onPress={() => {
                      if (!isVerified) {
                        Alert.alert(
                          "Not Verified",
                          "This astrologer is not yet verified.",
                        );
                        return;
                      }
                      if (!isOnline) {
                        Alert.alert(
                          "Offline",
                          `${item.name} is currently offline.`,
                        );
                        return;
                      }
                      const audioRate = parseFloat(item.audioCallPricePerMin || item.pricePerMin || '10');
                      if (walletBalance < audioRate) {
                        setBalanceDialogVisible(true);
                        return;
                      }
                      initiateCall(
                        (item.userId || item.id) as string,
                        item.name || "",
                        "audio",
                      );
                    }}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: item.isAudioCallEnabled === false ? colors.surfaceLight : "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="call" size={14} color={item.isAudioCallEnabled === false ? colors.textMuted : "#FFF"} />
                    <Text
                      style={{ color: item.isAudioCallEnabled === false ? colors.textMuted : "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      {item.isAudioCallEnabled === false
                        ? "Call N/A"
                        : `Call ₹${parseFloat(item.audioCallPricePerMin || item.pricePerMin || "18").toFixed(0)}/m`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={item.isVideoCallEnabled === false}
                    onPress={() => {
                      if (!isVerified) {
                        Alert.alert(
                          "Not Verified",
                          "This astrologer is not yet verified.",
                        );
                        return;
                      }
                      if (!isOnline) {
                        Alert.alert(
                          "Offline",
                          `${item.name} is currently offline.`,
                        );
                        return;
                      }
                      const videoRate = parseFloat(item.videoCallPricePerMin || item.pricePerMin || '20');
                      if (walletBalance < videoRate) {
                        setBalanceDialogVisible(true);
                        return;
                      }
                      initiateCall(
                        (item.userId || item.id) as string,
                        item.name || "",
                        "video",
                      );
                    }}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: item.isVideoCallEnabled === false ? colors.surfaceLight : "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="videocam" size={14} color={item.isVideoCallEnabled === false ? colors.textMuted : "#FFF"} />
                    <Text
                      style={{ color: item.isVideoCallEnabled === false ? colors.textMuted : "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      {item.isVideoCallEnabled === false
                        ? "Video N/A"
                        : `Video ₹${parseFloat(item.videoCallPricePerMin || item.pricePerMin || "50").toFixed(0)}/m`}
                    </Text>
                  </TouchableOpacity>
                </View>
               </GlassCard>
            </TouchableOpacity>
          );
        }}
      />
      <InsufficientBalanceDialog
        visible={balanceDialogVisible}
        onClose={() => setBalanceDialogVisible(false)}
        onRecharge={() => {
          setBalanceDialogVisible(false);
          navigation.navigate('Main', { screen: 'Wallet' });
        }}
      />
    </ScreenWrapper>
  );
}

// Astrologer Detail
export function AstrologerDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const isFocused = useIsFocused();
  const [astro, setAstro] = useState<Astrologer | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { openConversation, astrologerStatuses, onlineUsers, astrologerServices, giftVersion } = useChat();
  const { initiateCall } = useCall();
  const [offlineDialogVisible, setOfflineDialogVisible] = useState(false);
  const [balanceDialogVisible, setBalanceDialogVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccessVisible, setFeedbackSuccessVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftSending, setGiftSending] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const { user, theme } = useAuth();
  const isDark = theme === "dark";

  const titleColor = isDark ? "#F9FAFB" : "#1F2937";
  const bodyTextColor = isDark ? "#D1D5DB" : "#4B5563";
  const mutedTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const goldTextColor = isDark ? "#F59E0B" : "#D97706";
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const cardBorderColor = isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A";
  const cardLightBg = isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFBEB";

  const getAbsoluteImageUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${config.apiUrl}${path}`;
  };

  useEffect(() => {
    if (isFocused) {
      api.astrologers.get(id).then(setAstro);
      api.wallet.get().then((w) => setWalletBalance(Number(w.balance))).catch(() => {});
      api.favorites.status(id).then((res) => setIsFavorite(res.isFavorite)).catch(() => {});
      api.astrologers.getFeedback(id).then((res) => {
        setReviews(res.map((item: any) => ({
          id: item.id,
          userName: item.userName || "User",
          rating: Number(item.ratings || 0),
          comment: item.comments || "",
          createdAt: item.createdAt,
        })));
      }).catch(() => {});
    }
  }, [id, isFocused]);

  useEffect(() => {
    if (giftModalVisible) {
      api.gifts.list().then((g) => setGifts(g.filter((x: any) => x.isActive))).catch(() => {});
    }
  }, [giftModalVisible, giftVersion]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setReportModalVisible(true)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 6, opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name="flag-outline" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
        </Pressable>
      ),
    });
  }, [navigation, isDark]);
  if (!astro)
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );

  const isVerified = astro.verificationStatus === "approved";
  const isOnline = getAstrologerOnlineStatus(astro, astrologerStatuses, onlineUsers);

  const handleSubmitFeedback = async () => {
    if (feedbackRating < 1) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await api.astrologers.feedback(id, {
        userId: user.id,
        ratings: feedbackRating,
        comments: feedbackComment,
      });
      setFeedbackVisible(false);
      setFeedbackSuccessVisible(true);
      setFeedbackRating(0);
      setFeedbackComment("");
      api.astrologers.get(id).then(setAstro);
      api.astrologers.getFeedback(id).then((res) => {
        setReviews(res.map((item: any) => ({
          id: item.id,
          userName: item.userName || "User",
          rating: Number(item.ratings || 0),
          comment: item.comments || "",
          createdAt: item.createdAt,
        })));
      }).catch(() => {});
    } catch (e) {
      Alert.alert("Error", "Failed to submit feedback");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleChat = async () => {
    if (!isVerified) {
      Alert.alert(
        "Not Verified",
        "This astrologer is not yet verified. Please choose a verified astrologer.",
      );
      return;
    }
    const convId = await openConversation(id, "astrologer");
    navigation.navigate("ChatRoom", {
      conversationId: convId,
      participantId: id,
      participantRole: "astrologer",
      participantName: astro.name,
      participantAvatar: astro.avatar,
    });
  };

  const handleAudioCall = () => {
    if (!isVerified) {
      Alert.alert("Not Verified", "This astrologer is not yet verified.");
      return;
    }
    if (!isOnline) {
      setOfflineDialogVisible(true);
      return;
    }
    const callRate = parseFloat(astro.audioCallPricePerMin || astro.pricePerMin || '10');
    if (walletBalance < callRate) {
      setBalanceDialogVisible(true);
      return;
    }
    initiateCall(id as string, astro.name || "", "audio");
  };

  const handleVideoCall = () => {
    if (!isVerified) {
      Alert.alert("Not Verified", "This astrologer is not yet verified.");
      return;
    }
    if (!isOnline) {
      setOfflineDialogVisible(true);
      return;
    }
    const callRate = parseFloat(astro.videoCallPricePerMin || astro.pricePerMin || '20');
    if (walletBalance < callRate) {
      setBalanceDialogVisible(true);
      return;
    }
    initiateCall(id as string, astro.name || "", "video");
  };

  const wsServices = astrologerServices[id];
  const isChatEnabled = wsServices ? wsServices.isChatEnabled : (astro.isChatEnabled ?? true);
  const isAudioCallEnabled = wsServices ? wsServices.isAudioCallEnabled : (astro.isAudioCallEnabled ?? true);
  const isVideoCallEnabled = wsServices ? wsServices.isVideoCallEnabled : (astro.isVideoCallEnabled ?? true);

  const statItems: any[] = [];
  if (isChatEnabled) {
    statItems.push({
      icon: "chatbubble-ellipses-sharp",
      color: "#8B5CF6",
      value: astro.totalChats !== undefined && astro.totalChats !== null ? String(astro.totalChats) : "0",
      label: "Chats",
      bgColor: "rgba(139, 92, 246, 0.15)"
    });
  }
  if (isAudioCallEnabled) {
    statItems.push({
      icon: "call-sharp",
      color: "#10B981",
      value: astro.totalAudioCalls !== undefined && astro.totalAudioCalls !== null ? String(astro.totalAudioCalls) : "0",
      label: "Calls",
      bgColor: "rgba(16, 185, 129, 0.15)"
    });
  }
  if (isVideoCallEnabled) {
    statItems.push({
      icon: "videocam-sharp",
      color: "#F59E0B",
      value: astro.totalVideoCalls !== undefined && astro.totalVideoCalls !== null ? String(astro.totalVideoCalls) : "0",
      label: "Video Calls",
      bgColor: "rgba(245, 158, 11, 0.15)"
    });
  }
  statItems.push({
    icon: "heart-sharp",
    color: "#EC4899",
    value: "98%",
    label: "Happy Clients",
    bgColor: "rgba(236, 72, 153, 0.15)"
  });

  return (
    <ScreenWrapper scroll style={{ padding: 16 }}>
      {/* Outer Card Container */}
      <View
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorderColor,
          borderWidth: 1.5,
          borderRadius: 24,
          padding: 16,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
          width: "100%",
          maxWidth: 600,
          alignSelf: "center",
        }}
      >
        {/* Top Header Row: Photo + Information */}
        <View
          style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
        >
          {/* Avatar Container with Verified Badge */}
          <View style={{ position: "relative", alignItems: "center" }}>
            {astro.avatar ? (
              <Image
                source={{ uri: getAbsoluteImageUrl(astro.avatar) }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#F59E0B",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#F59E0B",
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.white, fontSize: 36, fontWeight: "800" }}>
                  {(() => {
                    const n = astro.name || "?";
                    const parts = n.trim().split(/\s+/);
                    if (parts.length === 0) return "?";
                    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  })()}
                </Text>
              </View>
            )}
            {isVerified && (
              <View
                style={{
                  position: "absolute",
                  bottom: -8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: "#F59E0B",
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  elevation: 2,
                }}
              >
                <Ionicons
                  name="checkmark-circle-sharp"
                  size={12}
                  color="#F59E0B"
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: goldTextColor,
                  }}
                >
                  Verified Astrologer
                </Text>
              </View>
            )}
          </View>

          {/* Right Info Section */}
          <View style={{ flex: 1 }}>
            {/* Name + Checkmark + Online Status */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                  flex: 1,
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: titleColor }}
                >
                  {astro.name}
                </Text>
                {isVerified && (
                  <Ionicons
                    name="checkmark-circle-sharp"
                    size={18}
                    color="#F59E0B"
                  />
                )}
              </View>
              {/* Online Pill */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isOnline ? "#10B981" : mutedTextColor,
                  backgroundColor: isOnline
                    ? isDark
                      ? "rgba(16,185,129,0.15)"
                      : "#D1FAE5"
                    : isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: isOnline ? "#10B981" : mutedTextColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: isOnline
                      ? isDark
                        ? "#34D399"
                        : "#059669"
                      : mutedTextColor,
                  }}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>

            {/* Specialization Subtitle */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: goldTextColor,
                marginTop: 2,
              }}
            >
              {astro.specialization?.[0] || "Vedic Astrology Expert"}
            </Text>

            {/* Rating Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 6,
              }}
            >
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text
                style={{ fontSize: 12, fontWeight: "800", color: titleColor }}
              >
                {parseFloat(String(astro.rating || "0")).toFixed(1)}
              </Text>
              <Text style={{ fontSize: 11, color: mutedTextColor }}>
                | {astro.totalReviews !== undefined && astro.totalReviews !== null ? astro.totalReviews : 0} Reviews
              </Text>
            </View>

            {/* Experience Pill */}
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
                borderColor: isDark ? "rgba(245,158,11,0.3)" : "#FCD34D",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginTop: 6,
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "800", color: titleColor }}
              >
                ✨ {astro.experience || "7"}+ Years Exp
              </Text>
            </View>

            {/* Specialty Tag Chips */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {(astro.specialization?.length
                ? astro.specialization
                : ["Vedic", "Kundli", "Vastu", "Horoscope"]
              ).map((s) => (
                <View
                  key={s}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.12)",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: bodyTextColor,
                    }}
                  >
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bio Paragraph */}
        <Text
          style={{
            fontSize: 12,
            color: bodyTextColor,
            lineHeight: 18,
            marginTop: 14,
            marginBottom: 12,
          }}
        >
          {astro.bio ||
            "Specialist in Kundli reading, marriage, career, business, health and relationship solutions."}
        </Text>

        {/* Dynamic Stats Grid */}
        {statItems.length > 0 && (
          <View
            style={{
              paddingVertical: 12,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#FDE68A",
              marginVertical: 10,
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              {statItems.map((item, idx) => {
                const showDivider = idx > 0 && idx % 2 !== 0;
                const isSecondRow = idx >= 2;
                return (
                  <React.Fragment key={item.label}>
                    {idx === 2 && (
                      <View style={{ width: "100%", height: 12 }} />
                    )}
                    {showDivider && (
                      <View style={{ width: 1, height: 32, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FDE68A" }} />
                    )}
                    <View style={{ alignItems: "center", flex: 1, minWidth: 120 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: item.bgColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name={item.icon as any} size={15} color={item.color} />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: titleColor }}>
                          {item.value}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: mutedTextColor, marginTop: 2 }}>
                        {item.label}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* Rates Box Container (Conditional) */}
        {(isChatEnabled || isAudioCallEnabled || isVideoCallEnabled) && (
          <View
            style={{
              backgroundColor: cardLightBg,
              borderColor: cardBorderColor,
              borderWidth: 1,
              borderRadius: 16,
              padding: 12,
              marginTop: 6,
              marginBottom: 16,
              gap: 10,
            }}
          >
            {isChatEnabled && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="chatbox" size={16} color="#F59E0B" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: titleColor }}>Chat Price</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: titleColor }}>
                  ₹{astro.chatPricePerMin || 15}.00<Text style={{ fontSize: 11, color: mutedTextColor, fontWeight: "400" }}>/min</Text>
                </Text>
              </View>
            )}

            {isChatEnabled && (isAudioCallEnabled || isVideoCallEnabled) && (
              <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
            )}

            {isAudioCallEnabled && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="call" size={16} color="#10B981" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: titleColor }}>Voice Call Price</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: titleColor }}>
                  ₹{astro.audioCallPricePerMin || 22}.50<Text style={{ fontSize: 11, color: mutedTextColor, fontWeight: "400" }}>/min</Text>
                </Text>
              </View>
            )}

            {isAudioCallEnabled && isVideoCallEnabled && (
              <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
            )}

            {isVideoCallEnabled && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="videocam" size={16} color="#8B5CF6" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: titleColor }}>Video Call Price</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: titleColor }}>
                  ₹{astro.videoCallPricePerMin || 20}.00<Text style={{ fontSize: 11, color: mutedTextColor, fontWeight: "400" }}>/min</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons Rows */}
        <View style={{ gap: 8, marginTop: 8 }}>
          {/* Row 1: Primary Communication Actions */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {/* Chat Button */}
            {isChatEnabled && (
              <TouchableOpacity
                onPress={handleChat}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: "#F59E0B",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#F59E0B",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
                  Chat
                </Text>
              </TouchableOpacity>
            )}

            {/* Call Button */}
            {isAudioCallEnabled && (
              <TouchableOpacity
                onPress={handleAudioCall}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: "#F59E0B",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#F59E0B",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
                  Call
                </Text>
              </TouchableOpacity>
            )}

            {/* Video Button */}
            {isVideoCallEnabled && (
              <TouchableOpacity
                onPress={handleVideoCall}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: "#F59E0B",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#F59E0B",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="videocam" size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
                  Video
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Row 2: Secondary Engagement Actions */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {/* Favorite Button */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  const res = await api.favorites.toggle(id);
                  setIsFavorite(res.isFavorite);
                } catch {
                  Alert.alert("Error", "Failed to update favorite status");
                }
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isFavorite ? "#EF4444" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                backgroundColor: isFavorite ? "rgba(239, 68, 68, 0.1)" : isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? "#EF4444" : titleColor}
              />
              <Text style={{ fontSize: 12, fontWeight: "700", color: isFavorite ? "#EF4444" : titleColor }}>
                {isFavorite ? "Favorited" : "Add Favorite"}
              </Text>
            </TouchableOpacity>

            {/* Gift Button */}
            <TouchableOpacity
              onPress={() => setGiftModalVisible(true)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "#E11D48",
                backgroundColor: isDark ? "rgba(225, 29, 72, 0.15)" : "#FFE4E6",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="gift" size={18} color="#E11D48" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#E11D48" }}>
                Send Gift
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Details & Credentials Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorderColor,
          borderWidth: 1.5,
          borderRadius: 24,
          padding: 16,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: titleColor,
            marginBottom: 12,
          }}
        >
          Details & Credentials
        </Text>
        {astro.specialization?.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: mutedTextColor,
                marginBottom: 6,
              }}
            >
              Specialization
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {astro.specialization.map((s) => (
                <Chip key={s} label={s} />
              ))}
            </View>
          </View>
        )}
        {astro.languages?.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: mutedTextColor,
                marginBottom: 6,
              }}
            >
              Languages Spoken
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {astro.languages.map((l) => (
                <Chip key={l} label={l} />
              ))}
            </View>
          </View>
        )}
        {astro.skills?.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: mutedTextColor,
                marginBottom: 6,
              }}
            >
              Skills & Tools
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {astro.skills.map((s) => (
                <Chip key={s} label={s} />
              ))}
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={() => setFeedbackVisible(true)}
          style={{
            marginTop: 8,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
            borderWidth: 1,
            borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FCD34D",
            alignItems: "center",
          }}
        >
          <Text
            style={{ fontSize: 13, fontWeight: "800", color: goldTextColor }}
          >
            ⭐ Write a Review / Feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setReportModalVisible(true)}
          style={{
            marginTop: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={15} color={mutedTextColor} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: mutedTextColor }}>
            Report Astrologer
          </Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        title={`Report ${astro.name}`}
      >
        <View style={{ padding: 16, gap: 14, paddingBottom: 36 }}>
          <Text style={{ fontSize: 13, color: mutedTextColor, lineHeight: 18 }}>
            Please select the reason for reporting this astrologer. Our moderation team reviews every report.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["spam", "harassment", "fake_profile", "inappropriate", "other"].map((r) => (
              <Chip
                key={r}
                label={r.replace(/_/g, " ")}
                selected={reportReason === r}
                onPress={() => setReportReason(r)}
              />
            ))}
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.surfaceLight,
                borderColor: cardBorderColor,
                color: titleColor,
                minHeight: 80,
                textAlignVertical: "top",
              },
            ]}
            value={reportDesc}
            onChangeText={setReportDesc}
            placeholder="Additional details (optional)..."
            placeholderTextColor={mutedTextColor}
            multiline
          />
          <GradientButton
            title={reportSubmitting ? "Submitting..." : "Submit Report"}
            variant="danger"
            disabled={reportSubmitting || !reportReason}
            onPress={async () => {
              if (!reportReason) {
                Alert.alert("Required", "Please select a reason");
                return;
              }
              setReportSubmitting(true);
              try {
                await api.reports.create({
                  reason: reportReason,
                  description: reportDesc,
                  reportedAstrologerId: id,
                });
                setReportModalVisible(false);
                setReportReason("");
                setReportDesc("");
                Alert.alert("Report Submitted", "Thank you for reporting. Our moderation team will investigate.");
              } catch (e: any) {
                Alert.alert("Error", e?.response?.data?.message || e?.message || "Failed to submit report");
              } finally {
                setReportSubmitting(false);
              }
            }}
          />
        </View>
      </CustomModal>

      <CustomModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        title={`Rate ${astro.name}`}
      >
        <View style={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity key={v} onPress={() => setFeedbackRating(v)}>
                <Ionicons
                  name={feedbackRating >= v ? "star" : "star-outline"}
                  size={32}
                  color={
                    feedbackRating >= v ? colors.accentGold : colors.textMuted
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
          {feedbackRating > 0 && (
            <Text
              style={[
                typography.body,
                { textAlign: "center", color: colors.textSecondary },
              ]}
            >
              {feedbackRating} / 5
            </Text>
          )}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceLight,
                color: colors.textPrimary,
                minHeight: 80,
                textAlignVertical: "top",
              },
            ]}
            value={feedbackComment}
            onChangeText={setFeedbackComment}
            placeholder="Write your comments (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <GradientButton
            title={feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
            onPress={handleSubmitFeedback}
            disabled={feedbackSubmitting || feedbackRating === 0}
          />
        </View>
      </CustomModal>
      <ConfirmDialog
        visible={feedbackSuccessVisible}
        title="Thank you!"
        subtitle="Your feedback has been submitted successfully."
        icon={<Ionicons name="heart" size={48} color={colors.accentGold} />}
        actions={[
          {
            label: "OK",
            onPress: () => setFeedbackSuccessVisible(false),
            variant: "primary",
          },
        ]}
        onClose={() => setFeedbackSuccessVisible(false)}
      />
      <ConfirmDialog
        visible={offlineDialogVisible}
        title="Astrologer Offline"
        subtitle={`${astro.name} is currently offline. Please try again later.`}
        icon={
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.danger}
          />
        }
        actions={[
          {
            label: "OK",
            onPress: () => setOfflineDialogVisible(false),
            variant: "primary",
          },
        ]}
        onClose={() => setOfflineDialogVisible(false)}
      />
      <InsufficientBalanceDialog
        visible={balanceDialogVisible}
        onClose={() => setBalanceDialogVisible(false)}
        onRecharge={() => {
          setBalanceDialogVisible(false);
          navigation.navigate('Main', { screen: 'Wallet' });
        }}
      />

      {/* Gift Modal */}
      <Modal visible={giftModalVisible} transparent animationType="fade" onRequestClose={() => setGiftModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFF' : '#1E293B' }}>Send Gift to {astro?.name}</Text>
              <TouchableOpacity onPress={() => { setGiftModalVisible(false); setSelectedGift(null); }}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#64748B'} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 16 }}>
              {gifts.map((item: any) => {
                const isSelected = selectedGift?.id === item.id;
                return (
                  <TouchableOpacity key={item.id} onPress={() => setSelectedGift(item)}
                    style={{ width: '30%', backgroundColor: isSelected ? (isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB') : (isDark ? '#111827' : '#FFF'), borderRadius: 14, borderWidth: 1, borderColor: isSelected ? colors.accentGold : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', paddingVertical: 12, alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? '#1F2937' : '#FFF', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="gift" size={24} color={colors.accentGold} />
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#64748B', fontWeight: '500', textAlign: 'center' }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FFF' : '#0F172A' }}>₹{item.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#FFF' : '#0F172A' }}>Your Balance: ₹{walletBalance}</Text>
              <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#64748B', textAlign: 'center' }}>Entire amount will be provided to expert</Text>
            </View>
            <TouchableOpacity onPress={async () => {
              if (!selectedGift) { Alert.alert('Select a Gift', 'Please choose a gift first.'); return; }
              setGiftSending(true);
              try {
                await api.gifts.send({ giftId: selectedGift.id, receiverId: id });
                setGiftModalVisible(false);
                setSelectedGift(null);
                Alert.alert('Gift Sent', `You sent ${selectedGift.name} to ${astro?.name}!`);
              } catch (e: any) {
                Alert.alert('Error', e?.response?.data?.message || 'Failed to send gift');
              } finally { setGiftSending(false); }
            }} disabled={giftSending} style={{ backgroundColor: isDark ? colors.accentGold : '#5C3214', borderRadius: 24, height: 48, alignItems: 'center', justifyContent: 'center', opacity: giftSending ? 0.7 : 1 }}>
              <Text style={{ color: isDark ? '#000' : '#FFF', fontSize: 15, fontWeight: '700' }}>{giftSending ? 'Sending...' : 'Send Gift'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// Wallet
type WalletTxnFilter = "wallet_recharge" | "donation" | "pooja_booking";

const WALLET_TXN_FILTERS: { key: WalletTxnFilter; label: string }[] = [
  { key: "wallet_recharge", label: "Wallet Recharge" },
  { key: "donation", label: "Donation" },
  { key: "pooja_booking", label: "Pooja Booking" },
];

const matchesWalletTxnType = (t: Transaction, filter: WalletTxnFilter): boolean => {
  const desc = (t.description || "").toLowerCase();
  const metaType = String(t.metadata?.paymentType || "").toLowerCase();
  switch (filter) {
    case "wallet_recharge":
      return t.category === "add_funds" || desc.includes("wallet_recharge") || metaType === "wallet_recharge";
    case "donation":
      return t.category === "donation" || desc.includes("donation payment") || metaType === "donation";
    case "pooja_booking":
      return t.category === "pooja_booking" || desc.includes("pooja") || desc.includes("puja") || metaType === "pooja_booking";
    default:
      return false;
  }
};

export function WalletScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [txnFilter, setTxnFilter] = useState<WalletTxnFilter>("wallet_recharge");
  const [showTxnFilter, setShowTxnFilter] = useState(false);
  const [amount, setAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const filteredTxns = useMemo(() => {
    return txns
      .filter((t) => matchesWalletTxnType(t, txnFilter))
      .slice(0, 10);
  }, [txns, txnFilter]);

  const load = useCallback(async () => {
    const w = await api.wallet.get();
    setWallet(w);
    const t = await api.transactions.listMy();
    setTxns(t);
  }, []);
  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const handleAddFunds = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    setLoadingPayment(true);
    try {
      const order = await api.payments.createOrder({
        amount: amt,
        purpose: "wallet_recharge",
      });
      setShowAdd(false);
      setAmount("");
      navigation.navigate("Payment", {
        razorpayOrderId: order.razorpayOrderId,
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        purpose: "wallet_recharge",
        paymentOrderId: order.id,
      });
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message;
      const msg = serverMsg || e?.message || "Failed to initiate payment";
      Alert.alert("Payment Error", msg);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleDonate = () => {
    navigation.navigate("Donation");
  };

  return (
    <ScreenWrapper scroll noPadding>
      <Navbar title="My Wallet" showBack={false} />
      <View style={{ width: "100%", maxWidth: 600, alignSelf: "center", padding: 16 }}>
        <GlassCard style={styles.balanceCard}>
        <Text style={typography.caption}>Available Balance</Text>
        <Text style={styles.balance}>₹{wallet?.balance || "0"}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <GradientButton
              title="Add Funds"
              onPress={() => setShowAdd(true)}
              small
            />
          </View>
          <View style={{ flex: 1 }}>
            <GradientButton
              title="Donate"
              variant="gold"
              onPress={handleDonate}
              small
            />
          </View>
        </View>
      </GlassCard>

      {showAdd && (
        <GlassCard style={{ padding: 20, marginTop: 12 }}>
          <Text style={[typography.cardTitle, { marginBottom: 12 }]}>
            Enter Amount
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount in ₹"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: radii.button,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <GradientButton
                title={loadingPayment ? "Processing..." : "Pay Now"}
                onPress={handleAddFunds}
                disabled={loadingPayment}
              />
            </View>
          </View>
        </GlassCard>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Text style={[typography.sectionTitle, { color: colors.textPrimary }]}>
          Transactions
        </Text>
        <TouchableOpacity
          onPress={() => setShowTxnFilter(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.surfaceLight,
            borderColor: colors.cardBorder,
            borderWidth: 1,
            borderRadius: radii.input,
            paddingHorizontal: 12,
            height: 40,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary }}>
            {WALLET_TXN_FILTERS.find((f) => f.key === txnFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTxnFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTxnFilter(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowTxnFilter(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: colors.surface,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: 16,
            }}
          >
            <Text style={[typography.sectionTitle, { marginBottom: 12, color: colors.textPrimary }]}>
              Filter by Type
            </Text>
            {WALLET_TXN_FILTERS.map((f) => {
              const active = txnFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => {
                    setTxnFilter(f.key);
                    setShowTxnFilter(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>
                    {f.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accentGold} />
                  )}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {filteredTxns.length === 0 ? (
        <View style={{ marginTop: 24, alignItems: "center", paddingVertical: 24 }}>
          <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 10 }]}>
            No {WALLET_TXN_FILTERS.find((f) => f.key === txnFilter)?.label} transactions yet
          </Text>
        </View>
      ) : (
        filteredTxns.map((t) => {
          const isPooja = t.category === "pooja_booking" || t.description?.toLowerCase().includes("pooja") || t.description?.toLowerCase().includes("puja");
          const title = isPooja
            ? (t.metadata?.poojaName ? `Puja: ${t.metadata.poojaName}` : (t.description || 'Puja Booking'))
            : t.category === "donation"
            ? "Temple Donation"
            : t.category === "add_funds"
            ? "Wallet Recharge"
            : t.category
                ?.replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

          const isCredit = t.type === "credit" && !isPooja;

          return (
            <GlassCard key={t.id} style={{ marginTop: 8, padding: 12 }}>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={typography.cardTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={typography.caption}>
                    {new Date(t.createdAt).toLocaleDateString()} · {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 15,
                    color: isCredit ? colors.success : colors.danger,
                  }}
                >
                  {isCredit ? "+" : "-"}₹{t.amount}
                </Text>
              </View>
            </GlassCard>
          );
        })
      )}
      </View>
    </ScreenWrapper>
  );
}

// Chat
export function ChatScreen() {
  const [input, setInput] = useState("");
  return (
    <ScreenWrapper noPadding>
      <FlatList
        data={[]}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.textMuted}
              />
            }
            title="No messages yet"
            subtitle="Start chatting with an astrologer"
          />
        }
        renderItem={() => null}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.surfaceLight,
            borderRadius: 20,
            paddingHorizontal: 16,
            height: 44,
            color: colors.textPrimary,
            fontSize: 15,
          }}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
        />
        <GradientButton
          title="Send"
          onPress={() => {}}
          small
          style={{ width: 70 }}
        />
      </View>
    </ScreenWrapper>
  );
}

// Kundli
const RASHI_SANSKRIT: Record<string, string> = {
  Aries: "Mesha",
  Taurus: "Vrishabha",
  Gemini: "Mithuna",
  Cancer: "Karka",
  Leo: "Simha",
  Virgo: "Kanya",
  Libra: "Tula",
  Scorpio: "Vrischika",
  Sagittarius: "Dhanu",
  Capricorn: "Makara",
  Aquarius: "Kumbha",
  Pisces: "Meena",
};

const PLANET_ROWS: { key: string; label: string; hindi: string; icon: string }[] = [
  { key: "Su", label: "Sun", hindi: "Surya", icon: "sunny-outline" },
  { key: "Mo", label: "Moon", hindi: "Chandra", icon: "moon-outline" },
  { key: "Ma", label: "Mars", hindi: "Mangal", icon: "flame-outline" },
  { key: "Me", label: "Mercury", hindi: "Budh", icon: "chatbubble-ellipses-outline" },
  { key: "Ju", label: "Jupiter", hindi: "Guru", icon: "ribbon-outline" },
  { key: "Ve", label: "Venus", hindi: "Shukra", icon: "sparkles-outline" },
  { key: "Sa", label: "Saturn", hindi: "Shani", icon: "hourglass-outline" },
  { key: "Ra", label: "Rahu", hindi: "Rahu", icon: "eye-outline" },
  { key: "Ke", label: "Ketu", hindi: "Ketu", icon: "flash-outline" },
];

const KOOTA_ROWS: { key: string; label: string; desc: string }[] = [
  { key: "varna", label: "Varna", desc: "Spiritual compatibility" },
  { key: "vashya", label: "Vashya", desc: "Mutual attraction" },
  { key: "tara", label: "Tara", desc: "Birth star compatibility" },
  { key: "yoni", label: "Yoni", desc: "Physical compatibility" },
  { key: "grahaMaitri", label: "Graha Maitri", desc: "Mental compatibility" },
  { key: "gana", label: "Gana", desc: "Temperament compatibility" },
  { key: "rashi", label: "Bhakoot", desc: "Zodiac compatibility" },
  { key: "nadi", label: "Nadi", desc: "Health & progeny compatibility" },
];

const normalizeDegree = (lon: number) => ((Number(lon) % 360) + 360) % 360;

const formatDms = (lon: number) => {
  const value = normalizeDegree(lon);
  let deg = Math.floor(value);
  const minFloat = (value - deg) * 60;
  let min = Math.floor(minFloat);
  let sec = Math.round((minFloat - min) * 60);
  if (sec === 60) {
    sec = 0;
    min += 1;
  }
  return `${deg}\u00B0 ${String(min).padStart(2, "0")}\u2032 ${String(sec).padStart(2, "0")}\u2033`;
};

const signIndexOf = (lon: number) => Math.floor(normalizeDegree(lon) / 30);

const rashiLabel = (rashi?: string) => {
  if (!rashi) return "\u2014";
  const sanskrit = RASHI_SANSKRIT[rashi];
  return sanskrit ? `${rashi} (${sanskrit})` : rashi;
};

const resolveHouse = (
  key: string,
  planet: any,
  lagna: any,
  planetHouses?: Record<string, number>,
) => {
  const mapped = planetHouses?.[key];
  if (mapped) return mapped;
  if (!lagna || typeof planet?.longitude !== "number") return undefined;
  return ((signIndexOf(planet.longitude) - signIndexOf(lagna.longitude) + 12) % 12) + 1;
};

const scoreColor = (ratio: number) =>
  ratio >= 0.75 ? colors.success : ratio >= 0.4 ? colors.accentGold : colors.danger;

function KundliReport({ result }: { result: any }) {
  const chart = result?.chartData || {};
  const planets: Record<string, any> = chart.planetaryPositions || {};
  const lagna = chart.lagna;
  const planetHouses: Record<string, number> | undefined = chart.planetHouses;
  const moon = planets["Mo"];
  const sun = planets["Su"];

  const houseOccupants: Record<number, string[]> = {};
  PLANET_ROWS.forEach(({ key, label }) => {
    const planet = planets[key];
    if (!planet) return;
    const house = resolveHouse(key, planet, lagna, planetHouses);
    if (!house) return;
    houseOccupants[house] = houseOccupants[house] || [];
    houseOccupants[house].push(label);
  });

  const keyDetails = [
    {
      label: "Lagna (Ascendant)",
      value: lagna
        ? `${rashiLabel(lagna.rashi)}${lagna.nakshatra?.name ? ` \u00B7 ${lagna.nakshatra.name} pada ${lagna.nakshatra.pada}` : ""}`
        : "\u2014",
    },
    { label: "Chandra Rashi (Moon sign)", value: moon ? rashiLabel(moon.rashi) : "\u2014" },
    {
      label: "Janma Nakshatra",
      value: moon
        ? `${moon.nakshatra?.name || "\u2014"} (pada ${moon.nakshatra?.pada || "-"})`
        : "\u2014",
    },
    { label: "Surya Rashi (Sun sign)", value: sun ? rashiLabel(sun.rashi) : "\u2014" },
  ];

  const birthDetails = [
    { label: "Name", value: result?.name || "\u2014" },
    {
      label: "Date of Birth",
      value: result?.dateOfBirth ? String(result.dateOfBirth).split("T")[0] : "\u2014",
    },
    { label: "Time of Birth", value: result?.timeOfBirth || "\u2014" },
    { label: "Place of Birth", value: result?.placeOfBirth || "\u2014" },
  ];

  return (
    <View style={{ gap: 16, marginTop: 20 }}>
      <GlassCard style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="person-circle-outline" size={20} color={colors.accentGold} />
          <Text style={[typography.cardTitle]}>Birth Details</Text>
        </View>
        {birthDetails.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text style={[typography.body, { color: colors.textMuted }]}>{row.label}</Text>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600", flex: 1, textAlign: "right" }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="star-outline" size={20} color={colors.accentGold} />
          <Text style={[typography.cardTitle]}>Key Details</Text>
        </View>
        {keyDetails.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text style={[typography.body, { color: colors.textMuted }]}>{row.label}</Text>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600", flex: 1, textAlign: "right" }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="planet-outline" size={20} color={colors.accentGold} />
          <Text style={[typography.cardTitle]}>Planetary Positions</Text>
        </View>
        {PLANET_ROWS.map(({ key, label, hindi, icon }) => {
          const planet = planets[key];
          if (!planet) return null;
          const house = resolveHouse(key, planet, lagna, planetHouses);
          return (
            <View key={key} style={[styles.planetRow, { borderBottomColor: colors.cardBorder }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <Ionicons name={icon as any} size={18} color={colors.accentGold} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "700" }]}>
                    {label} ({hindi}){planet.isRetrograde ? " \u211E" : ""}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {planet.nakshatra?.name
                      ? `${planet.nakshatra.name} \u00B7 Pada ${planet.nakshatra.pada}`
                      : "\u2014"}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600" }]}>
                  {rashiLabel(planet.rashi)}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {typeof planet.longitude === "number"
                    ? `${formatDms(normalizeDegree(planet.longitude) % 30)}${house ? ` \u00B7 House ${house}` : ""}`
                    : house
                      ? `House ${house}`
                      : "\u2014"}
                </Text>
              </View>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="grid-outline" size={20} color={colors.accentGold} />
          <Text style={[typography.cardTitle]}>Bhava (Houses)</Text>
        </View>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => (
          <View key={house} style={styles.detailRow}>
            <Text
              style={[
                typography.body,
                {
                  color: house === 1 ? colors.accentGold : colors.textMuted,
                  fontWeight: house === 1 ? "700" : "400",
                },
              ]}
            >
              House {house}
              {house === 1 ? " (Lagna)" : ""}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600", flex: 1, textAlign: "right" }]}>
              {houseOccupants[house]?.join(", ") || "\u2014"}
            </Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

function MatchmakingReport({ result }: { result: any }) {
  const details = result?.matchDetails || {};
  const kootas: Record<string, any> = details.kootas || {};
  const maxScore = Number(details.maxScore) || 36;
  const score = Number(result?.matchScore ?? details.totalScore ?? 0);
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const verdict =
    details.compatibility ||
    (percent >= 70 ? "Excellent" : percent >= 50 ? "Good" : percent >= 30 ? "Average" : "Poor");
  const verdictColor =
    verdict === "Excellent"
      ? colors.success
      : verdict === "Good"
        ? colors.accentGold
        : verdict === "Average"
          ? colors.warning
          : colors.danger;

  const persons = [
    { name: result?.person1Name || "Person 1", summary: details.person1 },
    { name: result?.person2Name || "Person 2", summary: details.person2 },
  ];

  return (
    <View style={{ gap: 16, marginTop: 20 }}>
      <GlassCard style={{ padding: 20, alignItems: "center" }}>
        <Text style={[typography.sectionTitle]}>Guna Milan Score</Text>
        <Text style={{ fontSize: 40, fontWeight: "800", color: colors.accentGold, marginTop: 8 }}>
          {score}
          <Text style={{ fontSize: 20, color: colors.textMuted }}> / {maxScore}</Text>
        </Text>
        <View
          style={{
            width: "100%",
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.surfaceLight,
            overflow: "hidden",
            marginTop: 12,
          }}
        >
          <View
            style={{
              width: `${Math.max(0, Math.min(100, percent))}%`,
              height: "100%",
              backgroundColor: verdictColor,
              borderRadius: 4,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: verdictColor + "22" }}>
            <Text style={{ color: verdictColor, fontWeight: "700", fontSize: 13 }}>{verdict}</Text>
          </View>
          <Text style={[typography.caption]}>{percent}% overall compatibility</Text>
        </View>
      </GlassCard>

      {(details.person1 || details.person2) && (
        <GlassCard style={{ padding: 16 }}>
          <Text style={[typography.cardTitle, { marginBottom: 12 }]}>Birth Chart Details</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {persons.map((person, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceLight,
                  borderRadius: radii.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text
                  style={[typography.body, { color: colors.textPrimary, fontWeight: "700", marginBottom: 8 }]}
                  numberOfLines={1}
                >
                  {person.name}
                </Text>
                {person.summary ? (
                  <>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Chandra Rashi</Text>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }]}>
                      {rashiLabel(person.summary.rashi)}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Janma Nakshatra</Text>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600", marginBottom: 6 }]}>
                      {person.summary.nakshatra || "\u2014"}
                      {person.summary.pada ? ` (Pada ${person.summary.pada})` : ""}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Lagna</Text>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "600" }]}>
                      {rashiLabel(person.summary.lagna)}
                    </Text>
                  </>
                ) : (
                  <Text style={[typography.caption]}>Details unavailable for older records</Text>
                )}
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 16 }}>
        <Text style={[typography.cardTitle, { marginBottom: 4 }]}>Ashtakoota Breakdown</Text>
        <Text style={[typography.caption, { marginBottom: 12 }]}>
          Eight factors of Vedic compatibility, each scored individually
        </Text>
        {KOOTA_ROWS.map(({ key, label, desc }) => {
          const koota = kootas[key];
          if (!koota) return null;
          const ratio = koota.maxScore > 0 ? koota.score / koota.maxScore : 0;
          return (
            <View
              key={key}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "700" }]}>{label}</Text>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: "700" }]}>
                  {koota.score}/{koota.maxScore}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                {koota.description || desc}
              </Text>
              <View
                style={{
                  width: "100%",
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.surfaceLight,
                  overflow: "hidden",
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`,
                    height: "100%",
                    backgroundColor: scoreColor(ratio),
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
        <Text style={[typography.caption, { marginTop: 12, fontStyle: "italic" }]}>
          Total {score}/{maxScore} points. A score of 18 or above is generally considered compatible.
        </Text>
      </GlassCard>
    </View>
  );
}

export function KundliScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", dob: "", tob: "", place: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleGenerate = async () => {
    if (!form.name || !form.dob || !form.tob || !form.place) {
      Alert.alert("Required", "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await api.kundli.create({
        userId: user?.id,
        name: form.name,
        gender: "male",
        dateOfBirth: form.dob,
        timeOfBirth: form.tob,
        placeOfBirth: form.place,
      });
      setResult(res);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Failed to generate kundli",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <Text
        style={[
          typography.body,
          { marginBottom: 20, color: colors.textSecondary },
        ]}
      >
        Enter birth details for chart calculation
      </Text>
      <Input
        label="Name"
        value={form.name}
        onChange={(v: string) => setForm({ ...form, name: v })}
        placeholder="Full name"
      />
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{ marginBottom: 14 }}
      >
        <Text
          style={[
            typography.label,
            { marginBottom: 6, color: colors.textSecondary },
          ]}
        >
          Date of Birth
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceLight,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            height: 48,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text
            style={{
              color: form.dob ? colors.textPrimary : colors.textMuted,
              fontSize: 15,
              marginLeft: 8,
              flex: 1,
            }}
          >
            {form.dob || "Select date"}
          </Text>
        </View>
      </TouchableOpacity>
      <DatePicker
        visible={showDatePicker}
        value={form.dob}
        onClose={() => setShowDatePicker(false)}
        onSelect={(d) => {
          setForm({ ...form, dob: d });
          setShowDatePicker(false);
        }}
      />
      <View style={{ marginBottom: 14 }}>
        <TimePicker
          label="Time of Birth"
          value={form.tob}
          onChange={(t) => setForm({ ...form, tob: t })}
        />
      </View>
      <Input
        label="Place of Birth"
        value={form.place}
        onChange={(v: string) => setForm({ ...form, place: v })}
        placeholder="e.g. Jaipur"
      />
      <GradientButton
        title={loading ? "Generating..." : "Generate Kundli"}
        onPress={handleGenerate}
        disabled={loading}
      />
      {result && <KundliReport result={result} />}
    </ScreenWrapper>
  );
}

// Matchmaking
export function MatchmakingScreen() {
  const { user } = useAuth();
  const [p1, setP1] = useState({ name: "", dob: "", tob: "", place: "" });
  const [p2, setP2] = useState({ name: "", dob: "", tob: "", place: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<"p1" | "p2" | null>(
    null,
  );
  const [showTimePicker, setShowTimePicker] = useState<"p1" | "p2" | null>(
    null,
  );

  const handleCheck = async () => {
    if (!p1.name || !p1.dob || !p2.name || !p2.dob) {
      Alert.alert(
        "Required",
        "Please fill at least name and date of birth for both persons",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await api.matchmaking.create({
        userId: user?.id,
        person1Name: p1.name,
        person1Dob: p1.dob,
        person1Tob: p1.tob,
        person1Place: p1.place,
        person2Name: p2.name,
        person2Dob: p2.dob,
        person2Tob: p2.tob,
        person2Place: p2.place,
      });
      setResult(res);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Failed to check compatibility",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <Text
        style={[
          typography.body,
          { marginBottom: 20, color: colors.textSecondary },
        ]}
      >
        Check compatibility between two people
      </Text>

      <Text
        style={[
          typography.sectionTitle,
          { marginTop: 16, marginBottom: 12, color: colors.textPrimary },
        ]}
      >
        Person 1
      </Text>
      <Input
        label="Name"
        value={p1.name}
        onChange={(v: string) => setP1({ ...p1, name: v })}
        placeholder="Full name"
      />
      <TouchableOpacity
        onPress={() => setShowDatePicker("p1")}
        style={{ marginBottom: 14 }}
      >
        <Text
          style={[
            typography.label,
            { marginBottom: 6, color: colors.textSecondary },
          ]}
        >
          Date of Birth
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceLight,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            height: 48,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text
            style={{
              color: p1.dob ? colors.textPrimary : colors.textMuted,
              fontSize: 15,
              marginLeft: 8,
              flex: 1,
            }}
          >
            {p1.dob || "Select date"}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ marginBottom: 14 }}>
        <TimePicker
          label="Time of Birth"
          value={p1.tob}
          onChange={(t) => setP1({ ...p1, tob: t })}
        />
      </View>
      <Input
        label="Place of Birth"
        value={p1.place}
        onChange={(v: string) => setP1({ ...p1, place: v })}
        placeholder="e.g. Jaipur"
      />

      <Text
        style={[
          typography.sectionTitle,
          { marginTop: 24, marginBottom: 12, color: colors.textPrimary },
        ]}
      >
        Person 2
      </Text>
      <Input
        label="Name"
        value={p2.name}
        onChange={(v: string) => setP2({ ...p2, name: v })}
        placeholder="Full name"
      />
      <TouchableOpacity
        onPress={() => setShowDatePicker("p2")}
        style={{ marginBottom: 14 }}
      >
        <Text
          style={[
            typography.label,
            { marginBottom: 6, color: colors.textSecondary },
          ]}
        >
          Date of Birth
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceLight,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            height: 48,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text
            style={{
              color: p2.dob ? colors.textPrimary : colors.textMuted,
              fontSize: 15,
              marginLeft: 8,
              flex: 1,
            }}
          >
            {p2.dob || "Select date"}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ marginBottom: 14 }}>
        <TimePicker
          label="Time of Birth"
          value={p2.tob}
          onChange={(t) => setP2({ ...p2, tob: t })}
        />
      </View>
      <Input
        label="Place of Birth"
        value={p2.place}
        onChange={(v: string) => setP2({ ...p2, place: v })}
        placeholder="e.g. Jaipur"
      />

      <DatePicker
        visible={showDatePicker === "p1"}
        value={p1.dob}
        onClose={() => setShowDatePicker(null)}
        onSelect={(d) => {
          setP1({ ...p1, dob: d });
          setShowDatePicker(null);
        }}
      />
      <DatePicker
        visible={showDatePicker === "p2"}
        value={p2.dob}
        onClose={() => setShowDatePicker(null)}
        onSelect={(d) => {
          setP2({ ...p2, dob: d });
          setShowDatePicker(null);
        }}
      />

      <GradientButton
        title={loading ? "Checking..." : "Check Compatibility"}
        onPress={handleCheck}
        disabled={loading}
      />
      <View style={{ height: 40 }} />
      {result && <MatchmakingReport result={result} />}
    </ScreenWrapper>
  );
}

// Shop
export function ShopScreen({ navigation }: any) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ product: ShopProduct; qty: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  useEffect(() => {
    if (isFocused) {
      api.shop
        .list()
        .then(setProducts)
        .finally(() => setLoading(false));
    }
  }, [isFocused]);

  const addToCart = (product: ShopProduct) => {
    if (product.stock != null && product.stock <= 0) {
      Alert.alert("Out of Stock", `${product.name} is currently unavailable.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing)
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { product, qty: 1 }];
    });
    Alert.alert("Added", `${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (s, c) => s + Number(c.product.price) * c.qty,
    0,
  );

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      const order = await api.orders.create({
        userId: user?.id,
        totalAmount: cartTotal,
      });
      for (const item of cart) {
        await api.orders.addItem(order.id, {
          productId: item.product.id,
          quantity: item.qty,
          unitPrice: item.product.price,
          totalPrice: String(Number(item.product.price) * item.qty),
        });
      }
      setCart([]);
      setShowCart(false);
      Alert.alert(
        "Order Placed",
        `Order #${order.id.slice(0, 8).toUpperCase()} created successfully! You can track it in Order History.`,
        [
          { text: "View Order History", onPress: () => navigation?.navigate("OrderHistory") },
          { text: "OK", style: "cancel" },
        ],
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Failed to place order",
      );
    } finally {
      setOrdering(false);
    }
  };

  if (loading)
    return (
      <ScreenWrapper scroll>
        <SkeletonLoader height={180} />
      </ScreenWrapper>
    );
  return (
    <ScreenWrapper scroll>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => setShowCart(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            padding: 8,
          }}
        >
          <Ionicons name="cart" size={24} color={colors.accentGold} />
          {cart.length > 0 && (
            <View
              style={{
                backgroundColor: colors.danger,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {cart.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ flex: 0.5, margin: 6 }}
            activeOpacity={0.8}
            onPress={() => setSelectedProduct(item)}
          >
            <GlassCard style={{ padding: 12 }}>
              <View
                style={{
                  height: 120,
                  backgroundColor: colors.surfaceLight,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                {item.images?.[0] ? (
                  <Image
                    source={{ uri: resolveMediaUrl(item.images[0]) }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="diamond-outline"
                    size={40}
                    color={colors.primaryLight}
                  />
                )}
              </View>
              <Text style={typography.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={typography.price}>₹{item.price}</Text>
              <GradientButton
                title="Add to Cart"
                onPress={() => addToCart(item)}
                small
                style={{ marginTop: 8 }}
              />
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Ionicons
                name="cart-outline"
                size={48}
                color={colors.textMuted}
              />
            }
            title="No products yet"
          />
        }
      />
      <CustomModal
        visible={showCart}
        onClose={() => setShowCart(false)}
        title="Your Cart"
      >
        <View style={{ padding: 16, gap: 12 }}>
          {cart.length === 0 ? (
            <Text
              style={[
                typography.body,
                { textAlign: "center", color: colors.textMuted },
              ]}
            >
              Cart is empty
            </Text>
          ) : (
            cart.map((c) => (
              <View
                key={c.product.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {c.product.images?.[0] ? (
                  <Image
                    source={{ uri: resolveMediaUrl(c.product.images[0]) }}
                    style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceLight }}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { fontWeight: "600" }]}>
                    {c.product.name} x{c.qty}
                  </Text>
                  <Text style={typography.caption}>
                    ₹{Number(c.product.price) * c.qty}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(c.product.id)}>
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
          {cart.length > 0 && (
            <>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                  paddingTop: 8,
                }}
              >
                <Text style={[typography.cardTitle]}>Total: ₹{cartTotal}</Text>
              </View>
              <GradientButton
                title={ordering ? "Placing Order..." : "Place Order"}
                onPress={handlePlaceOrder}
                disabled={ordering}
              />
            </>
          )}
        </View>
      </CustomModal>
      <CustomModal
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || "Product Details"}
      >
        {selectedProduct && (
          <View style={{ padding: 16, gap: 12 }}>
            <View
              style={{
                height: 200,
                backgroundColor: colors.surfaceLight,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {selectedProduct.images?.[0] ? (
                <Image
                  source={{ uri: resolveMediaUrl(selectedProduct.images[0]) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="diamond-outline" size={64} color={colors.primaryLight} />
              )}
            </View>
            <Text style={[typography.sectionTitle]}>{selectedProduct.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={[typography.price, { fontSize: 22 }]}>
                ₹{selectedProduct.price}
              </Text>
              {selectedProduct.comparePrice &&
                Number(selectedProduct.comparePrice) > Number(selectedProduct.price) && (
                  <Text
                    style={[
                      typography.caption,
                      { textDecorationLine: "line-through", color: colors.textMuted },
                    ]}
                  >
                    ₹{selectedProduct.comparePrice}
                  </Text>
                )}
            </View>
            <Text
              style={[
                typography.caption,
                { color: selectedProduct.stock > 0 ? colors.success : colors.danger },
              ]}
            >
              {selectedProduct.stock > 0
                ? `In stock${selectedProduct.stock ? ` (${selectedProduct.stock} available)` : ""}`
                : "Out of stock"}
            </Text>
            {selectedProduct.description ? (
              <Text style={[typography.body, { lineHeight: 22, color: colors.textSecondary }]}>
                {selectedProduct.description}
              </Text>
            ) : (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                No description available for this product.
              </Text>
            )}
            <GradientButton
              title={selectedProduct.stock > 0 ? "Add to Cart" : "Out of Stock"}
              disabled={selectedProduct.stock <= 0}
              onPress={() => {
                addToCart(selectedProduct);
                setSelectedProduct(null);
              }}
            />
          </View>
        )}
      </CustomModal>
    </ScreenWrapper>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={[
          typography.label,
          { marginBottom: 6, color: colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceLight,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          paddingHorizontal: 14,
          height: 48,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: 15,
            paddingRight: 8,
          }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show}
        />
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.textMuted}
          onPress={() => setShow(!show)}
        />
      </View>
    </View>
  );
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "Not set";
  try {
    const clean = String(dateStr).split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
        return `${months[monthIndex]} ${day}, ${year}`;
      }
    }
    return clean;
  } catch {
    return String(dateStr);
  }
}

// Profile
export function ProfileScreen({ navigation }: any) {
  const { user, role, logout, updateUser, theme, setTheme } = useAuth();
  const isFocused = useIsFocused();
  const isDark = theme === "dark";

  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const cardLightBg = isDark ? "#1F2937" : "#FFFBEB";
  const cardBorderColor = isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A";
  const textPrimaryColor = isDark ? "#F9FAFB" : "#7F1D1D";
  const textSecondaryColor = isDark ? "#E5E7EB" : "#1F2937";
  const mutedTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const goldTextColor = isDark ? "#FBBF24" : "#D97706";
  const iconBgColor = isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7";
  const rowBorderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#F3F4F6";

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    if (user?.id) {
      try {
        const freshUser = await api.users.get(user.id);
        if (freshUser) {
          await updateUser(freshUser);
        }
      } catch {}
    }
    try {
      const w = await api.wallet.get();
      if (w) setWallet(w);
    } catch {}
  };

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const items = [
    {
      icon: "flame-outline",
      label: "My Puja Bookings",
      route: "MandirPooja",
      category: "Account",
      params: { initialTab: "bookings" },
    },
    {
      icon: "gift-outline",
      label: "Gifts",
      route: "Gifts",
      category: "Account",
    },
    {
      icon: "receipt-outline",
      label: "Order History",
      route: "OrderHistory",
      category: "Account",
    },
    {
      icon: "wallet-outline",
      label: "Transaction History",
      route: "Wallet",
      category: "Account",
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      route: "Notifications",
      category: "Account",
    },
    {
      icon: "newspaper-outline",
      label: "Blogs & Articles",
      route: "Blogs",
      category: "Preferences",
    },
    {
      icon: "newspaper",
      label: "News",
      route: "News",
      category: "Preferences",
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      route: "Support",
      category: "Preferences",
    },
    {
      icon: "flag-outline",
      label: "My Reports",
      route: "MyReports",
      category: "Preferences",
    },
  ];

  if (role === "admin") {
    items.push({
      icon: "shield-checkmark-outline",
      label: "Manage Support Tickets",
      route: "AdminSupport",
      category: "Admin",
    });
  }

  const toggleTheme = async (val: boolean) => {
    const newTheme = val ? "dark" : "light";
    try {
      await setTheme(newTheme);
    } catch (e) {
      console.log(e);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New password and confirm password do not match.");
      return;
    }
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      await api.users.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwSuccess("Password changed successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err: any) {
      setPwError(
        err.response?.data?.message ||
          "Failed to change password. Make sure current password is correct.",
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteOpen(true);
  };

  return (
    <ScreenWrapper
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={goldTextColor}
          colors={[goldTextColor]}
        />
      }
    >
      <View style={{ paddingBottom: 120 }}>
        {/* Hero Header Card */}
        <View
          style={[
            styles.profileHeroCard,
            { backgroundColor: cardLightBg, borderColor: cardBorderColor },
          ]}
        >
          <View style={{ position: "relative" }}>
            <View
              style={[
                styles.avatarRing,
                { backgroundColor: cardBg, borderColor: "#F59E0B" },
              ]}
            >
              <Avatar size={76} uri={user?.avatar} />
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
            </View>
          </View>

          <Text style={[styles.profileName, { color: textPrimaryColor }]}>
            {user?.name || "User Profile"}
          </Text>

          <View
            style={[
              styles.emailPill,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <Ionicons name="mail" size={13} color={goldTextColor} />
            <Text style={[styles.emailPillText, { color: goldTextColor }]}>
              {user?.email || "user@astroshine.com"}
            </Text>
          </View>

          {/* Quick Stats Bar */}
          <View
            style={[
              styles.profileStatsRow,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate("Wallet")}
              style={styles.profileStatCol}
            >
              <Text style={[styles.profileStatVal, { color: goldTextColor }]}>
                ₹{wallet?.balance || "0"}
              </Text>
              <Text style={[styles.profileStatLab, { color: mutedTextColor }]}>
                Wallet
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.profileStatDiv,
                { backgroundColor: rowBorderColor },
              ]}
            />
            <View style={styles.profileStatCol}>
              <Text style={[styles.profileStatVal, { color: goldTextColor }]}>
                Active
              </Text>
              <Text style={[styles.profileStatLab, { color: mutedTextColor }]}>
                Status
              </Text>
            </View>
          </View>
        </View>

        {/* Main Options Cards */}
        <View style={{ gap: 14, marginTop: 16 }}>
          {/* Profile Details */}
          <View
            style={[
              styles.menuGroupCard,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={[styles.groupHeaderTitle, { color: goldTextColor, marginBottom: 0 }]}>
                PROFILE DETAILS
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="create-outline" size={15} color={goldTextColor} />
                <Text style={{ color: goldTextColor, fontSize: 13, fontWeight: "600" }}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.menuRowItem, styles.menuRowBorder, { borderBottomColor: rowBorderColor }]}>
              <Ionicons name="person-outline" size={18} color={goldTextColor} style={{ marginRight: 10 }} />
              <Text style={[styles.menuRowLabel, { color: textSecondaryColor, flex: 1 }]}>Name</Text>
              <Text style={{ color: user?.name ? textPrimaryColor : mutedTextColor, fontSize: 13, fontWeight: user?.name ? "600" : "400" }}>{user?.name || "Not set"}</Text>
            </View>
            <View style={[styles.menuRowItem, styles.menuRowBorder, { borderBottomColor: rowBorderColor }]}>
              <Ionicons name="mail-outline" size={18} color={goldTextColor} style={{ marginRight: 10 }} />
              <Text style={[styles.menuRowLabel, { color: textSecondaryColor, flex: 1 }]}>Email</Text>
              <Text style={{ color: user?.email ? textPrimaryColor : mutedTextColor, fontSize: 13, fontWeight: user?.email ? "600" : "400" }}>{user?.email || "Not set"}</Text>
            </View>
            <View style={[styles.menuRowItem, styles.menuRowBorder, { borderBottomColor: rowBorderColor }]}>
              <Ionicons name="call-outline" size={18} color={goldTextColor} style={{ marginRight: 10 }} />
              <Text style={[styles.menuRowLabel, { color: textSecondaryColor, flex: 1 }]}>Phone</Text>
              <Text style={{ color: user?.phone ? textPrimaryColor : mutedTextColor, fontSize: 13, fontWeight: user?.phone ? "600" : "400" }}>{user?.phone || "Not set"}</Text>
            </View>
            <View style={[styles.menuRowItem, styles.menuRowBorder, { borderBottomColor: rowBorderColor }]}>
              <Ionicons name="male-female-outline" size={18} color={goldTextColor} style={{ marginRight: 10 }} />
              <Text style={[styles.menuRowLabel, { color: textSecondaryColor, flex: 1 }]}>Gender</Text>
              <Text style={{ color: (user as any)?.gender ? textPrimaryColor : mutedTextColor, fontSize: 13, fontWeight: (user as any)?.gender ? "600" : "400" }}>{(user as any)?.gender ? String((user as any).gender).charAt(0).toUpperCase() + String((user as any).gender).slice(1) : "Not set"}</Text>
            </View>
            <View style={styles.menuRowItem}>
              <Ionicons name="calendar-outline" size={18} color={goldTextColor} style={{ marginRight: 10 }} />
              <Text style={[styles.menuRowLabel, { color: textSecondaryColor, flex: 1 }]}>Date of Birth</Text>
              <Text style={{ color: (user as any)?.dateOfBirth ? textPrimaryColor : mutedTextColor, fontSize: 13, fontWeight: (user as any)?.dateOfBirth ? "600" : "400" }}>{formatDisplayDate((user as any)?.dateOfBirth)}</Text>
            </View>
          </View>

          {/* Account Group */}
          <View
            style={[
              styles.menuGroupCard,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <Text style={[styles.groupHeaderTitle, { color: goldTextColor }]}>
              MY ACCOUNT
            </Text>
            {items
              .filter((it) => it.category === "Account")
              .map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => navigation.navigate(item.route, (item as any).params)}
                  style={[
                    styles.menuRowItem,
                    { borderBottomColor: rowBorderColor },
                    i < arr.length - 1 && styles.menuRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.menuItemIconBg,
                      { backgroundColor: iconBgColor },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={goldTextColor}
                    />
                  </View>
                  <Text
                    style={[styles.menuRowLabel, { color: textSecondaryColor }]}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
          </View>

          {/* Preferences & Security Group */}
          <View
            style={[
              styles.menuGroupCard,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <Text style={[styles.groupHeaderTitle, { color: goldTextColor }]}>
              PREFERENCES & SECURITY
            </Text>

            {/* Dark Mode Toggle Item */}
            <View
              style={[
                styles.menuRowItem,
                styles.menuRowBorder,
                { borderBottomColor: rowBorderColor },
              ]}
            >
              <View
                style={[
                  styles.menuItemIconBg,
                  { backgroundColor: iconBgColor },
                ]}
              >
                <Ionicons name="moon-outline" size={20} color={goldTextColor} />
              </View>
              <Text
                style={[styles.menuRowLabel, { color: textSecondaryColor }]}
              >
                Dark Mode
              </Text>
              <Toggle
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: "#D1D5DB", true: "#7F1D1D" }}
              />
            </View>

            {/* Change Password Item */}
            <TouchableOpacity
              onPress={() => setPwOpen(true)}
              style={[
                styles.menuRowItem,
                styles.menuRowBorder,
                { borderBottomColor: rowBorderColor },
              ]}
            >
              <View
                style={[
                  styles.menuItemIconBg,
                  { backgroundColor: iconBgColor },
                ]}
              >
                <Ionicons name="key-outline" size={20} color={goldTextColor} />
              </View>
              <Text
                style={[styles.menuRowLabel, { color: textSecondaryColor }]}
              >
                Change Password
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {items
              .filter((it) => it.category === "Preferences")
              .map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => navigation.navigate(item.route, (item as any).params)}
                  style={[
                    styles.menuRowItem,
                    { borderBottomColor: rowBorderColor },
                    i < arr.length - 1 && styles.menuRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.menuItemIconBg,
                      { backgroundColor: iconBgColor },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={goldTextColor}
                    />
                  </View>
                  <Text
                    style={[styles.menuRowLabel, { color: textSecondaryColor }]}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
          </View>

          {/* Danger Zone Group */}
          <View
            style={[
              styles.menuGroupCard,
              { backgroundColor: cardBg, borderColor: cardBorderColor },
            ]}
          >
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={styles.menuRowItem}
            >
              <View
                style={[
                  styles.menuItemIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(220, 38, 38, 0.2)"
                      : "#FEE2E2",
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.menuRowLabel, { color: "#DC2626" }]}>
                Delete Account
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.premiumLogoutBtn,
            {
              backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "#FEF2F2",
              borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "#FECACA",
            },
          ]}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={isDark ? "#F87171" : "#DC2626"}
          />
          <Text
            style={{
              color: isDark ? "#F87171" : "#DC2626",
              fontSize: 15,
              fontWeight: "700",
              marginLeft: 8,
            }}
          >
            Log Out
          </Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change Password"
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
          {pwError ? (
            <Text
              style={{ color: colors.danger, fontSize: 14, marginBottom: 10 }}
            >
              {pwError}
            </Text>
          ) : null}
          {pwSuccess ? (
            <Text style={{ color: "#22c55e", fontSize: 14, marginBottom: 10 }}>
              {pwSuccess}
            </Text>
          ) : null}
          <PasswordInput
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="Enter current password"
          />
          <PasswordInput
            label="New Password"
            value={newPw}
            onChange={setNewPw}
            placeholder="Enter new password"
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="Confirm new password"
          />
          <GradientButton
            title={pwLoading ? "Changing..." : "Change Password"}
            onPress={handlePasswordChange}
            disabled={pwLoading}
            style={{ marginTop: 8 }}
          />
        </View>
      </CustomModal>

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete Account"
        subtitle="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        actions={[
          {
            label: "Cancel",
            variant: "secondary",
            onPress: () => setDeleteOpen(false),
          },
          {
            label: "Delete",
            variant: "danger",
            onPress: async () => {
              setDeleteOpen(false);
              try {
                await api.users.delete(user!.id);
                await logout();
              } catch {}
            },
          },
        ]}
        onClose={() => setDeleteOpen(false)}
      />
    </ScreenWrapper>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ alignItems: "center", gap: 6 }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={24} color={colors.primaryLight} />
      </View>
      <Text style={typography.caption}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{ fontSize: 18, fontWeight: "700", color: colors.primaryLight }}
      >
        {value}
      </Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

function Input({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  [key: string]: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[typography.label, { marginBottom: 6 }]}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: colors.surfaceLight,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          paddingHorizontal: 14,
          height: 48,
          color: colors.textPrimary,
          fontSize: 15,
        }}
        value={value}
        onChangeText={onChange}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  planetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  astroCard: { width: 140, marginRight: 12 },
  astroInner: { alignItems: "center", paddingVertical: 16, gap: 6 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  row: { flexDirection: "row", alignItems: "center" },
  header: { alignItems: "center", marginTop: 16 },
  balanceCard: { alignItems: "center", padding: 24 },
  balance: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.accentGold,
    marginTop: 4,
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    padding: 16,
    marginBottom: 100,
  },
  dropdownContainer: {
    position: "absolute",
    top: 68,
    left: 36,
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 2000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  zodiacChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  goodMorningBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  zodiacCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  zodiacCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.accentGold,
  },
  zodiacCircleInactive: {
    borderColor: colors.cardBorder,
  },
  horoscopeCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  readFullBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  luckyGrid: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  luckyCol: {
    alignItems: "center",
  },
  luckyDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  subTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  subTabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 16,
    gap: 4,
  },
  subTabDivider: {
    width: 0,
    height: 0,
  },
  panchangContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  panchangHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.accentGold,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  panchangContent: {
    padding: 12,
  },
  panchangItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "48%",
    marginBottom: 8,
  },
  pastelCard: {
    width: "23%",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pastelCardText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  gridActionItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 12,
  },
  gridActionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  gridActionText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  specialBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bookNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  profileHeroCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 8,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: colors.accentGold,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#16A34A",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 10,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 6,
  },
  emailPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryLight,
  },
  profileStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  profileStatCol: {
    flex: 1,
    alignItems: "center",
  },
  profileStatVal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  profileStatLab: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 2,
  },
  profileStatDiv: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  menuGroupCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  groupHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuItemIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  premiumLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: 80,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
  },
  astroRowCard: {
    width: 338,
    marginRight: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  astroCardAvatarWrap: {
    position: "relative",
    alignItems: "center",
    marginBottom: 6,
  },
  astroAvatarGoldRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#F59E0B",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  astroAvatarImg: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  onlinePill: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export { MuhuratScreen } from "./MuhuratScreen";
export { GiftScreen } from "./GiftScreen";
