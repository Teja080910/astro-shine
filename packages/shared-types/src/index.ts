// Shared TypeScript interfaces matching Astro Shine backend models

// ============ Enums ============
export type UserRole = 'user' | 'astrologer' | 'admin';
export type AuthProvider = 'email' | 'google' | 'apple';
export type Gender = 'male' | 'female' | 'other';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type OnlineStatus = 'online' | 'offline' | 'busy';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type TransactionCategory = 'add_funds' | 'withdrawal' | 'call_charge' | 'chat_charge' | 'gift' | 'donation' | 'commission' | 'order_payment' | 'refund';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type CommissionType = 'percentage' | 'fixed';
export type CallStatus = 'initiated' | 'ongoing' | 'completed' | 'missed' | 'cancelled';
export type CallType = 'audio' | 'video';
export type MessageType = 'text' | 'image' | 'voice' | 'file';
export type BlogStatus = 'draft' | 'published' | 'archived';
export type ReportReason = 'spam' | 'harassment' | 'fake_profile' | 'inappropriate' | 'other';
export type NotificationType = 'system' | 'promotional' | 'transactional' | 'reminder';

// ============ Auth ============
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; phone?: string; }
export interface AuthResponse { token: string; user: User; }
export interface OtpResponse { otp: string; }
export interface VerifyOtpRequest { phone: string; otp: string; }

// ============ User ============
export interface User {
  id: string; name: string; email: string; phone?: string;
  avatar?: string; gender?: Gender; dateOfBirth?: string;
  authProvider: AuthProvider; isActive: boolean;
  fcmToken?: string; onboardingCompleted: boolean;
  lastLoginAt?: string; createdAt: string; updatedAt: string; deletedAt?: string;
}

// ============ Astrologer ============
export interface Astrologer {
  id: string; name: string; email: string; phone?: string;
  avatar?: string; gender?: Gender; dateOfBirth?: string;
  bio?: string; experience: number; specialization: string[];
  languages: string[]; skills: string[];
  pricePerMin: string; rating: string; totalReviews: number;
  totalCalls: number; totalEarnings: string;
  verificationStatus: VerificationStatus;
  verificationDoc?: string[]; verificationNote?: string;
  onlineStatus: OnlineStatus; isActive: boolean;
  fcmToken?: string; onboardingCompleted: boolean;
  lastLoginAt?: string; createdAt: string; updatedAt: string;
}

// ============ Admin ============
export interface Admin {
  id: string; name: string; email: string;
  role: string; avatar?: string; isActive: boolean;
  lastLoginAt?: string; createdAt: string; updatedAt: string;
}

// ============ Kundli ============
export interface KundliRecord {
  id: string; userId: string; name: string; gender: Gender;
  dateOfBirth: string; timeOfBirth: string; placeOfBirth: string;
  latitude?: number; longitude?: number; timezone?: string;
  chartData?: any; planetaryPositions?: any; createdAt: string;
}

// ============ Matchmaking ============
export interface MatchmakingRecord {
  id: string; userId: string;
  person1Name: string; person1Dob: string; person1Tob: string; person1Place: string;
  person2Name: string; person2Dob: string; person2Tob: string; person2Place: string;
  matchScore?: number; matchDetails?: any; createdAt: string;
}

// ============ Horoscope ============
export interface HoroscopeRecord {
  id: string; zodiacSign: string; date: string; prediction: string;
  luckyNumber?: number; luckyColor?: string; mood?: string; createdAt: string;
}

// ============ Panchang ============
export interface PanchangRecord {
  id: string; date: string; tithi?: string; nakshatra?: string;
  yoga?: string; karana?: string; sunrise?: string; sunset?: string;
  moonrise?: string; moonset?: string; rahuKaal?: any; data?: any; createdAt: string;
}

// ============ Wallet ============
export interface Wallet {
  id: string; userId?: string; astrologerId?: string;
  balance: string; totalAdded: string; totalDeducted: string;
  currency: string; createdAt: string; updatedAt: string;
}

// ============ Transaction ============
export interface Transaction {
  id: string; walletId: string; userId?: string; astrologerId?: string;
  type: TransactionType; category: TransactionCategory;
  amount: string; fee: string; netAmount: string;
  status: TransactionStatus; referenceId?: string;
  gatewayResponse?: any; description?: string; metadata?: any;
  createdAt: string; updatedAt: string;
}

// ============ Withdrawal ============
export interface WithdrawalRequest {
  id: string; astrologerId: string; amount: string;
  status: WithdrawalStatus; bankAccount: any;
  adminNote?: string; processedBy?: string; processedAt?: string;
  createdAt: string; updatedAt: string;
}

// ============ Commission ============
export interface Commission {
  id: string; astrologerId: string; type: CommissionType;
  value: string; minAmount?: string; maxCap?: string;
  isActive: boolean; createdAt: string; updatedAt: string;
}
export interface CommissionLog {
  id: string; astrologerId: string; transactionId?: string; callId?: string;
  amount: string; percentage: string; totalEarned: string; platformFee: string;
  createdAt: string;
}

