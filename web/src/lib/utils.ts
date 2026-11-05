export function formatDate(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Money value rendered with exactly two decimals (handles string numerics). */
export function formatAmount(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

/** Sum money values in integer paise so binary float drift cannot leak out. */
export function sumAmounts(
  values: Array<string | number | null | undefined>,
): number {
  const paise = values.reduce<number>((total, value) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return total + (Number.isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);
  return paise / 100;
}

/** Service behind a wallet transaction: chat, audio call, video call or none. */
export function transactionService(t: any): 'chat' | 'audio_call' | 'video_call' | 'other' {
  const meta = t?.metadata || {};
  const description = String(t?.description || '').toLowerCase();
  const explicit = String(meta.serviceType || '').toLowerCase();
  if (explicit === 'chat') return 'chat';
  if (explicit === 'video_call' || explicit === 'video') return 'video_call';
  if (explicit === 'audio_call' || explicit === 'audio') return 'audio_call';

  if (t?.category === 'chat_charge') return 'chat';
  if (t?.category === 'call_charge') {
    return String(meta.callType || '').toLowerCase() === 'video' ||
      description.includes('video call')
      ? 'video_call'
      : 'audio_call';
  }
  if (t?.category === 'commission') {
    if (description.includes('video call')) return 'video_call';
    if (description.includes('audio call') || description.includes('from call')) {
      return 'audio_call';
    }
    if (description.includes('chat')) return 'chat';
  }
  return 'other';
}

/** Human label for a wallet/admin transaction row. */
export function transactionLabel(t: any): string {
  const meta = t?.metadata || {};
  const service = transactionService(t);
  const isCommission = t?.category === 'commission';
  const isPlatformFee = String(t?.description || '').toLowerCase().startsWith('platform fee');

  if (service === 'chat') {
    return isCommission ? (isPlatformFee ? 'Platform fee — chat' : 'Chat earnings') : 'Chat consultation';
  }
  if (service === 'video_call') {
    return isCommission ? (isPlatformFee ? 'Platform fee — video call' : 'Video call earnings') : 'Video call';
  }
  if (service === 'audio_call') {
    return isCommission ? (isPlatformFee ? 'Platform fee — audio call' : 'Audio call earnings') : 'Audio call';
  }

  const map: Record<string, string> = {
    add_funds: 'Wallet recharge',
    withdrawal: 'Withdrawal',
    gift: meta.giftName ? `Gift — ${meta.giftName}` : 'Gift',
    donation: 'Temple donation',
    order_payment: 'Store order',
    pooja_booking: meta.poojaName ? `Puja — ${meta.poojaName}` : 'Puja booking',
    refund: 'Refund to wallet',
  };
  if (map[t?.category]) return map[t?.category];
  if (isCommission) return isPlatformFee ? 'Platform fee' : 'Earnings';
  return t?.category
    ? String(t.category).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'Transaction';
}
