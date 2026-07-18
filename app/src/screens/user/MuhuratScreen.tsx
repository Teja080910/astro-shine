import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../shared/api-client';
import { ScreenWrapper, GlassCard, Chip, SkeletonLoader, EmptyState, DatePicker, colors, typography, radii } from '../../shared';
import type { MuhuratItem, MuhuratCategory } from '../../shared/types';

export function MuhuratScreen() {
  const { theme } = useAuth();
  const isFocused = useIsFocused();
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<MuhuratCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [data, setData] = useState<MuhuratItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTimeString12 = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h24 = parseInt(parts[0]);
    const m = parts[1] || '00';
    if (isNaN(h24)) return '';
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m} ${period}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await api.muhuratCategories.list();
      setCategories(cats.filter((c) => c.isActive));

      const filterCatId = selectedCategory === 'All' ? undefined : selectedCategory;
      const startStr = formatDateString(startDate);
      const endStr = formatDateString(endDate);

      const items = await api.muhurat.list(filterCatId, startStr, endStr);
      setData(items);
    } catch (err) {
      console.error('Error fetching Muhurat data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, startDate, endDate]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const renderItem = ({ item }: { item: MuhuratItem }) => (
    <GlassCard style={styles.card} key={item.id}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name="time" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.cardTitle, { color: colors.textPrimary, fontWeight: '700' }]}>{item.name}</Text>
        </View>
        <Chip label={item.categoryName || 'Timing'} selected />
      </View>

      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 12 }]}>
        {item.description || 'No additional details provided.'}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>{item.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>{formatTimeString12(item.time)}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={styles.cardFooter}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Recommended by:</Text>
        <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
          {item.createdByName || 'System'}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>Muhurat Timings</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Browse auspicious dates and timings</Text>
      </View>

      {/* Date Filters */}
      <View style={[styles.filterContainer, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <View style={styles.datePickerContainer}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>From</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.dateButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[typography.body, { color: colors.textPrimary }]}>{formatDateString(startDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.datePickerContainer}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>To</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.dateButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[typography.body, { color: colors.textPrimary }]}>{formatDateString(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DatePicker
        visible={showStartPicker}
        value={formatDateString(startDate)}
        onClose={() => setShowStartPicker(false)}
        onSelect={(dateStr) => setStartDate(new Date(dateStr))}
      />

      <DatePicker
        visible={showEndPicker}
        value={formatDateString(endDate)}
        onClose={() => setShowEndPicker(false)}
        onSelect={(dateStr) => setEndDate(new Date(dateStr))}
      />

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="All Muhurat" selected={selectedCategory === 'All'} onPress={() => setSelectedCategory('All')} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={selectedCategory === c.id} onPress={() => setSelectedCategory(c.id)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonLoader height={140} style={{ marginBottom: 16 }} />
          <SkeletonLoader height={140} style={{ marginBottom: 16 }} />
          <SkeletonLoader height={140} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="time-outline" size={48} color={colors.textMuted} />}
              title="No Timings Found"
              subtitle="There are no auspicious timings matching your filters."
            />
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  datePickerContainer: { flex: 1, marginHorizontal: 4 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  categoriesContainer: { marginBottom: 16, height: 40 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 120 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  divider: { height: 1, marginVertical: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
