import axios, { AxiosInstance, AxiosError } from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, User, Astrologer, Admin, KundliRecord, MatchmakingRecord, HoroscopeRecord, PanchangRecord, Wallet, Transaction, WithdrawalRequest, Commission, CommissionLog, CallLog, ChatMessage, Gift, GiftTransaction, Donation, ShopProduct, Order, OrderItem, Blog, NewsItem, Review, Report, Notification, AppSetting, ApiKey, DynamicLink, WebsiteContent, LiveSession, MandirPooja, PoojaBooking, SupportTicket, TicketReply, AppRelease, Video } from '@astro-shine/shared-types';

const BASE_URL = __DEV__ ? 'http://10.0.2.2:3067/api/v1' : 'https://api.astroshine.com/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 15000 });
    this.client.interceptors.request.use((config) => {
      if (this.token) config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });
  }

  setToken(token: string | null) { this.token = token; }

  private async get<T>(path: string, params?: any): Promise<T> { const r = await this.client.get(path, { params }); return r.data; }
  private async post<T>(path: string, data?: any): Promise<T> { const r = await this.client.post(path, data); return r.data; }
  private async put<T>(path: string, data?: any): Promise<T> { const r = await this.client.put(path, data); return r.data; }
  private async del(path: string): Promise<void> { await this.client.delete(path); }

  // Auth
  auth = {
    register: (d: RegisterRequest) => this.post<AuthResponse>('/auth/register', d),
    login: (d: LoginRequest) => this.post<AuthResponse>('/auth/login', d),
    sendOtp: (phone: string) => this.post<{ otp: string }>('/auth/send-otp', { phone }),
    verifyOtp: (phone: string, otp: string) => this.post<AuthResponse>('/auth/verify-otp', { phone, otp }),
  };

  // Users
  users = {
    list: () => this.get<User[]>('/users'),
    get: (id: string) => this.get<User>(`/users/${id}`),
    update: (id: string, d: Partial<User>) => this.put<User>(`/users/${id}`, d),
    delete: (id: string) => this.del(`/users/${id}`),
  };

  // Astrologers
  astrologers = {
    list: () => this.get<Astrologer[]>('/astrologers'),
    get: (id: string) => this.get<Astrologer>(`/astrologers/${id}`),
    create: (d: any) => this.post<Astrologer>('/astrologers', d),
    update: (id: string, d: any) => this.put<Astrologer>(`/astrologers/${id}`, d),
    verify: (id: string, status: string, note?: string) => this.post<Astrologer>(`/astrologers/${id}/verify`, { status, note }),
    updateStatus: (id: string, status: string) => this.put<Astrologer>(`/astrologers/${id}/online-status`, { status }),
  };

  // Admins
  admins = {
    list: () => this.get<Admin[]>('/admins'),
    get: (id: string) => this.get<Admin>(`/admins/${id}`),
    create: (d: any) => this.post<Admin>('/admins', d),
  };

  // Kundli
  kundli = {
    byUser: (userId: string) => this.get<KundliRecord[]>('/kundli', { userId }),
    get: (id: string) => this.get<KundliRecord>(`/kundli/${id}`),
    create: (d: any) => this.post<KundliRecord>('/kundli', d),
    update: (id: string, d: any) => this.put<KundliRecord>(`/kundli/${id}`, d),
  };

  // Matchmaking
  matchmaking = {
    byUser: (userId: string) => this.get<MatchmakingRecord[]>('/matchmaking', { userId }),
    get: (id: string) => this.get<MatchmakingRecord>(`/matchmaking/${id}`),
    create: (d: any) => this.post<MatchmakingRecord>('/matchmaking', d),
  };

  // Horoscope
  horoscope = {
    bySign: (sign: string, date?: string) => this.get<HoroscopeRecord[]>('/horoscope', { sign, date }),
    create: (d: any) => this.post<HoroscopeRecord>('/horoscope', d),
  };

  // Panchang
  panchang = {
    byDate: (date: string) => this.get<PanchangRecord>(`/panchang?date=${date}`),
    create: (d: any) => this.post<PanchangRecord>('/panchang', d),
  };

  // Wallet
  wallet = {
    get: () => this.get<Wallet>('/wallet'),
    addFunds: (amount: string) => this.post<Wallet>('/wallet/add-funds', { amount }),
  };

  // Transactions
  transactions = {
    list: (walletId?: string) => this.get<Transaction[]>('/transactions', { walletId }),
    get: (id: string) => this.get<Transaction>(`/transactions/${id}`),
    create: (d: any) => this.post<Transaction>('/transactions', d),
    updateStatus: (id: string, status: string) => this.put<Transaction>(`/transactions/${id}/status`, { status }),
  };

  // Withdrawals
  withdrawals = {
    list: () => this.get<WithdrawalRequest[]>('/withdrawals'),
    create: (d: any) => this.post<WithdrawalRequest>('/withdrawals', d),
    approve: (id: string, adminId: string) => this.put<WithdrawalRequest>(`/withdrawals/${id}/approve`, { adminId }),
    reject: (id: string, adminId: string, note?: string) => this.put<WithdrawalRequest>(`/withdrawals/${id}/reject`, { adminId, note }),
  };

  // Commissions
  commissions = {
    list: () => this.get<Commission[]>('/commissions'),
    create: (d: any) => this.post<Commission>('/commissions', d),
    update: (id: string, d: any) => this.put<Commission>(`/commissions/${id}`, d),
    logs: (astrologerId?: string) => this.get<CommissionLog[]>('/commissions/logs', { astrologerId }),
  };

  // Calls
  calls = {
    list: (filters?: { userId?: string; astrologerId?: string }) => this.get<CallLog[]>('/calls', filters),
    get: (id: string) => this.get<CallLog>(`/calls/${id}`),
    create: (d: any) => this.post<CallLog>('/calls', d),
    updateStatus: (id: string, status: string) => this.put<CallLog>(`/calls/${id}/status`, { status }),
  };

  // Chat
  chat = {
    byCall: (callId: string) => this.get<ChatMessage[]>('/chat', { callId }),
    get: (id: string) => this.get<ChatMessage>(`/chat/${id}`),
    send: (d: any) => this.post<ChatMessage>('/chat', d),
    markRead: (id: string) => this.put<ChatMessage>(`/chat/${id}/read`),
  };

  // Gifts
  gifts = {
    list: () => this.get<Gift[]>('/gifts'),
    get: (id: string) => this.get<Gift>(`/gifts/${id}`),
    create: (d: any) => this.post<Gift>('/gifts', d),
    send: (d: any) => this.post<GiftTransaction>('/gifts/send', d),
    transactions: (userId?: string) => this.get<GiftTransaction[]>('/gifts/transactions', { userId }),
    redeem: (id: string) => this.put<GiftTransaction>(`/gifts/transactions/${id}/redeem`),
  };

  // Donations
  donations = {
    list: (userId?: string) => this.get<Donation[]>('/donations', { userId }),
    create: (d: any) => this.post<Donation>('/donations', d),
  };

  // Shop
  shop = {
    list: (category?: string) => this.get<ShopProduct[]>('/shop', { category }),
    get: (id: string) => this.get<ShopProduct>(`/shop/${id}`),
    create: (d: any) => this.post<ShopProduct>('/shop', d),
    update: (id: string, d: any) => this.put<ShopProduct>(`/shop/${id}`, d),
  };

  // Orders
  orders = {
    list: (userId?: string) => this.get<Order[]>('/orders', { userId }),
    get: (id: string) => this.get<Order>(`/orders/${id}`),
    create: (d: any) => this.post<Order>('/orders', d),
    updateStatus: (id: string, status: string) => this.put<Order>(`/orders/${id}/status`, { status }),
    getItems: (orderId: string) => this.get<OrderItem[]>(`/orders/${orderId}/items`),
    addItem: (orderId: string, d: any) => this.post<OrderItem>(`/orders/${orderId}/items`, d),
  };

  // Blogs
  blogs = {
    list: () => this.get<Blog[]>('/blogs'),
    bySlug: (slug: string) => this.get<Blog>(`/blogs/slug/${slug}`),
    get: (id: string) => this.get<Blog>(`/blogs/${id}`),
    create: (d: any) => this.post<Blog>('/blogs', d),
    update: (id: string, d: any) => this.put<Blog>(`/blogs/${id}`, d),
    delete: (id: string) => this.del(`/blogs/${id}`),
  };

  // News
  news = {
    list: () => this.get<NewsItem[]>('/news'),
    get: (id: string) => this.get<NewsItem>(`/news/${id}`),
    create: (d: any) => this.post<NewsItem>('/news', d),
    update: (id: string, d: any) => this.put<NewsItem>(`/news/${id}`, d),
  };

  // Reviews
  reviews = {
    list: (filters?: { astrologerId?: string; userId?: string }) => this.get<Review[]>('/reviews', filters),
    get: (id: string) => this.get<Review>(`/reviews/${id}`),
    create: (d: any) => this.post<Review>('/reviews', d),
    toggleVisibility: (id: string, isVisible: boolean) => this.put<Review>(`/reviews/${id}/visibility`, { isVisible }),
  };

  // Reports
  reports = {
    list: () => this.get<Report[]>('/reports'),
    get: (id: string) => this.get<Report>(`/reports/${id}`),
    create: (d: any) => this.post<Report>('/reports', d),
    resolve: (id: string, adminId: string) => this.put<Report>(`/reports/${id}/resolve`, { adminId }),
  };

  // Notifications
  notifications = {
    list: (filters?: { userId?: string; astrologerId?: string }) => this.get<Notification[]>('/notifications', filters),
    get: (id: string) => this.get<Notification>(`/notifications/${id}`),
    create: (d: any) => this.post<Notification>('/notifications', d),
    markRead: (id: string) => this.put<Notification>(`/notifications/${id}/read`),
    markAllRead: (d: { userId?: string; astrologerId?: string }) => this.post<void>('/notifications/read-all', d),
  };

  // Settings
  settings = {
    list: () => this.get<AppSetting[]>('/settings'),
    get: (key: string) => this.get<AppSetting>(`/settings/${key}`),
    set: (key: string, value: any) => this.post<AppSetting>(`/settings/${key}`, { value }),
  };

  // API Keys
  apiKeys = {
    list: (provider?: string) => this.get<ApiKey[]>('/api-keys', { provider }),
    create: (d: any) => this.post<ApiKey>('/api-keys', d),
    update: (id: string, d: any) => this.put<ApiKey>(`/api-keys/${id}`, d),
  };

  // Dynamic Links
  dynamicLinks = {
    list: () => this.get<DynamicLink[]>('/dynamic-links'),
    byPage: (pageName: string) => this.get<DynamicLink>(`/dynamic-links/page/${pageName}`),
    create: (d: any) => this.post<DynamicLink>('/dynamic-links', d),
    update: (id: string, d: any) => this.put<DynamicLink>(`/dynamic-links/${id}`, d),
  };

  // Website Content
  websiteContent = {
    list: () => this.get<WebsiteContent[]>('/website-content'),
    bySection: (section: string) => this.get<WebsiteContent>(`/website-content/section/${section}`),
    upsert: (section: string, content: any) => this.post<WebsiteContent>(`/website-content/section/${section}`, { content }),
  };

  // Live Sessions
  liveSessions = {
    list: () => this.get<LiveSession[]>('/live-sessions'),
    live: () => this.get<LiveSession[]>('/live-sessions/live'),
    byAstrologer: (id: string) => this.get<LiveSession[]>(`/live-sessions/astrologer/${id}`),
    get: (id: string) => this.get<LiveSession>(`/live-sessions/${id}`),
    create: (d: any) => this.post<LiveSession>('/live-sessions', d),
    updateStatus: (id: string, status: string) => this.put<LiveSession>(`/live-sessions/${id}/status`, { status }),
  };

  // Mandir Pooja
  mandirPooja = {
    list: () => this.get<MandirPooja[]>('/mandir-pooja'),
    get: (id: string) => this.get<MandirPooja>(`/mandir-pooja/${id}`),
    create: (d: any) => this.post<MandirPooja>('/mandir-pooja', d),
    update: (id: string, d: any) => this.put<MandirPooja>(`/mandir-pooja/${id}`, d),
    bookings: (filters?: { userId?: string; poojaId?: string }) => this.get<PoojaBooking[]>('/mandir-pooja/bookings/list', filters),
    createBooking: (d: any) => this.post<PoojaBooking>('/mandir-pooja/bookings', d),
    updateBookingStatus: (id: string, status: string) => this.put<PoojaBooking>(`/mandir-pooja/bookings/${id}/status`, { status }),
  };

  // Support
  support = {
    tickets: (userId?: string) => this.get<SupportTicket[]>('/support/tickets', { userId }),
    getTicket: (id: string) => this.get<SupportTicket>(`/support/tickets/${id}`),
    createTicket: (d: any) => this.post<SupportTicket>('/support/tickets', d),
    assign: (id: string, adminId: string) => this.put<SupportTicket>(`/support/tickets/${id}/assign`, { adminId }),
    resolve: (id: string) => this.put<SupportTicket>(`/support/tickets/${id}/resolve`),
    replies: (ticketId: string) => this.get<TicketReply[]>(`/support/tickets/${ticketId}/replies`),
    addReply: (ticketId: string, d: any) => this.post<TicketReply>(`/support/tickets/${ticketId}/replies`, d),
  };

  // Releases
  releases = {
    list: (filters?: { appName?: string; platform?: string }) => this.get<AppRelease[]>('/releases', filters),
    get: (id: string) => this.get<AppRelease>(`/releases/${id}`),
    create: (d: any) => this.post<AppRelease>('/releases', d),
    update: (id: string, d: any) => this.put<AppRelease>(`/releases/${id}`, d),
  };

  // Videos
  videos = {
    list: (category?: string) => this.get<Video[]>('/videos', { category }),
    get: (id: string) => this.get<Video>(`/videos/${id}`),
    create: (d: any) => this.post<Video>('/videos', d),
    update: (id: string, d: any) => this.put<Video>(`/videos/${id}`, d),
  };
}

export const api = new ApiClient();
