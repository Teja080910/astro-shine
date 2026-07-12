import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { api } from '../../shared/api-client';
import { ScreenWrapper, colors, typography } from '../../shared';

export function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { razorpayOrderId, key, amount, currency, purpose, paymentOrderId } = route.params || {};
  const processedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const openRazorpay = async () => {
      try {
        const RazorpayCheckout = require('react-native-razorpay');
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await RazorpayCheckout.default.open({
          key,
          order_id: razorpayOrderId,
          amount,
          currency,
          name: 'Astro Shine',
          description: purpose === 'wallet_recharge' ? 'Wallet Recharge' :
                       purpose === 'donation' ? 'Donation' : 'Payment',
          prefill: {},
          theme: { color: '#6D28D9' },
        });

        setStatus('processing');

        const result = await api.payments.verify({
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
        });

        if (result.success) {
          setStatus('success');
          setTimeout(() => {
            navigation.replace('PaymentSuccess', {
              transaction: result.transaction,
              wallet: result.wallet,
              purpose,
              amount: amount / 100,
            });
          }, 500);
        } else {
          setStatus('failed');
          setTimeout(() => {
            navigation.replace('PaymentFailure', {
              error: 'Payment verification failed',
              purpose,
              paymentOrderId,
            });
          }, 500);
        }
      } catch (error: any) {
        setStatus('failed');
        const errorMessage = error?.message || error?.description || 'Payment was cancelled or failed';
        setTimeout(() => {
          navigation.replace('PaymentFailure', {
            error: errorMessage,
            purpose,
            paymentOrderId,
          });
        }, 500);
      }
    };

    openRazorpay();
  }, []);

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[typography.pageTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
          {status === 'loading' ? 'Opening Payment Gateway...' :
           status === 'processing' ? 'Verifying Payment...' :
           status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
        </Text>
      </View>
    </ScreenWrapper>
  );
}
