# Astro Shine - Project Prerequisites & Dependencies

## Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x or higher | JavaScript runtime |
| npm | 10.x or higher | Package manager |
| PostgreSQL | 16.x | Database |
| Docker | 24.x+ (optional) | Containerized PostgreSQL for dev |

## Quick Start

### 1. Clone and install
```bash
cd server
npm install --legacy-peer-deps
```

### 2. Start PostgreSQL
**Option A: Docker (recommended)**
```bash
docker compose up -d
```

**Option B: Local PostgreSQL**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE astro_shine;"
```

### 3. Configure environment

Each project has its own `.env` file. Copy the example files and adjust values:

**Server** (`server/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/astro_shine
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3000
```

**Mobile App** (`app/.env`):
```env
EXPO_PUBLIC_API_URL=http://10.229.125.238:3000
EXPO_PUBLIC_SOCKET_PATH=/ws
```

**Web Admin** (`web/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3067
```

### 4. Run migrations
```bash
# Direct SQL (recommended)
psql -U postgres -d astro_shine -f src/db/migrations/0000_crazy_dakota_north.sql

# Or via Drizzle (requires running PostgreSQL)
npx drizzle-kit push
```

### 5. Start server
```bash
npm run start:dev
# Server runs at http://localhost:3000/api/v1
```

### 6. Test
```bash
# See testing.md for complete API test results
curl http://localhost:3000/api/v1
# Output: "Hello World!"
```

## NPM Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/common | ^11.0.1 | NestJS core decorators/utilities |
| @nestjs/core | ^11.0.1 | NestJS runtime |
| @nestjs/platform-express | ^11.0.1 | Express HTTP adapter |
| @nestjs/config | latest | Environment configuration |
| drizzle-orm | ^0.45.2 | TypeScript ORM for PostgreSQL |
| drizzle-kit | ^0.31.10 | Migration generation tool |
| pg | ^8.22.0 | PostgreSQL driver |
| dotenv | ^17.4.2 | Environment variable loading |
| jsonwebtoken | ^9.0.3 | JWT token generation/verification |
| class-validator | latest | Request validation decorators |
| class-transformer | latest | Request object transformation |
| zod | latest | Schema validation |
| reflect-metadata | ^0.2.2 | NestJS dependency injection |
| rxjs | ^7.8.1 | Reactive programming lib |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/cli | ^11.0.0 | NestJS CLI tools |
| @nestjs/testing | ^11.0.1 | Testing utilities |
| @types/node | ^24.0.0 | Node.js type definitions |
| @types/pg | ^8.20.0 | PostgreSQL driver types |
| @types/jsonwebtoken | latest | JWT type definitions |
| typescript | ^5.7.3 | TypeScript compiler |
| jest | ^30.0.0 | Test runner |
| ts-jest | ^29.2.5 | Jest TypeScript transformer |
| prettier | ^3.4.2 | Code formatter |
| eslint | ^9.18.0 | Linter |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start production build |
| `npm run start:dev` | Start with hot-reload (watch mode) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:push` | Push schema directly to DB |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm test` | Run unit tests |
| `npm run lint` | Lint code |

## Database Schema

- **37 tables** covering: users, astrologers, admins, kundli, matchmaking, horoscope, panchang, wallets, transactions, commissions, calls, chat, gifts, donations, shop, orders, blogs, news, reviews, reports, notifications, live sessions, mandir pooja, support tickets, app releases, videos
- **16 enum types** for statuses, roles, types
- **45 foreign key constraints** with proper cascade/set-null rules
- See `database-schema.md` in project root for full documentation

## Project Structure

```
server/
├── src/
│   ├── main.ts                    # App entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── database/
│   │   └── database.module.ts     # DB connection (global)
│   ├── db/
│   │   ├── connection.ts          # Direct DB connection export
│   │   ├── enums/                 # 16 enum definitions
│   │   ├── schemas/               # 37 table schemas
│   │   └── migrations/            # SQL migration files
│   ├── common/
│   │   ├── filters/               # Exception filter
│   │   ├── pipes/                 # Validation pipes
│   │   ├── guards/                # Auth guard (JWT)
│   │   └── decorators/            # Custom decorators
│   └── modules/
│       ├── auth/                  # Authentication (JWT + OTP)
│       ├── users/                 # User CRUD
│       └── wallet/                # Wallet management
├── .env                           # Environment variables
├── docker-compose.yml             # PostgreSQL container
├── drizzle.config.ts              # Drizzle ORM config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies & scripts
```
