import type { Transaction } from './types';

/**
 * Wallet rows must say *what the money was for*, not the accounting category.
 *
 * The database only records `commission` for every astrologer credit and
 * `refund` for a couple of unrelated flows, so rendering `t.category` showed
 * "Commission" / "Refund" and told the user nothing about whether the entry
 * came from a chat, an audio call or a video call.
 *
 * Everything here derives from fields the API already returns:
 *   - `metadata.serviceType`   (new rows)
 *   - `metadata.callType`      (call charges)
 *   - `description`            (older rows written before metadata existed)
 */
export type TransactionService = 'chat' | 'audio_call' | 'video_call' | 'other';

export function transactionService(t: Transaction): TransactionService {
  const meta = (t.metadata || {}) as Record<string, any>;
  const description = String(t.description || '').toLowerCase();

  const explicit = String(meta.serviceType || '').toLowerCase();
  if (explicit === 'chat') return 'chat';
  if (explicit === 'video_call' || explicit === 'video') return 'video_call';
  if (explicit === 'audio_call' || explicit === 'audio') return 'audio_call';

  if (t.category === 'chat_charge') return 'chat';
  if (t.category === 'call_charge') {
    const callType = String(meta.callType || '').toLowerCase();
    return callType === 'video' || description.includes('video call')
      ? 'video_call'
      : 'audio_call';
  }

  // Commission rows created before `metadata.serviceType` existed.
  if (t.category === 'commission') {
    if (description.includes('video call')) return 'video_call';
    if (description.includes('audio call') || description.includes('from call')) {
      return 'audio_call';
    }
    if (description.includes('chat')) return 'chat';
  }

  return 'other';
}

/** Human label for a wallet transaction row. */
export function transactionLabel(t: Transaction): string {
  const meta = (t.metadata || {}) as Record<string, any>;
  const service = transactionService(t);
  const isCommission = t.category === 'commission';
  const isPlatformFee = String(t.description || '')
    .toLowerCase()
    .startsWith('platform fee');

  if (service === 'chat') {
    if (isCommission) return isPlatformFee ? 'Platform fee — chat' : 'Chat earnings';
    return 'Chat consultation';
  }
  if (service === 'video_call') {
    if (isCommission) {
      return isPlatformFee ? 'Platform fee — video call' : 'Video call earnings';
    }
    return 'Video call';
  }
  if (service === 'audio_call') {
    if (isCommission) {
      return isPlatformFee ? 'Platform fee — audio call' : 'Audio call earnings';
    }
    return 'Audio call';
  }

  switch (t.category) {
    case 'add_funds':
      return 'Wallet recharge';
    case 'withdrawal':
      return 'Withdrawal';
    case 'gift':
      return meta.giftName ? `Gift — ${meta.giftName}` : 'Gift';
    case 'donation':
      return 'Temple donation';
    case 'order_payment':
      return 'Store order';
    case 'pooja_booking':
      return meta.poojaName ? `Puja — ${meta.poojaName}` : 'Puja booking';
    case 'refund':
      return 'Refund to wallet';
    case 'commission':
      return isPlatformFee ? 'Platform fee' : 'Earnings';
    default:
      return t.category
        ? t.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Transaction';
  }
}

/** Icon + tint for a wallet transaction row. */
export function transactionIcon(t: Transaction): { name: string; color: string } {
  const service = transactionService(t);
  if (service === 'chat') return { name: 'chatbubble-ellipses', color: '#0D9488' };
  if (service === 'video_call') return { name: 'videocam', color: '#7C3AED' };
  if (service === 'audio_call') return { name: 'call', color: '#0284C7' };

  switch (t.category) {
    case 'gift':
      return { name: 'gift', color: '#EE7B10' };
    case 'donation':
      return { name: 'heart', color: '#C21415' };
    case 'pooja_booking':
      return { name: 'flame', color: '#EE7B10' };
    case 'add_funds':
      return { name: 'wallet', color: '#16A34A' };
    case 'withdrawal':
      return { name: 'arrow-up-circle', color: '#F59E0B' };
    case 'refund':
      return { name: 'return-down-back', color: '#16A34A' };
    case 'commission':
      return { name: 'cash', color: '#23A867' };
    default:
      return { name: 'receipt', color: '#8B8B8D' };
  }
}
