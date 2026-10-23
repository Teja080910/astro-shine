import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View, Text } from 'react-native';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, colors, typography } from '../../shared';

type PaymentErrorCategory = 'cancelled' | 'failed' | 'auth_failed' | 'network' | 'timeout' | 'gateway' | 'unknown';

function categorizeRazorpayError(error: any): { category: PaymentErrorCategory; friendly: string; raw: any } {
  const raw = error?.error || error;
  const code = raw?.code || '';
  const description = raw?.description || '';
  const reason = raw?.reason || '';

  console.log('[Payment] Razorpay error:', JSON.stringify({ code, description, reason, metadata: raw?.metadata }));

  const isCancelled = (
    code === 'BAD_REQUEST_ERROR' ||
    reason === 'payment_error' ||
    description?.toLowerCase().includes('cancelled') ||
    description?.toLowerCase().includes('cancelled') ||
    description?.toLowerCase().includes('closed') ||
    description === 'undefined'
  );

  if (isCancelled) {
    return {
      category: 'cancelled',
      friendly: 'You cancelled the payment. No amount has been charged.',
      raw,
    };
  }

  if (code?.includes('NETWORK') || code?.includes('TIMEOUT') || reason === 'network_error') {
    return {
      category: 'network',
      friendly: 'A network error occurred. Please check your connection and try again.',
      raw,
    };
  }

  if (code?.includes('AUTH') || code?.includes('FAILED') || reason === 'authentication_failed') {
    return {
      category: 'auth_failed',
      friendly: 'Payment authentication failed. Please try again or use a different method.',
      raw,
    };
  }

  if (code?.includes('TIMEOUT') || reason === 'timeout') {
    return {
      category: 'timeout',
      friendly: 'The payment request timed out. Please try again.',
      raw,
    };
  }

  if (code?.includes('GATEWAY') || description?.toLowerCase().includes('gateway')) {
    return {
      category: 'gateway',
      friendly: 'The payment gateway is temporarily unavailable. Please try again later.',
      raw,
    };
  }

  return {
    category: 'failed',
    friendly: 'We couldn\'t complete your payment at this time. Please try again or use a different payment method.',
    raw,
  };
}

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
                       purpose === 'donation' ? 'Donation' :
                       purpose === 'order_payment' ? 'Store Order' : 'Payment',
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
              category: 'failed',
              message: 'Payment verification failed on our end. Please check your transaction status.',
              purpose,
              paymentOrderId,
            });
          }, 500);
        }
      } catch (error: any) {
        setStatus('failed');
        const { category, friendly, raw } = categorizeRazorpayError(error);
        console.log('[Payment] Mapped to category:', category, '| raw:', JSON.stringify(raw));
        setTimeout(() => {
          navigation.replace('PaymentFailure', {
            category,
            message: friendly,
            purpose,
            paymentOrderId,
          });
        }, 500);
      }
    };

    openRazorpay();
  }, []);

  const purposeLabel =
    purpose === 'wallet_recharge' ? 'Wallet Recharge' :
    purpose === 'donation' ? 'Temple Donation' :
    purpose === 'order_payment' ? 'Store Order' :
    purpose === 'pooja_booking' ? 'Puja Booking' : 'Payment';
  const statusLabel =
    status === 'loading' ? 'Opening Payment Gateway...' :
    status === 'processing' ? 'Verifying Payment...' :
    status === 'success' ? 'Payment Successful!' : 'Payment Failed';
  const statusColor =
    status === 'success' ? colors.success :
    status === 'failed' ? colors.danger : colors.accentGold;
  const statusIcon =
    status === 'success' ? 'checkmark-circle' :
    status === 'failed' ? 'close-circle' : 'time-outline';

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <GlassCard style={{ alignItems: 'center', padding: 28 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: statusColor + '18',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name={statusIcon as any} size={44} color={statusColor} />
          </View>
          <Text style={[typography.pageTitle, { color: colors.textPrimary, textAlign: 'center' }]}>
            {statusLabel}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
            {purposeLabel}
          </Text>
          {Number(amount) > 0 ? (
            <Text style={[typography.price, { color: colors.accentGold, fontSize: 32, marginTop: 12 }]}>
              ₹{(Number(amount) / 100).toFixed(2)}
            </Text>
          ) : null}
          {status === 'loading' || status === 'processing' ? (
            <ActivityIndicator size="small" color={colors.accentGold} style={{ marginTop: 16 }} />
          ) : null}
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 14, textAlign: 'center' }]}>
            {status === 'failed'
              ? 'No amount has been deducted. You can retry safely.'
              : 'Secured by Razorpay. Please do not close this screen.'}
          </Text>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
}
