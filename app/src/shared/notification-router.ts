import type { Notification } from './types';

export type Role = 'user' | 'astrologer' | 'admin';

export interface NotificationTarget {
  screen: string;
  params?: Record<string, any>;
}

const USER_TABS = ['Home', 'Astrologers', 'Muhurat', 'Wallet', 'Chat', 'Profile'];
const ASTROLOGER_TABS = ['Home', 'Muhurat', 'Wallet', 'Chat', 'Profile'];

const USER_ROUTES = [
  ...USER_TABS,
  'AstrologerList',
  'AstrologerDetail',
  'Kundli',
  'Matchmaking',
  'Panchang',
  'Shop',
  'OrderHistory',
  'Videos',
  'Notifications',
  'Blogs',
  'BlogDetail',
  'News',
  'NewsDetail',
  'Support',
  'TicketDetail',
  'EditProfile',
  'MandirPooja',
  'MandirPoojaDetail',
  'Donation',
  'Gifts',
  'Report',
  'ChatRoom',
];

const ASTROLOGER_ROUTES = [
  ...ASTROLOGER_TABS,
  'Schedule',
  'Documents',
  'CommissionLogs',
  'GoLive',
  'EditProfile',
  'Support',
  'TicketDetail',
  'Blogs',
  'BlogDetail',
  'CreateBlog',
  'Notifications',
  'Withdrawals',
  'Reviews',
  'Consultations',
  'Gifts',
  'ChatRoom',
];

const SCREEN_PARAMS: Record<string, string[]> = {
  BlogDetail: ['blogId'],
  NewsDetail: ['newsId'],
  TicketDetail: ['ticketId'],
  AdminTicketDetail: ['ticketId'],
  AstrologerDetail: ['id'],
  MandirPoojaDetail: ['poojaId'],
  ChatRoom: [
    'conversationId',
    'participantId',
    'participantRole',
    'participantName',
    'participantAvatar',
  ],
};

function extractParams(screen: string, source: any): Record<string, any> | undefined {
  const keys = SCREEN_PARAMS[screen];
  if (!keys) return undefined;
  const params: Record<string, any> = {};
  for (const key of keys) {
    if (source?.[key] != null) params[key] = source[key];
  }
  if (source?.itemId != null && params[keys[0]] == null) {
    params[keys[0]] = source.itemId;
  }
  return Object.keys(params).length ? params : undefined;
}

export function resolveNotificationTarget(
  notification: Notification | null | undefined,
  role: Role,
): NotificationTarget | null {
  if (!notification) return null;
  const data: any = notification.data || {};

  const build = (screen: string): NotificationTarget | null => {
    if (role === 'admin') {
      if (screen === 'AdminTicketDetail') {
        return { screen, params: extractParams(screen, data) };
      }
      if (screen === 'AdminSupport') return { screen };
      return null;
    }

    const tabs = role === 'astrologer' ? ASTROLOGER_TABS : USER_TABS;
    const routes = role === 'astrologer' ? ASTROLOGER_ROUTES : USER_ROUTES;
    if (tabs.includes(screen)) {
      return { screen: 'Main', params: { screen } };
    }
    if (routes.includes(screen)) {
      return { screen, params: extractParams(screen, data) };
    }
    return null;
  };

  if (typeof data.screen === 'string') {
    const target = build(data.screen);
    if (target) return target;
  }

  if (data.blogId) return build('BlogDetail');
  if (data.newsId) return build('NewsDetail');
  if (data.ticketId) {
    return build(role === 'admin' ? 'AdminTicketDetail' : 'TicketDetail');
  }
  if (data.poojaId) return build('MandirPoojaDetail');
  if (data.astrologerId) return build('AstrologerDetail');
  if (data.conversationId) return build('ChatRoom');

  switch (notification.type) {
    case 'transactional':
      return build('Wallet');
    case 'reminder':
      return build('Muhurat');
    case 'promotional':
      return build('Blogs');
    default:
      return build('Support');
  }
}