// ============ Calls & Chat ============
export interface CallLog {
  id: string; astrologerId: string; userId: string;
  type: CallType; status: CallStatus;
  startedAt?: string; endedAt?: string; duration?: number;
  cost?: string; ratePerMin?: string;
  agoraChannel?: string; agoraToken?: string; recordingUrl?: string;
  createdAt: string;
}
export interface ChatMessage {
  id: string; callId: string; senderId: string; senderRole: UserRole;
  type: MessageType; content?: string; mediaUrl?: string;
  duration?: number; isRead: boolean; readAt?: string; createdAt: string;
}

// ============ Gifts ============
export interface Gift {
  id: string; name: string; image?: string; price: string;
  isActive: boolean; createdAt: string; updatedAt: string;
}
export interface GiftTransaction {
  id: string; giftId: string; senderId: string; receiverId: string;
  transactionId?: string; isRedeemed: boolean; redeemedAt?: string;
  createdAt: string;
}

// ============ Donation ============
export interface Donation {
  id: string; userId?: string; amount: string;
  transactionId?: string; message?: string; createdAt: string;
}

// ============ Shop & Orders ============
export interface ShopProduct {
  id: string; name: string; description?: string;
  price: string; comparePrice?: string; images: string[];
  category?: string; stock: number; isActive: boolean;
  createdAt: string; updatedAt: string;
}
export interface Order {
  id: string; userId: string; totalAmount: string;
  status: string; shippingAddress?: any; transactionId?: string;
  createdAt: string; updatedAt: string;
}
export interface OrderItem {
  id: string; orderId: string; productId: string;
  quantity: number; unitPrice: string; totalPrice: string;
  createdAt: string;
}

// ============ Blogs & News ============
export interface Blog {
  id: string; title: string; slug: string; content: string;
  excerpt?: string; coverImage?: string; authorId?: string;
  authorRole?: UserRole; status: BlogStatus; tags: string[];
  viewCount: number; publishedAt?: string; createdAt: string; updatedAt: string;
}
export interface NewsItem {
  id: string; title: string; content: string; image?: string;
  isActive: boolean; createdAt: string; updatedAt: string;
}

// ============ Reviews ============
export interface Review {
  id: string; userId: string; astrologerId: string;
  rating: number; comment?: string; callId?: string;
  isVisible: boolean; createdAt: string; updatedAt: string;
}

// ============ Reports ============
export interface Report {
  id: string; reporterId: string; reporterRole: UserRole;
  reportedUserId?: string; reportedAstrologerId?: string;
  reason: ReportReason; description?: string;
  status: string; resolvedBy?: string; resolvedAt?: string;
  createdAt: string; updatedAt: string;
}

// ============ Notifications ============
export interface Notification {
  id: string; userId?: string; astrologerId?: string;
  type: NotificationType; title: string; body: string;
  data?: any; isRead: boolean; readAt?: string; image?: string;
  createdAt: string;
}

// ============ Settings & API Keys ============
export interface AppSetting { id: string; key: string; value: any; description?: string; }
export interface ApiKey { id: string; provider: string; keyName: string; apiKey: string; isActive: boolean; }

// ============ Dynamic Links & Website Content ============
export interface DynamicLink { id: string; pageName: string; url: string; isActive: boolean; }
export interface WebsiteContent { id: string; section: string; content: any; isActive: boolean; }

// ============ Live Sessions ============
export interface LiveSession {
  id: string; astrologerId: string; title?: string; thumbnail?: string;
  status: string; scheduledAt?: string; startedAt?: string; endedAt?: string;
  viewerCount: number; maxViewers?: number;
  agoraChannel?: string; agoraToken?: string; createdAt: string; updatedAt: string;
}

// ============ Mandir Pooja ============
export interface MandirPooja {
  id: string; name: string; description?: string; image?: string;
  price: string; isActive: boolean; createdAt: string; updatedAt: string;
}
export interface PoojaBooking {
  id: string; userId: string; poojaId: string; bookingDate: string;
  amount: string; transactionId?: string; status: string;
  notes?: string; createdAt: string; updatedAt: string;
}

// ============ Support ============
export interface SupportTicket {
  id: string; userId?: string; astrologerId?: string;
  subject: string; message: string; status: string; priority: string;
  assignedTo?: string; resolvedAt?: string; createdAt: string; updatedAt: string;
}
export interface TicketReply {
  id: string; ticketId: string; senderId: string; senderRole: UserRole;
  message: string; attachments?: string[]; createdAt: string;
}

// ============ App Release ============
export interface AppRelease {
  id: string; appName: string; platform: string; version: string;
  buildNumber: number; releaseNotes?: string; downloadUrl?: string;
  isMandatory: boolean; isActive: boolean; releasedAt?: string;
}

// ============ Video ============
export interface Video {
  id: string; title: string; description?: string; url: string;
  thumbnail?: string; category?: string; duration?: number;
  isActive: boolean; createdAt: string; updatedAt: string;
}

// ============ Muhurat ============
export interface MuhuratCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MuhuratItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  date: string;
  time: string;
  description?: string;
  createdBy?: string;
  createdByName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ API Response ============
export interface ApiError { statusCode: number; message: string; timestamp: string; path: string; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }
