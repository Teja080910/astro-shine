import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, Text } from 'react-native';
import { GradientButton, ScreenWrapper, colors, typography, GlassCard } from '../../shared';
import { Ionicons } from '@expo/vector-icons';

const categoryConfig: Record<string, { icon: string; iconColor: string; title: string }> = {
  cancelled: {
    icon: 'close-circle-outline',
    iconColor: colors.warning,
    title: 'Payment Cancelled',
  },
  failed: {
    icon: 'close-circle',
    iconColor: colors.danger,
    title: 'Payment Failed',
  },
  auth_failed: {
    icon: 'lock-closed-outline',
    iconColor: colors.danger,
    title: 'Authentication Failed',
  },
  network: {
    icon: 'wifi-outline',
    iconColor: colors.warning,
    title: 'Network Error',
  },
  timeout: {
    icon: 'time-outline',
    iconColor: colors.warning,
    title: 'Payment Timed Out',
  },
  gateway: {
    icon: 'server-outline',
    iconColor: colors.warning,
    title: 'Gateway Unavailable',
  },
};

const defaultConfig = { icon: 'close-circle', iconColor: colors.danger, title: 'Payment Failed' };

export function PaymentFailureScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { category, message, purpose, paymentOrderId } = route.params || {};
  const cfg = categoryConfig[category as string] || defaultConfig;

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <GlassCard style={{ alignItems: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: cfg.iconColor + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name={cfg.icon as any} size={48} color={cfg.iconColor} />
          </View>
          <Text style={[typography.pageTitle, { color: colors.textPrimary, textAlign: 'center' }]}>{cfg.title}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            {message || 'Something went wrong. Please try again.'}
          </Text>
        </GlassCard>
        <GradientButton
          title="Try Again"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24 }}
        />
        <GradientButton
          title={category === 'cancelled' ? 'Back' : 'Cancel'}
          variant={category === 'cancelled' ? 'secondary' : 'danger'}
          onPress={() => navigation.navigate('Main', { screen: purpose === 'wallet_recharge' ? 'Wallet' : 'Home' })}
          style={{ marginTop: 12 }}
        />
      </View>
    </ScreenWrapper>
  );
}
