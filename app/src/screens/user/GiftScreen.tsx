import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Chip, ConfirmDialog, CustomModal, EmptyState, GlassCard, GradientButton, ScreenWrapper, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, Gift, GiftTransaction } from '../../shared/types';



export function GiftScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const isFocused = useIsFocused();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const preSelectedAstrologerId = route?.params?.astrologerId;
  const preSelectedAstrologerName = route?.params?.astrologerName;

  const loadData = useCallback(async () => {
    try {
      const [g, a, t, w] = await Promise.all([
        api.gifts.list(),
        api.astrologers.list(),
        api.gifts.transactions(user?.id),
        api.wallet.get(),
      ]);
      setGifts(g.filter(g => g.isActive));
      setAstrologers(a);
      setTransactions(t);
      setWallet(w);

      if (preSelectedAstrologerId) {
        const found = a.find((astro: Astrologer) => astro.userId === preSelectedAstrologerId);
        if (found) setSelectedAstrologer(found);
      }
    } catch {} finally { setLoading(false); }
  }, [user?.id, preSelectedAstrologerId]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const openSendGift = (gift: Gift) => {
    setSelectedGift(gift);
    if (!preSelectedAstrologerId) setSelectedAstrologer(null);
    setShowSendModal(true);
  };

  const handleSendGift = async () => {
    if (!selectedGift || !selectedAstrologer) return;
    setSending(true);
    try {
      await api.gifts.send({
        giftId: selectedGift.id,
        senderId: user?.id,
        receiverId: selectedAstrologer.userId,
      });
      setShowSendModal(false);
      setSelectedGift(null);
      setSelectedAstrologer(null);
      Alert.alert('Gift Sent', `You sent ${selectedGift.name} to ${selectedAstrologer.name}!`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send gift');
    } finally { setSending(false); }
  };

  const handleSendGiftDirect = async () => {
    if (!selectedGift || !selectedAstrologer) {
      Alert.alert('Select a Gift', 'Please choose a gift first.');
      return;
    }
    setSending(true);
    try {
      const result = await api.gifts.send({
        giftId: selectedGift.id,
        senderId: user?.id,
        receiverId: selectedAstrologer.userId,
      });
      setSelectedGift(null);
      Alert.alert('Gift Sent', `You sent ${selectedGift.name} to ${selectedAstrologer.name}!`);
      navigation.goBack();
    } catch (e: any) {
      const errMsg = e?.response?.data?.message || e.message || 'Failed to send gift';
      Alert.alert('Error', errMsg);
    } finally { setSending(false); }
  };

  if (loading) return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}><Text style={typography.pageTitle}>Gifts</Text></View>
      <View style={{ padding: 16 }}><GlassCard style={{ height: 100 }} /><View style={{ height: 12 }} /><GlassCard style={{ height: 100 }} /></View>
    </ScreenWrapper>
  );

  // Directly show "Gift for your expert" overlay screen if direct send
  if (preSelectedAstrologerId && selectedAstrologer) {
    return (
      <ScreenWrapper style={{ backgroundColor: 'transparent' }} edges={[]}>
        <View style={[styles.directSendContainer, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
          <View style={[styles.modalCard, {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            borderWidth: isDark ? 1 : 0
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Gift for your expert</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.expertRow, {
              backgroundColor: isDark ? '#111827' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
            }]}>
              <Avatar size={48} uri={selectedAstrologer.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.expertName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{selectedAstrologer.name}</Text>
                <Text style={[styles.expertSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  {selectedAstrologer.specialization?.join(', ') || 'Vedic Astrology Expert'}
                </Text>
              </View>
            </View>

            <Text style={[styles.chooseTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Choose gift</Text>

            <View style={styles.gridContainer}>
              {gifts.map((item) => {
                const isSelected = selectedGift?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedGift(item)}
                    style={[
                      styles.giftCardCompact,
                      {
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isSelected 
                          ? colors.accentGold 
                          : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      },
                      isSelected && {
                        backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
                      }
                    ]}
                  >
                    <View style={[styles.giftIconCircle, {
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'
                    }]}>
                      <Ionicons name="gift" size={24} color={colors.accentGold} />
                    </View>
                    <Text style={[styles.giftNameCompact, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.giftPriceCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      ₹ {item.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Your Balance: ₹{wallet?.balance || '0'}
              </Text>
              <Text style={[styles.balanceDesc, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Entire amount of the gift will be provided to expert
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSendGiftDirect}
              disabled={sending}
              style={[
                styles.sendBtnLarge, 
                { backgroundColor: isDark ? colors.accentGold : '#5C3214' },
                sending && { opacity: 0.7 }
              ]}
            >
              <Text style={[styles.sendBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                {sending ? 'Sending...' : 'Send Gift'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={gifts}
        keyExtractor={g => g.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={[typography.body, { marginBottom: 16 }]}>Show appreciation to your astrologer with a thoughtful gift</Text>
            {transactions.length > 0 && (
              <GlassCard style={{ padding: 16, marginBottom: 16 }}>
                <Text style={[typography.cardTitle, { marginBottom: 8 }]}>Your Gift History</Text>
                {transactions.slice(0, 5).map(t => {
                  const gift = gifts.find(g => g.id === t.giftId);
                  const astro = astrologers.find(a => a.userId === t.receiverId);
                  return (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="gift" size={18} color={colors.accentGold} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { fontWeight: '600' }]}>{gift?.name || 'Gift'} → {astro?.name || 'Astrologer'}</Text>
                        <Text style={typography.caption}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={[typography.caption, { color: t.isRedeemed ? colors.success : colors.warning }]}>{t.isRedeemed ? 'Redeemed' : 'Pending'}</Text>
                    </View>
                  );
                })}
              </GlassCard>
            )}
            <Text style={[typography.sectionTitle, { marginBottom: 12 }]}>Available Gifts</Text>
          </>
        }
        ListEmptyComponent={<EmptyState icon={<Ionicons name="gift-outline" size={48} color={colors.textMuted} />} title="No gifts available" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openSendGift(item)} style={{ flex: 0.5 }}>
            <GlassCard style={{ alignItems: 'center', padding: 20, marginBottom: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name="gift" size={32} color={colors.accentGold} />
              </View>
              <Text style={[typography.cardTitle, { textAlign: 'center' }]}>{item.name}</Text>
              <Text style={[typography.price, { marginTop: 4 }]}>₹{item.price}</Text>
              <GradientButton title="Send" onPress={() => openSendGift(item)} small style={{ marginTop: 10, width: '100%' }} />
            </GlassCard>
          </TouchableOpacity>
        )}
      />

      <CustomModal visible={showSendModal} onClose={() => setShowSendModal(false)} title={`Send ${selectedGift?.name || 'Gift'}`}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Select an astrologer to send this gift to:</Text>
          {selectedAstrologer && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceLight, borderRadius: radii.input, padding: 10, borderWidth: 1, borderColor: colors.cardBorder }}>
              <Avatar size={36} uri={selectedAstrologer.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { fontWeight: '600' }]}>{selectedAstrologer.name}</Text>
                <Text style={typography.caption}>{selectedAstrologer.specialization?.[0] || 'Astrologer'}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAstrologer(null)}><Ionicons name="close-circle" size={22} color={colors.textMuted} /></TouchableOpacity>
            </View>
          )}
          {!selectedAstrologer && (
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#111827' : '#F1F5F9',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 40,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                }}
              >
                <Ionicons name="search" size={16} color={isDark ? '#9CA3AF' : '#64748B'} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search astrologer name..."
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    flex: 1,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontSize: 13,
                    padding: 0,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ maxHeight: 240 }}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {astrologers
                    .filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <TouchableOpacity
                        key={item.userId}
                        onPress={() => {
                          setSelectedAstrologer(item);
                          setSearchQuery("");
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider }}
                      >
                        <Avatar size={36} uri={item.avatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.body, { fontWeight: '600', color: isDark ? '#FFFFFF' : '#0F172A' }]}>{item.name}</Text>
                          <Text style={[typography.caption, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{item.specialization?.[0] || 'Astrologer'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  {astrologers.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textMuted, marginVertical: 20 }}>No astrologers found</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity onPress={() => setShowSendModal(false)} style={{ flex: 1, height: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <GradientButton title={sending ? 'Sending...' : `Send ₹${selectedGift?.price || '0'}`} onPress={handleSendGift} disabled={sending || !selectedAstrologer} />
            </View>
          </View>
        </View>
      </CustomModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  directSendContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  expertName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  expertSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chooseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  giftCardCompact: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  giftCardSelected: {
    borderColor: '#6b3f20',
    backgroundColor: '#FAF5F0',
  },
  giftIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  giftNameCompact: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  giftPriceCompact: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  balanceRow: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  balanceDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  sendBtnLarge: {
    backgroundColor: '#5C3214', // Rounded brown button
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
