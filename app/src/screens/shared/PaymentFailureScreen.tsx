import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, Text } from 'react-native';
import { GradientButton, ScreenWrapper, colors, typography, GlassCard } from '../../shared';
import { Ionicons } from '@expo/vector-icons';

export function PaymentFailureScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { error, purpose, paymentOrderId } = route.params || {};

  const getTitle = () => {
    switch (purpose) {
      case 'wallet_recharge': return 'Wallet Recharge Failed';
      case 'donation': return 'Donation Failed';
      default: return 'Payment Failed';
    }
  };

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <GlassCard style={{ alignItems: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="close-circle" size={48} color={colors.danger} />
          </View>
          <Text style={[typography.pageTitle, { color: colors.textPrimary, textAlign: 'center' }]}>{getTitle()}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            {error || 'Something went wrong. Please try again.'}
          </Text>
        </GlassCard>
        <GradientButton
          title="Try Again"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24 }}
        />
        <GradientButton
          title="Cancel"
          variant="danger"
          onPress={() => navigation.navigate(purpose === 'wallet_recharge' ? 'Wallet' : 'Home')}
          style={{ marginTop: 12 }}
        />
      </View>
    </ScreenWrapper>
  );
}
