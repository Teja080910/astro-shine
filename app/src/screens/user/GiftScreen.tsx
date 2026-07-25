import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Chip, ConfirmDialog, CustomModal, EmptyState, GlassCard, GradientButton, ScreenWrapper, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Astrologer, Gift, GiftTransaction } from '../../shared/types';

export function GiftScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [g, a, t] = await Promise.all([
        api.gifts.list(),
        api.astrologers.list(),
        api.gifts.transactions(user?.id),
      ]);
      setGifts(g.filter(g => g.isActive));
      setAstrologers(a);
      setTransactions(t);
    } catch {} finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (isFocused) loadData(); }, [isFocused, loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData().finally(() => setRefreshing(false)); }, [loadData]);

  const openSendGift = (gift: Gift) => {
    setSelectedGift(gift);
    setSelectedAstrologer(null);
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

  if (loading) return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}><Text style={typography.pageTitle}>Gifts</Text></View>
      <View style={{ padding: 16 }}><GlassCard style={{ height: 100 }} /><View style={{ height: 12 }} /><GlassCard style={{ height: 100 }} /></View>
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={gifts}
        keyExtractor={g => g.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        columnWrapperStyle={{ gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={[typography.pageTitle, { marginBottom: 4 }]}>Send a Gift</Text>
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
            <FlatList
              data={astrologers}
              keyExtractor={a => a.userId}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedAstrologer(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                  <Avatar size={36} uri={item.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { fontWeight: '600' }]}>{item.name}</Text>
                    <Text style={typography.caption}>{item.specialization?.[0] || 'Astrologer'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
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
