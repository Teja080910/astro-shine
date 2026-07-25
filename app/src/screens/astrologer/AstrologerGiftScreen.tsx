import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Chip, ConfirmDialog, EmptyState, GlassCard, GradientButton, ScreenWrapper, colors, radii, typography } from '../../shared';
import { api } from '../../shared/api-client';
import type { Gift, GiftTransaction } from '../../shared/types';

export function AstrologerGiftScreen() {
  const { astrologer } = useAuth();
  const isFocused = useIsFocused();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [g, t] = await Promise.all([
        api.gifts.list(),
        api.gifts.transactions(),
      ]);
      setGifts(g);
      const myTxns = t.filter(tx => tx.receiverId === astrologer?.userId);
      setTransactions(myTxns);
    } catch {} finally { setLoading(false); }
  }, [astrologer?.userId]);

  useEffect(() => { if (isFocused) loadData(); }, [isFocused, loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData().finally(() => setRefreshing(false)); }, [loadData]);

  const handleRedeem = async (id: string) => {
    setRedeeming(id);
    try {
      await api.gifts.redeem(id);
      Alert.alert('Redeemed', 'Gift has been redeemed successfully!');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to redeem gift');
    } finally { setRedeeming(null); }
  };

  const pendingCount = transactions.filter(t => !t.isRedeemed).length;
  const totalValue = transactions.reduce((sum, t) => {
    const gift = gifts.find(g => g.id === t.giftId);
    return sum + (gift ? Number(gift.price) : 0);
  }, 0);

  if (loading) return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}><Text style={typography.pageTitle}>Gifts Received</Text></View>
      <View style={{ padding: 16 }}><GlassCard style={{ height: 100 }} /></View>
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={[typography.pageTitle, { marginBottom: 4 }]}>Gifts Received</Text>
            <Text style={[typography.body, { marginBottom: 16 }]}>Gifts sent to you by users</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.accentGold }}>{transactions.length}</Text>
                <Text style={typography.caption}>Total Gifts</Text>
              </GlassCard>
              <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.warning }}>{pendingCount}</Text>
                <Text style={typography.caption}>Pending</Text>
              </GlassCard>
              <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.success }}>₹{totalValue}</Text>
                <Text style={typography.caption}>Total Value</Text>
              </GlassCard>
            </View>
            {transactions.length > 0 && (
              <Text style={[typography.sectionTitle, { marginBottom: 12 }]}>Gift History</Text>
            )}
          </>
        }
        ListEmptyComponent={<EmptyState icon={<Ionicons name="gift-outline" size={48} color={colors.textMuted} />} title="No gifts received yet" subtitle="When users send you gifts, they will appear here" />}
        renderItem={({ item }) => {
          const gift = gifts.find(g => g.id === item.giftId);
          return (
            <GlassCard style={{ marginBottom: 10, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="gift" size={24} color={colors.accentGold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.cardTitle]}>{gift?.name || 'Gift'}</Text>
                  <Text style={typography.caption}>₹{gift?.price || '0'} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View>
                  {item.isRedeemed ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[typography.caption, { color: colors.success, fontWeight: '600' }]}>Redeemed</Text>
                    </View>
                  ) : (
                    <GradientButton
                      title={redeeming === item.id ? '...' : 'Redeem'}
                      onPress={() => handleRedeem(item.id)}
                      disabled={redeeming === item.id}
                      small
                    />
                  )}
                </View>
              </View>
            </GlassCard>
          );
        }}
      />
    </ScreenWrapper>
  );
}
