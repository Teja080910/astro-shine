import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar, CustomModal, EmptyState, GlassCard, GradientButton, ScreenWrapper, colors, radii, resolveMediaUrl, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, Gift, GiftTransaction } from '../../shared/types';



export function GiftScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { theme } = useAuth();
  const { giftVersion } = useChat();
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialMode = route?.params?.mode;
  // The Profile menu opens the dedicated GiftHistory route; treat it exactly
  // like history mode so the Send Gift catalogue can never show up there.
  const historyOnly = initialMode === 'history' || route?.name === 'GiftHistory';
  const [activeTab, setActiveTab] = useState<'send' | 'history'>(historyOnly ? 'history' : 'send');

  useEffect(() => {
    navigation.setOptions({ title: historyOnly ? 'Gift History' : 'Gifts' });
    setActiveTab(historyOnly ? 'history' : 'send');
  }, [navigation, historyOnly]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const preSelectedAstrologerId = historyOnly ? undefined : route?.params?.astrologerId;
  const preSelectedAstrologerName = historyOnly ? undefined : route?.params?.astrologerName;

  const filteredAstrologers = useMemo(() => {
    if (!searchQuery.trim()) return astrologers;
    const q = searchQuery.toLowerCase().trim();
    return astrologers.filter((a) =>
      a.name?.toLowerCase().includes(q) ||
      a.specialization?.some((s: string) => s.toLowerCase().includes(q))
    );
  }, [astrologers, searchQuery]);

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
  }, [isFocused, loadData, giftVersion]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const openSendGift = (gift: Gift) => {
    setSelectedGift(gift);
    setSearchQuery("");
    if (!preSelectedAstrologerId) setSelectedAstrologer(null);
    setShowSendModal(true);
  };

  const handleSendGift = async () => {
    if (!selectedGift || !selectedAstrologer) return;
    setSending(true);
    try {
      await api.gifts.send({
        giftId: selectedGift.id,
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
      await api.gifts.send({
        giftId: selectedGift.id,
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
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                      overflow: 'hidden',
                    }]}>
                      {item.image ? (
                        <Image source={{ uri: resolveMediaUrl(item.image) }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="gift" size={24} color={colors.accentGold} />
                      )}
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

  const totalGiftValue = transactions.reduce((sum, t) => {
    const gift = gifts.find((g) => g.id === t.giftId);
    return sum + Number(t.giftPrice || gift?.price || 0);
  }, 0);

  return (
    <ScreenWrapper noPadding>
      <View style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
        {activeTab === 'history' ? (
          <FlatList
            key="gift-history"
            data={transactions}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <>
                {!historyOnly && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => setActiveTab('send')}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
                        backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.cardBorder,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Send Gift</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('history')}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
                        backgroundColor: colors.accentGold, borderWidth: 1, borderColor: colors.accentGold,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>Gift History</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 14 }]}>
                  Gifts you have sent to astrologers
                </Text>
                {transactions.length > 0 && (
                  <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[typography.caption, { color: colors.textMuted }]}>Gifts Sent</Text>
                        <Text style={[typography.sectionTitle, { color: colors.textPrimary }]}>{transactions.length}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.caption, { color: colors.textMuted }]}>Total Value</Text>
                        <Text style={[typography.sectionTitle, { color: colors.accentGold }]}>₹{totalGiftValue.toFixed(2)}</Text>
                      </View>
                    </View>
                  </GlassCard>
                )}
              </>
            }
            renderItem={({ item }) => {
              const gift = gifts.find((g) => g.id === item.giftId);
              const astro = astrologers.find((a) => a.userId === item.receiverId);
              return (
                <GlassCard style={{ padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 48, height: 48, borderRadius: 24, overflow: 'hidden',
                        backgroundColor: colors.accentGold + '18', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {item.giftImage || gift?.image ? (
                        <Image source={{ uri: resolveMediaUrl(item.giftImage || gift?.image || '') }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="gift" size={24} color={colors.accentGold} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[typography.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.giftName || gift?.name || 'Gift'}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                        To {astro?.name || 'Astrologer'}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[typography.price, { color: colors.accentGold }]}>₹{item.giftPrice || gift?.price || '0'}</Text>
                      <View
                        style={{
                          backgroundColor: item.isRedeemed ? colors.success + '18' : colors.accentGold + '18',
                          borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '800', color: item.isRedeemed ? colors.success : colors.accentGold }}>
                          {item.isRedeemed ? 'REDEEMED' : 'SENT'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon={<Ionicons name="gift-outline" size={48} color={colors.textMuted} />}
                title="No gifts sent yet"
                subtitle="Send a gift to show appreciation to your astrologer."
              />
            }
          />
        ) : (
          <FlatList
            key="gift-send"
            data={gifts}
            keyExtractor={(g) => g.id}
            numColumns={2}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            columnWrapperStyle={{ gap: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <>
                {!historyOnly && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => setActiveTab('send')}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
                        backgroundColor: colors.accentGold, borderWidth: 1, borderColor: colors.accentGold,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>Send Gift</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('history')}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
                        backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.cardBorder,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Gift History</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[typography.pageTitle, { color: colors.textPrimary, marginBottom: 4 }]}>Send a Gift</Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 14 }]}>
                  Show appreciation to your astrologer with a thoughtful gift.
                </Text>
                <GlassCard style={{ padding: 14, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="wallet" size={20} color={colors.accentGold} />
                      <View>
                        <Text style={[typography.caption, { color: colors.textMuted }]}>Wallet Balance</Text>
                        <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>₹{wallet?.balance || '0'}</Text>
                      </View>
                    </View>
                    <Text style={[typography.caption, { color: colors.textMuted, flex: 1, textAlign: 'right', marginLeft: 10 }]}>
                      Entire gift amount goes to the expert
                    </Text>
                  </View>
                </GlassCard>
                <Text style={[typography.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Available Gifts</Text>
              </>
            }
            ListEmptyComponent={
              loading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <EmptyState icon={<Ionicons name="gift-outline" size={48} color={colors.textMuted} />} title="No gifts available" />
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openSendGift(item)} style={{ flex: 0.5 }}>
                <GlassCard style={{ alignItems: 'center', padding: 16, marginBottom: 12 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' }}>
                    {item.image ? (
                      <Image source={{ uri: resolveMediaUrl(item.image) }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="gift" size={32} color={colors.accentGold} />
                    )}
                  </View>
                  <Text style={[typography.cardTitle, { textAlign: 'center' }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[typography.price, { marginTop: 4 }]}>₹{item.price}</Text>
                  <GradientButton title="Send" onPress={() => openSendGift(item)} small style={{ marginTop: 10, width: '100%' }} />
                </GlassCard>
              </TouchableOpacity>
            )}
          />
        )}
      <CustomModal
        visible={showSendModal}
        onClose={() => { Keyboard.dismiss(); setShowSendModal(false); }}
        title={`Send ${selectedGift?.name || 'Gift'}`}
        scrollable={false}
      >
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
                  height: 42,
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
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  style={{
                    flex: 1,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontSize: 13,
                    padding: 0,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  </TouchableOpacity>
                )}
                {isKeyboardOpen && (
                  <TouchableOpacity
                    onPress={() => Keyboard.dismiss()}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      borderRadius: 8,
                      marginLeft: 6,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ maxHeight: isKeyboardOpen ? 160 : 250 }}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                  {filteredAstrologers.map((item) => (
                    <TouchableOpacity
                      key={item.userId}
                      onPress={() => {
                        Keyboard.dismiss();
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
                  {filteredAstrologers.length === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textMuted, marginVertical: 20 }}>No astrologers found</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <GradientButton
                title="Cancel"
                onPress={() => { Keyboard.dismiss(); setShowSendModal(false); }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GradientButton title={sending ? 'Sending...' : `Send ₹${selectedGift?.price || '0'}`} onPress={() => { Keyboard.dismiss(); handleSendGift(); }} disabled={sending || !selectedAstrologer} />
            </View>
          </View>
        </View>
      </CustomModal>
      </View>
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
