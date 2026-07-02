# Astro Shine (Astro Vetri) — Implementation Plan

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Apps** (User, Astrologer, Admin) | React Native (TypeScript) |
| **Backend API** | NestJS (TypeScript) |
| **Database** | PostgreSQL |
| **Monorepo** | Turborepo |
| **ORM** | Drizzle |
| **Real-time** | WebSockets (Socket.io) |
| **Payments** | Stripe / Razorpay |
| **Voice/Video** | Agora.io / Zoom SDK |
| **Auth** | JWT + OTP |

---

## Design System — Cosmic Luxury

### Theme Identity
Premium, modern, minimal, elegant, trustworthy, calm — spiritual without looking outdated.

### Color Palette

| Token | Value |
|---|---|
| **Primary** | `#6D28D9` |
| **Primary Gradient** | `#6D28D9 → #9333EA → #A855F7` |
| **Secondary** | `#7C3AED` |
| **Accent Gold** | `#F59E0B` |
| **Success** | `#22C55E` |
| **Warning** | `#F97316` |
| **Danger** | `#EF4444` |
| **Background** | `#09090B` |
| **Surface** | `#111827` |
| **Card** | `rgba(255,255,255,0.08)` |
| **Border** | `rgba(255,255,255,0.12)` |
| **Text Primary** | `#FFFFFF` |
| **Text Secondary** | `#B6B6C2` |
| **Divider** | `rgba(255,255,255,0.08)` |

### Corner Radii

| Element | Radius |
|---|---|
| Buttons | 18px |
| Cards | 24px |
| Bottom Sheets | 28px |
| Inputs | 16px |
| Avatar | Circular |

### Typography
- **Font**: Inter (all weights)
- No decorative astrology fonts
- Hierarchy: Large Hero → Page Title → Section Title → Card Title → Body → Caption

### Icons
- Rounded Material Symbols (simple, minimal)
- Premium zodiac illustrations where needed

### Design Language
- Large rounded cards
- Floating action buttons
- Glassmorphism cards with blur effects
- Soft shadows & smooth gradients
- Minimal icons, beautiful empty states
- Large illustrations, premium spacing

### Animations
- Fade & slide transitions
- Shared element transitions
- Button ripple
- Skeleton loaders
- 60 FPS, no flashy effects

### Bottom Navigation
- Floating bar with blur background
- Rounded container
- Animated active indicator
- 5 tabs: Home, Astrologers, Wallet, Chat, Profile

### Dark Mode
- Dark mode is default
- Light mode supported

---

## Architecture Overview

