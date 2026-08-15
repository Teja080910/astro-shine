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

## Build APK / AAB

```bash
cd app
npm run prebuild              # Generate android/ folder (required first time)
npm run aab                   # Build release AAB (for Play Store)
```

Output: `app/android/app/build/outputs/bundle/release/app-release.aab`

### Release Signing

```bash
# Generate keystore (one time)
keytool -genkey -v -keystore android/app/release.keystore -alias astroshine -keyalg RSA -keysize 2048 -validity 10000

# Build signed AAB
cd android && ./gradlew bundleRelease
```

**Keystore**: `app/android/app/release.keystore`  
**Alias**: `astroshine`  
**Password**: `astroshine123`

### Package Name

- **Android**: `com.astroshine.app`
- **iOS**: `com.astroshine.app`

Configured in `app/app.json`.

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
| `RAZORPAYX_KEY_ID` | RazorpayX API Key ID for payouts (server only) |
| `RAZORPAYX_KEY_SECRET` | RazorpayX API Key Secret for payouts (server only) |
| `RAZORPAYX_DEFAULT_ACCOUNT` | RazorpayX payout account number used for transfers |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID, for mobile |

### Payouts (RazorpayX)

Withdrawals approved by an admin automatically trigger a RazorpayX payout to the
astrologer's bank account:

1. A RazorpayX **contact** is created/retrieved for the astrologer.
2. A **fund account** is created/retrieved for their bank details.
3. A **payout** is initiated (IMPS, queue_if_low_balance).
4. The withdrawal request is marked `completed` when the payout is processed.

Payout reference data (`payout_id`, `payout_utr`, `payout_status`) is stored on the
`withdrawal_requests` table and surfaced in the admin panel. Payouts require a
separate RazorpayX account — the keys are distinct from the standard Razorpay keys.

## Database Migrations

```bash
cd server
npm run db:generate       # Generate new migration from schema changes
npm run db:migrate        # Apply pending migrations
npm run db:push           # Push schema directly (dev only)
npm run db:studio         # Open Drizzle Studio
```

Migration files: `server/src/db/migrations/`
