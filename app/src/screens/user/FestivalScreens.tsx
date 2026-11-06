import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, GlassCard, Chip, SkeletonLoader, EmptyState, colors, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { FestivalItem } from '../../shared/types';

const RANGE_OPTIONS = [
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
];

const VRAT_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Ekadashi', value: 'ekadashi' },
  { label: 'Vrat', value: 'vrat' },
  { label: 'Pradosham', value: 'pradosham' },
];

const CATEGORY_COLORS: Record<string, string> = {
  major: '#EE7B10',
  minor: '#D9A441',
  ekadashi: '#8D0B0C',
  pradosham: '#C21415',
  vrat: '#B45309',
  jayanti: '#A16207',
  solar: '#EE7B10',
};

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDateString = (value: string) => {
  const [y, m, d] = (value || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function FestivalCard({ item }: { item: FestivalItem }) {
  const date = parseDateString(item.date);
  const today = isSameDay(date, new Date());
  const accent = CATEGORY_COLORS[item.category] || colors.primary;
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <GlassCard style={{ padding: 0, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <View
          style={{
            width: 70,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent + '14',
            borderRightWidth: 1,
            borderRightColor: accent + '30',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: accent, letterSpacing: 1 }}>
            {month}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: accent, lineHeight: 28 }}>
            {day}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textMuted }}>
            {weekday}
          </Text>
        </View>

        <View style={{ flex: 1, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[typography.cardTitle, { flex: 1, color: colors.textPrimary, fontSize: 15 }]}>
              {item.name}
            </Text>
            {today && (
              <View style={{ backgroundColor: colors.success + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.heading }}>TODAY</Text>
              </View>
            )}
          </View>

          {!!(item.paksha || item.masa || item.tithi) && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 3 }]}>
              {[item.paksha, item.masa, item.tithi ? `Tithi ${item.tithi}` : '']
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}

          {!!item.description && (
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginTop: 6, lineHeight: 17 }]}
              numberOfLines={3}
            >
              {item.description}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: accent + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: accent, textTransform: 'capitalize' }}>
                {item.category}
              </Text>
            </View>
            {item.isFastingDay && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primary + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Ionicons name="moon" size={10} color={colors.primary} />
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>FASTING</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

interface ListProps {
  navigation?: any;
  fasting: boolean;
}

function FestivalListScreen({ fasting }: ListProps) {
  const isFocused = useIsFocused();
  const [items, setItems] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await api.panchang.festivals(formatDateString(new Date()), days, fasting);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [days, fasting]);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      load();
    }
  }, [isFocused, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const visible = fasting && category !== 'all'
    ? items.filter((item) => item.category === category)
    : items;

  return (
    <ScreenWrapper noPadding>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 10 }]}>
          {fasting
            ? 'Fasting days, ekadashi and vrat observances'
            : 'Festivals and auspicious observances ahead'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {RANGE_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={days === option.days}
              onPress={() => setDays(option.days)}
            />
          ))}
        </ScrollView>

        {fasting && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {VRAT_CATEGORIES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={category === option.value}
                onPress={() => setCategory(option.value)}
              />
            ))}
          </ScrollView>
        )}

        {loading ? (
          <>
            <SkeletonLoader height={110} style={{ marginBottom: 12 }} />
            <SkeletonLoader height={110} style={{ marginBottom: 12 }} />
            <SkeletonLoader height={110} style={{ marginBottom: 12 }} />
            <SkeletonLoader height={110} />
          </>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Ionicons name={fasting ? 'moon-outline' : 'sparkles-outline'} size={48} color={colors.textMuted} />}
            title={fasting ? 'No vrats found' : 'No festivals found'}
            subtitle={fasting ? 'No fasting days match your filters.' : 'No festivals in the selected period.'}
          />
        ) : (
          visible.map((item, index) => (
            <FestivalCard key={`${item.name}-${item.date}-${index}`} item={item} />
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export function FestivalsScreen({ navigation }: any) {
  return <FestivalListScreen navigation={navigation} fasting={false} />;
}

export function VratsScreen({ navigation }: any) {
  return <FestivalListScreen navigation={navigation} fasting={true} />;
}
