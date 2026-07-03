import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'astrologer', 'admin']);
export const authProvider = pgEnum('auth_provider', ['email', 'google', 'apple']);
export const gender = pgEnum('gender', ['male', 'female', 'other']);
export const verificationStatus = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const onlineStatus = pgEnum('online_status', ['online', 'offline', 'busy']);
export const transactionType = pgEnum('transaction_type', ['credit', 'debit']);
export const transactionStatus = pgEnum('transaction_status', ['pending', 'success', 'failed', 'refunded']);
export const transactionCategory = pgEnum('transaction_category', [
  'add_funds',
  'withdrawal',
  'call_charge',
  'chat_charge',
  'gift',
  'donation',
  'commission',
  'order_payment',
  'refund',
]);
export const withdrawalStatus = pgEnum('withdrawal_status', ['pending', 'approved', 'rejected', 'completed']);
export const commissionType = pgEnum('commission_type', ['percentage', 'fixed']);
export const callStatus = pgEnum('call_status', ['initiated', 'ongoing', 'completed', 'missed', 'cancelled']);
export const callType = pgEnum('call_type', ['audio', 'video']);
export const messageType = pgEnum('message_type', ['text', 'image', 'voice', 'file']);
export const blogStatus = pgEnum('blog_status', ['draft', 'published', 'archived']);
export const reportReason = pgEnum('report_reason', ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other']);
export const notificationType = pgEnum('notification_type', ['system', 'promotional', 'transactional', 'reminder']);