```
astro-shine/
├── apps/
│   ├── api/                    # NestJS backend
│   ├── app-user/               # React Native - User App
│   ├── app-astrologer/         # React Native - Astrologer App
│   └── app-admin/              # React Native - Admin Panel
├── packages/
│   ├── shared-types/           # TypeScript interfaces/types shared across all apps
│   ├── shared-ui/              # Reusable UI components (buttons, inputs, modals)
│   ├── api-client/             # Auto-generated API client / fetch wrappers
│   └── config/                 # Shared ESLint, TSConfig, Tailwind configs
└── docker-compose.yml          # PostgreSQL + dev services
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**1.1 Monorepo Scaffolding**
- Initialize Turborepo with pnpm workspaces
- Set up TypeScript, ESLint, Prettier across all packages
- Configure Docker Compose for PostgreSQL

**1.2 Database Schema (Drizzle)**
- Design and create all models:
  - Users, Astrologers, Admins
  - Profiles, Documents, Verifications
  - Kundli, Horoscope, Panchang records
  - Wallets, Transactions, Orders
  - Calls/Chat logs, Commissions
  - Gifts, Donations, Shop Products
  - Blogs, News, Reviews, Reports
  - Notifications, App Settings

**1.3 NestJS Backend Foundation**
- Project scaffolding with NestJS CLI
- Auth module (JWT + OTP login/register)
- Prisma module integration
- Global exception filters, pipes, interceptors
- File upload module (for documents, profile pics)

**1.4 Design Tokens & Theme System**
- Create design tokens package (colors, typography, spacing, radii, shadows)
- Implement Cosmic Luxury theme provider (dark + light mode)
- Glassmorphism utility components (BlurView, GlassCard)
- Gradient components (LinearGradient wrappers)
- Animation presets (fade, slide, shared element)

**1.5 React Native Foundation**
- Scaffold 3 React Native apps (User, Astrologer, Admin)
- Shared UI component library setup (using design tokens)
- Navigation structure (React Navigation)
- Auth flow (login/register screens)
- Dark/Light mode theming

---

### Phase 2: Core Auth & Profiles (Week 3-4)

**2.1 Backend**
- Auth endpoints: Login, Register, OTP verify, Refresh token
- Profile CRUD (User, Astrologer, Admin)
- Astrologer verification flow (document upload, approval)
- Delete account functionality

**2.2 Mobile**
- Login/Register screens (all 3 apps)
- Onboarding/Walkthrough screens (User, Astrologer)
- Edit Profile screens
- Astrologer document upload & verification status
- Delete account flow

---

### Phase 3: Core Astrology Features (Week 5-6)

**3.1 Backend**
- Kundli API endpoints (birth chart calculation)
- Matchmaking API (guna matching)
- Daily Horoscope (zodiac-based)
- Panchang API (daily calendar)
- Zodiac Sign API

**3.2 Mobile**
- Home Dashboard (all apps)
- Kundli input & chart display (User)
- Matchmaking form & results (User)
- Daily Horoscope view (User)
- Panchang calendar view (User)
- Zodiac sign details (User)

---

### Phase 4: Communication (Week 7-8)

**4.1 Backend**
- Chat module (WebSocket + REST for history)
- Voice/Video call signaling (Agora token generation)
- Call/chat logging for admin
- Online/offline status management
- API keys management for voice/video/chat providers

**4.2 Mobile**
- Chat screen with astrologers (User & Astrologer)
- Voice call UI (User & Astrologer)
- Video call UI (User & Astrologer)
- Online/Offline toggle (Astrologer)
- Call/chat history (Admin)
- Live astrologers list (User)
- Category-wise astrologer directory (User)

---

### Phase 5: Financials (Week 9-10)

**5.1 Backend**
- Payment gateway integration (Stripe/Razorpay)
- Wallet system (add funds, deduct, balance)
- Withdrawal system (Astrologer requests, Admin approval)
- Commission settings (Admin configures per astrologer)
- Commission calculation & logging
- Gift system (send, receive, redeem)
- Donation endpoint
- Order & Transaction history

**5.2 Mobile**
- Add Funds screen with payment gateway (User)
- Wallet dashboard (User, Astrologer)
- Withdraw funds (Astrologer)
- Transaction history (all apps)
- Order history (User)
- Commission logs (Astrologer)
- Send Gifts to astrologers (User)
- Receive & Redeem Gifts (Astrologer)
- Donation page (User)
- Shop Astro Products (User)

---

### Phase 6: Admin & Content Management (Week 11-12)

**6.1 Backend**
- Admin Dashboard stats API
- User CRUD management
- Astrologer CRUD management
- Review/Rating management
- Report system (report astrologer, report user)
- News CRUD
- Blog CRUD
- Notification system (app-wide push)
- Dynamic page link settings
- Website content editor API

**6.2 Mobile (Admin App)**
- Admin Dashboard with stats/charts
- User management list & detail
- Astrologer management list & detail
- Astrologer verification approval
- Commission settings editor
- Payment gateway config
- Call/chat logs viewer
- API keys settings
- Transaction logs viewer
- Reviews management
- Deposits & withdrawals management
- Notification composer
- News & Blog editor
- Dynamic link updater
- Website content editor

**6.3 Mobile (User & Astrologer)**
- Notification inbox
- Blog reader
- News feed
- Report user/astrologer
- Help & Support screen
- Terms & Conditions screen
- About App screen

---

### Phase 7: Go Live & Shop (Week 13)

**7.1 Backend**
- Go Live / Streaming session management
- Shop product CRUD
- Order management

**7.2 Mobile**
- Go Live streaming (Astrologer)
- Live sessions viewer (User)
- Shop product catalog & purchase (User)
- Mandir Pooja section (User)

---

### Phase 8: Polish & Release (Week 14)

- End-to-end testing
- Performance optimization
- App store assets & metadata
- Play Store build & release (User & Astrologer apps)
- Admin app release (internal distribution)
- Documentation

---

## Database Schema Overview (Drizzle)

```
User              Astrologer          Admin
├─ id              ├─ id               ├─ id
├─ name            ├─ name             ├─ email
├─ email           ├─ email            ├─ password
├─ phone           ├─ phone            ├─ role
├─ password        ├─ password         └─ ...
├─ profile         ├─ specialization
├─ kundli          ├─ experience
├─ wallet          ├─ verification
├─ orders          ├─ documents
├─ transactions    ├─ commission
├─ reviews         ├─ wallet
└─ ...             ├─ transactions
                   ├─ callLogs
                   ├─ chatLogs
                   ├─ schedule
                   └─ ...

Kundli              Transaction         CallLog
├─ id               ├─ id               ├─ id
├─ userId           ├─ userId?          ├─ astrologerId
├─ birthDate        ├─ astrologerId?    ├─ userId
├─ birthTime        ├─ amount           ├─ type (voice/video)
├─ birthPlace       ├─ type             ├─ startTime
├─ chartData        ├─ status           ├─ endTime
└─ ...              ├─ reference        ├─ duration
                    └─ ...              ├─ cost
                                        └─ ...

ChatMessage         Gift                Commission
├─ id               ├─ id               ├─ id
├─ senderId         ├─ senderId         ├─ astrologerId
├─ receiverId       ├─ receiverId       ├─ percentage
├─ text             ├─ giftItemId       ├─ earned
├─ type (text/      ├─ value            ├─ paid
│  image/file)      └─ ...              └─ ...
├─ callId?
├─ timestamp
└─ ...
```

---

## Key Design Decisions

1. **Monorepo with Turborepo** — Shared types, UI components, and configs across all 3 React Native apps + NestJS backend
2. **Drizzle ORM** — Type-safe, lightweight, SQL-like query builder with great PostgreSQL support
3. **React Navigation** — Standard navigation for all 3 React Native apps
4. **Socket.io** — Real-time chat and online status
5. **Agora.io** — Voice/video call SDK (battle-tested, good React Native support)
6. **Stripe/Razorpay** — Payment gateway (choose based on target market)
7. **JWT + OTP Auth** — Email/password + phone OTP for flexible authentication
8. **Feature-based NestJS modules** — Each domain (auth, kundli, wallet, etc.) is a self-contained module
