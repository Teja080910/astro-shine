import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper, GlassCard, GradientButton, DatePicker, colors, typography, radii } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import type { MandirPooja } from '../../shared/types';

export function MandirPoojaDetailScreen({ route, navigation }: any) {
  const { poojaId } = route.params;
  const [pooja, setPooja] = useState<MandirPooja | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.mandirPooja.get(poojaId).then(setPooja).finally(() => setLoading(false));
  }, [poojaId]);

  const handleBook = async () => {
    if (!pooja || !bookingDate) return;
    setBooking(true);
    try {
      const order = await api.payments.createOrder({
        amount: Number(pooja.price),
        purpose: 'pooja_booking',
        metadata: { poojaId: pooja.id, bookingDate },
      });
      navigation.navigate('Payment', {
        razorpayOrderId: order.razorpayOrderId, key: order.key, amount: order.amount,
        currency: order.currency, purpose: 'pooja_booking', paymentOrderId: order.id,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to initiate booking');
    } finally { setBooking(false); }
  };

  if (loading) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>Loading...</Text></GlassCard></ScreenWrapper>;
  if (!pooja) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>Pooja not found</Text></GlassCard></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}>
        <GlassCard style={{ padding: 20, alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentGold + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="flame" size={40} color={colors.accentGold} />
          </View>
          <Text style={[typography.pageTitle, { textAlign: 'center', color: colors.textPrimary }]}>{pooja.name}</Text>
          {pooja.description && (
            <Text style={[typography.body, { textAlign: 'center', marginTop: 12, color: colors.textSecondary, lineHeight: 20 }]}>{pooja.description}</Text>
          )}
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.accentGold, marginTop: 16 }}>₹{pooja.price}</Text>
        </GlassCard>

        <View style={{ marginTop: 20 }}>
          <Text style={[typography.label, { marginBottom: 8, color: colors.textSecondary }]}>Select Booking Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 48, justifyContent: 'center' }}>
            <Text style={{ color: bookingDate ? colors.textPrimary : colors.textMuted, fontSize: 15 }}>{bookingDate || 'Tap to select date'}</Text>
          </TouchableOpacity>
        </View>

        <DatePicker visible={showDatePicker} value={bookingDate} onClose={() => setShowDatePicker(false)} onSelect={(d) => { setBookingDate(d); setShowDatePicker(false); }} />

        <GradientButton title={booking ? 'Processing...' : 'Pay & Book'} onPress={handleBook} disabled={booking || !bookingDate} style={{ marginTop: 24 }} />
      </View>
    </ScreenWrapper>
  );
}
