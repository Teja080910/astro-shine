# Astro Shine

Astrology consultation platform with real-time chat and payment integration.

## Quick Start

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database and Razorpay credentials
npm run db:migrate       # Apply database migrations
npm run start:dev
```

### Mobile App

```bash
cd app
npm install
cp .env.example .env
# Edit .env with your server URL and Razorpay key
npx expo start
```

## Build APK

```bash
cd app
npm run prebuild          # Generate android/ folder (required first time)
npm run apk:debug         # Debug APK
npm run apk:release       # Release APK
npm run aab:release       # Release AAB (for Play Store)
```

APK output: `app/android/app/build/outputs/apk/`

## Project Structure

- `server/` — NestJS backend (PostgreSQL + Drizzle ORM)
- `app/` — Expo React Native mobile app
- `web/` — Next.js admin panel
- `packages/` — Shared types and API client

## Payment Integration (Razorpay)

### Server-Side

- **PaymentsModule** — Order creation, verification, webhook handling, refunds
- **PaymentsRescueService** — Cron-based reconciliation for stuck transactions (every 5 min)
- **30-day timeout** — Auto-fails orders unresolved for 30+ days
- **Webhook processing** — Signature verification + idempotent event handling
- **Metadata** — JSONB column stores complete business context per payment

### Database Tables

- `payment_orders` — Tracks Razorpay orders and payment lifecycle
- `payment_events` — Webhook event audit log with idempotency key

### Mobile Screens

- `PaymentScreen` — Opens Razorpay Checkout
- `PaymentSuccessScreen` — Payment confirmation
- `PaymentFailureScreen` — Error display with retry

### Environment Variables

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay API Key ID (public) |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret (server only) |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID, for mobile |

## Database Migrations

```bash
cd server
npm run db:generate       # Generate new migration from schema changes
npm run db:migrate        # Apply pending migrations
npm run db:push           # Push schema directly (dev only)
npm run db:studio         # Open Drizzle Studio
```

Migration files: `server/src/db/migrations/`
