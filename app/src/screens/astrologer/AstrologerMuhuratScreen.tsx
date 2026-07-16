import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../shared/api-client';
import { ScreenWrapper, GlassCard, Chip, SkeletonLoader, EmptyState, CustomModal, Toggle, GradientButton, DatePicker, TimePicker, colors, radii, typography } from '../../shared';
import type { MuhuratItem, MuhuratCategory } from '../../shared/types';

export function AstrologerMuhuratScreen() {
  const { astrologer, theme } = useAuth();
  const isFocused = useIsFocused();
  const isDark = theme === 'dark';

  const [data, setData] = useState<MuhuratItem[]>([]);
  const [categories, setCategories] = useState<MuhuratCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MuhuratItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formTime, setFormTime] = useState<Date>(new Date());
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTimeString = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}:00`;
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
      const [cats, items] = await Promise.all([
        api.muhuratCategories.list(),
        api.muhurat.listMy(),
      ]);
      setCategories(cats.filter((c) => c.isActive));
      setData(items);
    } catch (err) {
      console.error('Error loading astrologer Muhurat:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const startNew = () => {
    setEditingItem(null);
    setFormName('');
    setSelectedCatId(categories[0]?.id || '');
    setFormDate(new Date());
    setFormTime(new Date());
    setFormDesc('');
    setFormActive(true);
    setModalVisible(true);
  };

  const startEdit = (item: MuhuratItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setSelectedCatId(item.categoryId);
    
    // Parse date
    const dParts = item.date.split('-');
    const newD = new Date();
    if (dParts.length === 3) {
      newD.setFullYear(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
    }
    setFormDate(newD);

    // Parse time
    const tParts = item.time.split(':');
    const newT = new Date();
    if (tParts.length >= 2) {
      newT.setHours(parseInt(tParts[0]), parseInt(tParts[1]), 0);
    }
    setFormTime(newT);

    setFormDesc(item.description || '');
    setFormActive(item.isActive);
    setModalVisible(true);
  };

  const save = async () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    if (!selectedCatId) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    const dateStr = formatDateString(formDate);
    const timeStr = formatTimeString(formTime);

    const payload = {
      name: formName,
      categoryId: selectedCatId,
      date: dateStr,
      time: timeStr,
      description: formDesc,
      isActive: formActive,
    };

    try {
      if (editingItem) {
        await api.muhurat.update(editingItem.id, payload);
      } else {
        await api.muhurat.create(payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'An error occurred';
      Alert.alert('Error', errMsg);
    }
  };

  const deleteItem = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this Muhurat entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.muhurat.delete(id);
            loadData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MuhuratItem }) => (
    <GlassCard style={styles.card} key={item.id}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name="time" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.cardTitle, { color: colors.textPrimary, fontWeight: '700' }]}>{item.name}</Text>
        </View>
        <BadgeBadge active={item.isActive} />
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

      <View style={styles.actionsRow}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Category: <Text style={{ color: colors.primary, fontWeight: '600' }}>{item.categoryName}</Text>
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteItem(item.id)} style={[styles.actionBtn, { marginLeft: 8 }]}>
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>My Muhurats</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Manage your auspicious timings</Text>
          </View>
          <TouchableOpacity onPress={startNew} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
              icon={<Ionicons name="calendar-outline" size={48} color={colors.textMuted} />}
              title="No Muhurats Created"
              subtitle="Click the + button at the top to create your first Timing recommendations."
            />
          }
        />
      )}

      {/* Creation/Edit Modal */}
      <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} title={editingItem ? 'Edit Muhurat' : 'New Muhurat'}>
        <View style={styles.modalBody}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            placeholder="e.g. Vivah Muhurat"
            placeholderTextColor={colors.textMuted}
            value={formName}
            onChangeText={setFormName}
            style={[styles.inputField, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} selected={selectedCatId === c.id} onPress={() => setSelectedCatId(c.id)} />
            ))}
          </ScrollView>

          <View style={styles.dateTimeRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.selectorBtn, { borderColor: colors.cardBorder, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textPrimary }}>{formatDateString(formDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <TimePicker
                label="Time"
                value={formatTimeString(formTime).substring(0, 5)}
                onChange={(timeStr) => {
                  const parts = timeStr.split(':');
                  const t = new Date(formTime);
                  t.setHours(parseInt(parts[0]), parseInt(parts[1]));
                  setFormTime(t);
                }}
              />
            </View>
          </View>

          <DatePicker
            visible={showDatePicker}
            value={formatDateString(formDate)}
            onClose={() => setShowDatePicker(false)}
            onSelect={(dateStr) => setFormDate(new Date(dateStr))}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            placeholder="Auspicious details..."
            placeholderTextColor={colors.textMuted}
            value={formDesc}
            onChangeText={setFormDesc}
            multiline
            numberOfLines={4}
            style={[styles.inputField, { height: 80, textAlignVertical: 'top', color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}
          />

          <View style={styles.toggleRow}>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>Active timing</Text>
            <Toggle value={formActive} onValueChange={setFormActive} />
          </View>

          <GradientButton title={editingItem ? 'Save Changes' : 'Create timing'} onPress={save} style={{ marginTop: 24 }} />
          <View style={{ height: 60 }} />
        </View>
      </CustomModal>
    </ScreenWrapper>
  );
}

function BadgeBadge({ active }: { active: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: active ? colors.success + '20' : colors.danger + '20' }]}>
      <Text style={{ color: active ? colors.success : colors.danger, fontSize: 10, fontWeight: '700' }}>
        {active ? 'ACTIVE' : 'INACTIVE'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 120 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  divider: { height: 1, marginVertical: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder },
  modalBody: { paddingHorizontal: 24, paddingVertical: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputField: {
    borderWidth: 1,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
});
