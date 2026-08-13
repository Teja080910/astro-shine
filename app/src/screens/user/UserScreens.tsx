import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
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
} from "../../shared";
import { api } from "../../shared/api-client";
import type {
  Astrologer,
  Blog,
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
  { sign: "aries", emoji: "♈", label: "Aries" },
  { sign: "taurus", emoji: "♉", label: "Taurus" },
  { sign: "gemini", emoji: "♊", label: "Gemini" },
  { sign: "cancer", emoji: "♋", label: "Cancer" },
  { sign: "leo", emoji: "♌", label: "Leo" },
  { sign: "virgo", emoji: "♍", label: "Virgo" },
  { sign: "libra", emoji: "♎", label: "Libra" },
  { sign: "scorpio", emoji: "♏", label: "Scorpio" },
  { sign: "sagittarius", emoji: "♐", label: "Sagittarius" },
  { sign: "capricorn", emoji: "♑", label: "Capricorn" },
  { sign: "aquarius", emoji: "♒", label: "Aquarius" },
  { sign: "pisces", emoji: "♓", label: "Pisces" },
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
) {
  const wsStatus = astrologerStatuses[astro.userId];
  if (wsStatus) return wsStatus === "online";
  return astro.onlineStatus === "online";
}

// User Home Dashboard
export function UserHomeScreen({ navigation }: any) {
  const { user, theme, setTheme } = useAuth();
  const { astrologerStatuses, horoscopeVersion, blogVersion, notificationVersion, walletVersion } = useChat();
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
  const [horoscope, setHoroscope] = useState<HoroscopeRecord[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [poojas, setPoojas] = useState<MandirPooja[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedSign, setSelectedSign] = useState("aries");
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
    try {
      const [a, h, v, b, p, n, w, favs] = await Promise.all([
        api.astrologers.list(),
        api.horoscope.bySign(selectedSign, todayStr),
        api.videos.list(),
        api.blogs.list(),
        api.mandirPooja.list(),
        api.notifications.list({ userId: user?.id }),
        api.wallet.get().catch(() => null),
        api.favorites.list().catch(() => []),
      ]);
      setAstrologers(a);
      setHoroscope(Array.isArray(h) ? h : [h]);
      setVideos(v);
      setBlogs(b);
      setPoojas(p);
      setNotifications(n);
      setWallet(w);
      setFavoriteAstrologers(favs);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedSign, todayStr, horoscopeVersion, blogVersion, notificationVersion, walletVersion]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

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
  }, [todayStr]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const fetchHoroscope = async (sign: string) => {
    setHoroscopeLoading(true);
    try {
      const h = await api.horoscope.bySign(sign, todayStr);
      setHoroscope(Array.isArray(h) ? h : [h]);
    } catch {
    } finally {
      setHoroscopeLoading(false);
    }
  };

  const handleSignSelect = (sign: string) => {
    setSelectedSign(sign);
    if (sign !== selectedSign) fetchHoroscope(sign);
  };

  const filteredCategoryAstro =
    selectedCategory === "All"
      ? astrologers
      : astrologers.filter((a) =>
          a.specialization?.some(
            (s) => s.toLowerCase() === selectedCategory.toLowerCase(),
          ),
        );

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
                  color: isDark ? "#FBBF24" : "#D97706",
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
              backgroundColor: cardLightBg,
              borderColor: cardBorderColor,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, color: mutedTextColor, fontWeight: "500" }}
            >
              Namaste, 👋
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: titleColor,
                marginVertical: 2,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {user?.name || "Aarav Sharma"}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Wallet")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              <Ionicons name="wallet-outline" size={14} color={goldTextColor} />
              <Text
                style={{
                  fontSize: 11,
                  color: goldTextColor,
                  fontWeight: "700",
                }}
              >
                ₹{wallet?.balance || "0"}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 3,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: bodyTextColor,
                  fontWeight: "500",
                }}
              >
                {formatDate(new Date())}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 3,
              }}
            >
              <Ionicons
                name="location-outline"
                size={13}
                color={mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: bodyTextColor,
                  fontWeight: "500",
                }}
              >
                {location
                  ? `${location.city}, ${location.region}`
                  : "Jaipur, Rajasthan"}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: 85,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={require("../../../assets/ganesha_header.png")}
              style={{ width: 85, height: 95 }}
              resizeMode="contain"
            />
          </View>

          <View
            style={{
              flex: 1,
              alignItems: "flex-end",
              justifyContent: "space-between",
              alignSelf: "stretch",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="sunny" size={24} color="#F59E0B" />
              <View>
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: titleColor }}
                >
                  {weather?.temp || (weatherLoading ? "--" : "28°C")}
                </Text>
                <Text style={{ fontSize: 11, color: mutedTextColor }}>
                  {weather?.condition || (weatherLoading ? "--" : "Sunny")}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.goodMorningBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.15)"
                    : "#FEF3C7",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FCD34D",
                },
              ]}
            >
              <Ionicons name={greeting.icon} size={12} color={goldTextColor} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: goldTextColor,
                }}
              >
                {greeting.text}
              </Text>
            </View>
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
                          backgroundColor: "#D97706",
                          borderColor: "#F59E0B",
                          borderRadius: 24,
                          overflow: "hidden",
                        }
                      : {
                          backgroundColor: cardLightBg,
                          borderColor: cardBorderColor,
                          borderRadius: 24,
                          overflow: "hidden",
                        },
                  ]}
                >
                  <Image
                    source={zodiacImages[z.sign]}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? "700" : "500",
                    color: active ? titleColor : bodyTextColor,
                    marginTop: 4,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {z.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Zodiac Horoscope Detailed Card */}
        <View
          style={[
            styles.horoscopeCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorderColor,
              borderRadius: 20,
              overflow: "hidden",
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <Image
              source={zodiacImages[selectedSign]}
              style={{ width: 60, height: 60, borderRadius: 30 }}
            />
            <View style={{ flex: 1, minWidth: 160 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: titleColor }}
                >
                  {ZODIAC_SIGNS.find((z) => z.sign === selectedSign)?.label ||
                    "Aries"}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isDark ? "#F59E0B" : "#EA580C",
                  }}
                >
                  (Mar 21 – Apr 19)
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: bodyTextColor,
                  lineHeight: 17,
                  marginVertical: 6,
                }}
              >
                {horoscope[0]?.[
                  activeHoroscopeTab === "love" ? "lovePrediction" :
                  activeHoroscopeTab === "career" ? "careerPrediction" :
                  activeHoroscopeTab === "finance" ? "financePrediction" :
                  activeHoroscopeTab === "health" ? "healthPrediction" :
                  "prediction"
                ] || horoscope[0]?.prediction ||
                  "Today brings new opportunities in your career. Stay open to unexpected changes. Your confidence will help you achieve important goals."}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Horoscope")}
                style={[
                  styles.readFullBtn,
                  {
                    backgroundColor: "#D97706",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}
                >
                  Read Full Horoscope
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lucky Stats Row */}
          <View
            style={[
              styles.luckyGrid,
              {
                backgroundColor: cardLightBg,
                borderColor: cardBorderColor,
                borderRadius: 12,
                overflow: "hidden",
              },
            ]}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <View
                style={[styles.luckyCol, { width: "33%", paddingVertical: 6 }]}
              >
                <Text style={{ fontSize: 9, color: mutedTextColor }}>
                  Lucky Number
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: titleColor,
                    marginTop: 2,
                  }}
                >
                  {horoscope[0]?.luckyNumber || "7"}
                </Text>
              </View>
              <View
                style={[styles.luckyCol, { width: "33%", paddingVertical: 6 }]}
              >
                <Text style={{ fontSize: 9, color: mutedTextColor }}>
                  Lucky Color
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#FBBF24",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: titleColor,
                    }}
                    numberOfLines={1}
                  >
                    {horoscope[0]?.luckyColor || "Yellow"}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.luckyCol, { width: "34%", paddingVertical: 6 }]}
              >
                <Text style={{ fontSize: 9, color: mutedTextColor }}>
                  Lucky Time
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: titleColor,
                    marginTop: 2,
                  }}
                >
                  10:30 AM – 12:00 PM
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "#FDE68A",
              }}
            >
              <View
                style={[styles.luckyCol, { width: "50%", paddingVertical: 6 }]}
              >
                <Text style={{ fontSize: 9, color: mutedTextColor }}>
                  Lucky Direction
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: titleColor,
                    marginTop: 2,
                  }}
                >
                  🧭 North
                </Text>
              </View>
              <View
                style={[
                  styles.luckyCol,
                  {
                    width: "50%",
                    paddingVertical: 6,
                    borderLeftWidth: 1,
                    borderLeftColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "#FDE68A",
                  },
                ]}
              >
                <Text style={{ fontSize: 9, color: mutedTextColor }}>
                  Lucky Alphabet
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: titleColor,
                    marginTop: 2,
                  }}
                >
                  A
                </Text>
              </View>
            </View>
          </View>

          {/* Sub-tabs Row */}
          <View
            style={[
              styles.subTabsRow,
              {
                borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "#FDE68A",
                justifyContent: "center",
                paddingHorizontal: 4,
                gap: 6,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("love")}
              style={[
                styles.subTabItem,
                activeHoroscopeTab === "love" && {
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
                },
              ]}
            >
              <Ionicons
                name="heart"
                size={14}
                color={activeHoroscopeTab === "love" ? "#EF4444" : mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "love" ? "700" : "600",
                  color:
                    activeHoroscopeTab === "love"
                      ? isDark
                        ? "#EF4444"
                        : "#B91C1C"
                      : bodyTextColor,
                }}
              >
                Love
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("career")}
              style={[
                styles.subTabItem,
                activeHoroscopeTab === "career" && {
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#DBEAFE",
                },
              ]}
            >
              <Ionicons
                name="briefcase"
                size={14}
                color={activeHoroscopeTab === "career" ? "#3B82F6" : mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "career" ? "700" : "600",
                  color:
                    activeHoroscopeTab === "career"
                      ? isDark
                        ? "#3B82F6"
                        : "#1D4ED8"
                      : bodyTextColor,
                }}
              >
                Career
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("finance")}
              style={[
                styles.subTabItem,
                activeHoroscopeTab === "finance" && {
                  backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "#D1FAE5",
                },
              ]}
            >
              <Ionicons
                name="cash"
                size={14}
                color={activeHoroscopeTab === "finance" ? "#16A34A" : mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "finance" ? "700" : "600",
                  color:
                    activeHoroscopeTab === "finance"
                      ? isDark
                        ? "#16A34A"
                        : "#15803D"
                      : bodyTextColor,
                }}
              >
                Finance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveHoroscopeTab("health")}
              style={[
                styles.subTabItem,
                activeHoroscopeTab === "health" && {
                  backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "#F5F3FF",
                },
              ]}
            >
              <Ionicons
                name="pulse"
                size={14}
                color={activeHoroscopeTab === "health" ? "#8B5CF6" : mutedTextColor}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeHoroscopeTab === "health" ? "700" : "600",
                  color:
                    activeHoroscopeTab === "health"
                      ? isDark
                        ? "#8B5CF6"
                        : "#6D28D9"
                      : bodyTextColor,
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
              borderColor: cardBorderColor,
              borderRadius: 16,
              overflow: "hidden",
            },
          ]}
        >
          <View
            style={[
              styles.panchangHeaderBanner,
              { backgroundColor: "#D97706" },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="calendar-sharp" size={16} color="#F59E0B" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFF" }}>
                Today's Panchang
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Panchang")}>
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: "#FDE68A" }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.panchangContent, { backgroundColor: cardLightBg }]}
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
                  color={goldTextColor}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Tithi
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: titleColor,
                    }}
                    numberOfLines={1}
                  >
                    {panchangData?.tithi || "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.panchangItem}>
                <Ionicons name="star-outline" size={16} color={goldTextColor} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Nakshatra
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: titleColor,
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
                  color={goldTextColor}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Yoga
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: titleColor,
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
                  color={goldTextColor}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9, color: mutedTextColor }}>
                    Karan
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: titleColor,
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
                      color: titleColor,
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
                      color: titleColor,
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
                      color: titleColor,
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
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: titleColor,
              marginBottom: 12,
            }}
          >
            Quick Actions
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate("Kundli")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.15)"
                      : "#FEF3C7",
                    borderColor: cardBorderColor,
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="planet" size={22} color={goldTextColor} />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Kundli
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Matchmaking")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(220, 38, 38, 0.15)"
                      : "#FEE2E2",
                    borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "#FECACA",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="heart" size={22} color="#DC2626" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Matchmaking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Panchang")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(234, 88, 12, 0.15)"
                      : "#FFEDD5",
                    borderColor: isDark ? "rgba(234, 88, 12, 0.3)" : "#FDBA74",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="calendar" size={22} color="#EA580C" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Panchang
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("MandirPooja")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.15)"
                      : "#FEF3C7",
                    borderColor: cardBorderColor,
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="flame" size={22} color={goldTextColor} />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Pooja
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Shop")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(202, 138, 4, 0.15)"
                      : "#FEF9C3",
                    borderColor: isDark ? "rgba(202, 138, 4, 0.3)" : "#FDE047",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="bag-handle" size={22} color="#CA8A04" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Shop
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Astrologers")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(234, 88, 12, 0.15)"
                      : "#FFEDD5",
                    borderColor: isDark ? "rgba(234, 88, 12, 0.3)" : "#FDBA74",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="people" size={22} color="#EA580C" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Live Astrologers
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              onPress={() => navigation.navigate("Blogs")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(202, 138, 4, 0.15)"
                      : "#FEF9C3",
                    borderColor: isDark ? "rgba(202, 138, 4, 0.3)" : "#FDE047",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="document-text" size={22} color="#CA8A04" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
                Blogs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Videos")}
              style={styles.gridActionItem}
            >
              <View
                style={[
                  styles.gridActionIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(234, 88, 12, 0.15)"
                      : "#FFEDD5",
                    borderColor: isDark ? "rgba(234, 88, 12, 0.3)" : "#FDBA74",
                    borderRadius: 16,
                    overflow: "hidden",
                  },
                ]}
              >
                <Ionicons name="play-circle" size={22} color="#EA580C" />
              </View>
              <Text style={[styles.gridActionText, { color: bodyTextColor }]}>
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
              : ["#FFF5F5", "#FFFBEB"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.specialBanner,
            {
              borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "#FDE68A",
              flexDirection: "row",
              alignItems: "center",
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
              style={{ fontSize: 15, fontWeight: "800", color: titleColor }}
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
                  backgroundColor: "#D97706",
                  alignSelf: "flex-start",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>
                Book Now ›
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

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
                const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses);
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
        {astrologers.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={astrologers
              .filter((a) => getAstrologerOnlineStatus(a, astrologerStatuses))
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
                    online={getAstrologerOnlineStatus(item, astrologerStatuses)}
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
                    online={getAstrologerOnlineStatus(item, astrologerStatuses)}
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
              renderItem={({ item }) => (
                <TouchableOpacity style={{ width: 220, marginRight: 12 }}>
                  <GlassCard style={{ padding: 0, overflow: "hidden", height: 175 }}>
                    <View
                      style={{
                        height: 110,
                        backgroundColor: colors.surfaceLight,
                        alignItems: "center",
                        justifyContent: "center",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: colors.primary + "40",
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
              )}
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
    </ScreenWrapper>
  );
}

// Astrologers List
export function AstrologerListScreen({ route, navigation }: any) {
  const { openConversation, astrologerStatuses } = useChat();
  const { initiateCall } = useCall();
  const isFocused = useIsFocused();
  const [data, setData] = useState<Astrologer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const cats = ["All", ...new Set(data.flatMap((a) => a.specialization || []).filter(Boolean))];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [balanceDialogVisible, setBalanceDialogVisible] = useState(false);
  const onlyLive = route?.params?.onlyLive ?? false;
  const onlyFavorites = route?.params?.onlyFavorites ?? false;

  const fetchData = useCallback(() => api.astrologers.list().then(setData), []);
  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
      api.wallet.get().then((w) => setWalletBalance(Number(w.balance))).catch(() => {});
    }
  }, [isFocused, fetchData]);

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
      !onlyLive || getAstrologerOnlineStatus(a, astrologerStatuses);
    const matchesFav =
      !onlyFavorites || favoriteIds.includes(a.userId);
    return matchesSearch && matchesCategory && matchesLive && matchesFav;
  });

  return (
    <ScreenWrapper noPadding>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>
          {onlyLive ? "Live Astrologers" : onlyFavorites ? "Favorite Astrologers" : "Astrologers"}
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
        }
        renderItem={({ item }) => {
          const isOnline = getAstrologerOnlineStatus(item, astrologerStatuses);
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
                  <Avatar size={56} online={isOnline} />
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
                      backgroundColor: "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="chatbubbles" size={14} color="#FFF" />
                    <Text
                      style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
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
                      backgroundColor: "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="call" size={14} color="#FFF" />
                    <Text
                      style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
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
                      backgroundColor: "#F59E0B",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="videocam" size={14} color="#FFF" />
                    <Text
                      style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}
                    >
                      Video
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
  const { openConversation, astrologerStatuses, astrologerServices, giftVersion } = useChat();
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
  const { user, theme } = useAuth();
  const isDark = theme === "dark";

  const titleColor = isDark ? "#F9FAFB" : "#1F2937";
  const bodyTextColor = isDark ? "#D1D5DB" : "#4B5563";
  const mutedTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const goldTextColor = isDark ? "#F59E0B" : "#D97706";
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const cardBorderColor = isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A";
  const cardLightBg = isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFBEB";

  useEffect(() => {
    if (isFocused) {
      api.astrologers.get(id).then(setAstro);
      api.wallet.get().then((w) => setWalletBalance(Number(w.balance))).catch(() => {});
      api.favorites.status(id).then((res) => setIsFavorite(res.isFavorite)).catch(() => {});
    }
  }, [id, isFocused]);

  useEffect(() => {
    if (giftModalVisible) {
      api.gifts.list().then((g) => setGifts(g.filter((x: any) => x.isActive))).catch(() => {});
    }
  }, [giftModalVisible, giftVersion]);
  if (!astro)
    return (
      <ScreenWrapper>
        <Text style={typography.body}>Loading...</Text>
      </ScreenWrapper>
    );

  const isVerified = astro.verificationStatus === "approved";
  const isOnline = getAstrologerOnlineStatus(astro, astrologerStatuses);

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
      value: astro.totalChats ? `${astro.totalChats}K+` : "12K+",
      label: "Chats",
      bgColor: "rgba(139, 92, 246, 0.15)"
    });
  }
  if (isAudioCallEnabled) {
    statItems.push({
      icon: "call-sharp",
      color: "#10B981",
      value: astro.totalAudioCalls ? `${astro.totalAudioCalls}K+` : "9K+",
      label: "Calls",
      bgColor: "rgba(16, 185, 129, 0.15)"
    });
  }
  if (isVideoCallEnabled) {
    statItems.push({
      icon: "videocam-sharp",
      color: "#F59E0B",
      value: astro.totalVideoCalls ? `${astro.totalVideoCalls}K+` : "5K+",
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
            <Image
              source={
                astro.avatar
                  ? { uri: astro.avatar }
                  : require("../../../assets/aries_ram.png")
              }
              style={{
                width: 110,
                height: 110,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#F59E0B",
              }}
              resizeMode="cover"
            />
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
                {astro.rating || "4.4"}
              </Text>
              <Text style={{ fontSize: 11, color: mutedTextColor }}>
                | {astro.totalReviews || "128"} Reviews
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
      </View>

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
                await api.gifts.send({ giftId: selectedGift.id, senderId: user?.id, receiverId: id });
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
export function WalletScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

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

      {txns.map((t) => (
        <GlassCard key={t.id} style={{ marginTop: 8, padding: 12 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={typography.cardTitle}>
                {t.category
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
              <Text style={typography.caption}>
                {new Date(t.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={{
                fontWeight: "700",
                color: t.type === "credit" ? colors.success : colors.danger,
              }}
            >
              {t.type === "credit" ? "+" : "-"}₹{t.amount}
            </Text>
          </View>
        </GlassCard>
      ))}
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
      {result && (
        <GlassCard style={{ marginTop: 20, padding: 16 }}>
          <Text style={[typography.cardTitle, { marginBottom: 8 }]}>
            Kundli Generated
          </Text>
          <Text style={typography.body}>Name: {result.name}</Text>
          <Text style={typography.body}>
            Date: {result.dateOfBirth?.split("T")[0]}
          </Text>
          <Text style={typography.body}>Time: {result.timeOfBirth}</Text>
          <Text style={typography.body}>Place: {result.placeOfBirth}</Text>
          {result.chartData?.planetaryPositions && (
            <View style={{ marginTop: 12 }}>
              <Text style={[typography.cardTitle, { marginBottom: 8 }]}>Planetary Positions</Text>
              {Object.entries(result.chartData.planetaryPositions).map(([name, p]: any) => (
                <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                  <Text style={[typography.body, { fontWeight: '600' }]}>{name}</Text>
                  <Text style={typography.body}>
                    {p.rashi} | {p.nakshatra?.name || ''} | {p.longitude?.toFixed(2)}°
                    {p.isRetrograde ? ' ℞' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {result.chartData?.houses && result.chartData.houses.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[typography.cardTitle, { marginBottom: 8 }]}>Houses</Text>
              <Text style={typography.body}>{result.chartData.houses.join(', ')}</Text>
            </View>
          )}
          {result.chartData?.lagna && (
            <View style={{ marginTop: 12 }}>
              <Text style={[typography.cardTitle, { marginBottom: 4 }]}>Lagna (Ascendant)</Text>
              <Text style={typography.body}>Rashi: {result.chartData.lagna.rashi} | Longitude: {result.chartData.lagna.longitude?.toFixed(2)}°</Text>
            </View>
          )}
        </GlassCard>
      )}
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
      {result && (
        <GlassCard style={{ marginTop: 20, padding: 16 }}>
          <Text style={[typography.cardTitle, { marginBottom: 8 }]}>
            Compatibility Result
          </Text>
          {result.matchScore != null && (
            <>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "800",
                  color: colors.accentGold,
                  textAlign: "center",
                }}
              >
                {result.matchScore}%
              </Text>
              <Text style={[typography.body, { textAlign: 'center', marginBottom: 12, color: colors.textSecondary }]}>
                {result.matchDetails?.compatibility || ''}
              </Text>
            </>
          )}
          {result.matchDetails?.kootas && (
            <View style={{ gap: 8 }}>
              {Object.entries(result.matchDetails.kootas).map(([key, k]: any) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { fontWeight: '600' }]}>{k.description || key}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 60, height: 6, borderRadius: 3, backgroundColor: colors.surfaceLight, overflow: 'hidden' }}>
                      <View style={{ width: `${(k.score / k.maxScore) * 100}%`, height: '100%', backgroundColor: k.score >= k.maxScore ? '#16A34A' : k.score > 0 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
                    </View>
                    <Text style={[typography.body, { fontWeight: '700', minWidth: 30, textAlign: 'right' }]}>{k.score}/{k.maxScore}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      )}
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

  useEffect(() => {
    if (isFocused) {
      api.shop
        .list()
        .then(setProducts)
        .finally(() => setLoading(false));
    }
  }, [isFocused]);

  const addToCart = (product: ShopProduct) => {
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
        `Order #${order.id.slice(0, 8).toUpperCase()} created successfully!`,
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
          <TouchableOpacity style={{ flex: 0.5, margin: 6 }}>
            <GlassCard style={{ padding: 12 }}>
              <View
                style={{
                  height: 120,
                  backgroundColor: colors.surfaceLight,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="diamond-outline"
                  size={40}
                  color={colors.primaryLight}
                />
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

  useEffect(() => {
    if (isFocused) {
      api.wallet
        .get()
        .then((w) => setWallet(w))
        .catch(() => {});
    }
  }, [isFocused]);

  const items = [
    {
      icon: "person-outline",
      label: "Edit Profile",
      route: "EditProfile",
      category: "Account",
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
      icon: "help-circle-outline",
      label: "Help & Support",
      route: "Support",
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
    <ScreenWrapper scroll>
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
            {items.slice(0, 4).map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.route)}
                style={[
                  styles.menuRowItem,
                  { borderBottomColor: rowBorderColor },
                  i < 3 && styles.menuRowBorder,
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

            {items.slice(4).map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.route)}
                style={[
                  styles.menuRowItem,
                  { borderBottomColor: rowBorderColor },
                  i < 1 && styles.menuRowBorder,
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
});

export { MuhuratScreen } from "./MuhuratScreen";
export { GiftScreen } from "./GiftScreen";
