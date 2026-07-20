import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, Text } from 'react-native';
import { GradientButton, ScreenWrapper, colors, typography, GlassCard } from '../../shared';
import { Ionicons } from '@expo/vector-icons';

export function PaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { transaction, wallet, purpose, amount } = route.params || {};

  const getTitle = () => {
    switch (purpose) {
      case 'wallet_recharge': return 'Wallet Recharged!';
      case 'donation': return 'Donation Successful!';
      default: return 'Payment Successful!';
    }
  };

  const getDescription = () => {
    switch (purpose) {
      case 'wallet_recharge': return 'Funds have been added to your wallet.';
      case 'donation': return 'Thank you for your generous contribution.';
      default: return 'Your payment has been processed successfully.';
    }
  };

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <GlassCard style={{ alignItems: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={[typography.pageTitle, { color: colors.textPrimary, textAlign: 'center' }]}>{getTitle()}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>{getDescription()}</Text>
          <Text style={[typography.price, { color: colors.accentGold, marginTop: 16, fontSize: 36 }]}>₹{amount}</Text>
          {transaction?.id && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 8 }]}>Transaction ID: {transaction.id.slice(0, 8).toUpperCase()}</Text>
          )}
          {wallet?.balance && (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>Wallet Balance: ₹{wallet.balance}</Text>
          )}
        </GlassCard>
        <GradientButton
          title={purpose === 'wallet_recharge' ? 'Back to Wallet' : 'Back to Home'}
          onPress={() => navigation.navigate('Main', { screen: purpose === 'wallet_recharge' ? 'Wallet' : 'Home' })}
          style={{ marginTop: 24 }}
        />
      </View>
    </ScreenWrapper>
  );
}
