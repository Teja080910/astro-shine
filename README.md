# Astro Shine

Astrology consultation platform with real-time chat.

## Quick Start

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run start:dev
```

### Mobile App

```bash
cd app
npm install
cp .env.example .env
# Edit .env with your server URL
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
