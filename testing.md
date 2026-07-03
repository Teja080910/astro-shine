# Astro Shine API - Testing Results

**Date:** 2026-07-02  
**Framework:** NestJS + PostgreSQL (Drizzle ORM)  
**Base URL:** `http://localhost:3000/api/v1`

---

## Test Results Summary: 90/90 PASS (100%)

### Auth (8 tests)
| # | Endpoint | Method | Test | Result |
|---|---|---|---|---|
| 1 | `/auth/register` | POST | Register user, token returned, no password leak | PASS |
| 2 | `/auth/login` | POST | Login returns token | PASS |
| 3 | `/auth/login` | POST | Wrong password returns 401 | PASS |
| 4 | `/auth/register` | POST | Duplicate email returns 401 | PASS |
| 5 | `/auth/send-otp` | POST | OTP generated | PASS |
| 6 | `/auth/verify-otp` | POST | Valid OTP creates/looks up user | PASS |
| 7 | `/auth/verify-otp` | POST | Invalid OTP returns 401 | PASS |

### Users (3) | Astrologers (4) | Admins (2) | Kundli (2) | Matchmaking (2) | Horoscope (2) | Panchang (2)
All CREATE/READ/UPDATE + verification, online status, search by query params — PASS

### Wallet (3) | Transactions (3) | Withdrawals (2) | Commission (2)
CRUD + add funds + approve/reject + status updates — PASS

### Calls (3) | Chat (3) | Gifts (3) | Donations (2)
CRUD + mark read + send/redeem gifts + filter by user/astrologer — PASS

### Shop (3) | Orders (4) | Blogs (3) | News (2) | Reviews (3)
CRUD + order items + slug lookup + visibility toggle — PASS

### Reports (2) | Notifications (3) | Settings (2) | API Keys (2)
CRUD + resolve reports + mark read + upsert settings — PASS

### Dynamic Links (2) | Website Content (2) | Live Sessions (3)
CRUD + lookup by page/section + start/end live sessions — PASS

### Mandir Pooja (3) | Support Tickets (3) | App Releases (2) | Videos (3)
CRUD + bookings + ticket replies — PASS

### Misc (2)
Soft delete (204) + 404 route — PASS

---

## Complete API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Auth Required |
|--------|----------|:---:|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/send-otp` | No |
| POST | `/auth/verify-otp` | No |

### Users (`/api/v1/users`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/users` | No |
| GET | `/users/:id` | No |
| POST | `/users` | No |
| PUT | `/users/:id` | No |
| DELETE | `/users/:id` (soft) | No |

### Astrologers (`/api/v1/astrologers`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/astrologers` | No |
| GET | `/astrologers/:id` | No |
| POST | `/astrologers` | No |
| PUT | `/astrologers/:id` | No |
| POST | `/astrologers/:id/verify` | No |
| PUT | `/astrologers/:id/online-status` | No |

### Admins (`/api/v1/admins`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/admins` | No |
| GET | `/admins/:id` | No |
| POST | `/admins` | No |

### Kundli (`/api/v1/kundli`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/kundli?userId=` | No |
| GET | `/kundli/:id` | No |
| POST | `/kundli` | No |
| PUT | `/kundli/:id` | No |

### Matchmaking (`/api/v1/matchmaking`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/matchmaking?userId=` | No |
| GET | `/matchmaking/:id` | No |
| POST | `/matchmaking` | No |

### Horoscope (`/api/v1/horoscope`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/horoscope?sign=&date=` | No |
| POST | `/horoscope` | No |

### Panchang (`/api/v1/panchang`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/panchang?date=` | No |
| POST | `/panchang` | No |

### Wallet (`/api/v1/wallet`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/wallet` | Bearer |
| POST | `/wallet/add-funds` | Bearer |

### Transactions (`/api/v1/transactions`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/transactions?walletId=` | No |
| GET | `/transactions/:id` | No |
| POST | `/transactions` | No |
| PUT | `/transactions/:id/status` | No |

### Withdrawals (`/api/v1/withdrawals`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/withdrawals` | No |
| POST | `/withdrawals` | No |
| PUT | `/withdrawals/:id/approve` | No |
| PUT | `/withdrawals/:id/reject` | No |

### Commissions (`/api/v1/commissions`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/commissions` | No |
| GET | `/commissions/logs?astrologerId=` | No |
| POST | `/commissions` | No |
| PUT | `/commissions/:id` | No |

### Calls (`/api/v1/calls`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/calls?userId=&astrologerId=` | No |
| GET | `/calls/:id` | No |
| POST | `/calls` | No |
| PUT | `/calls/:id/status` | No |

### Chat (`/api/v1/chat`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/chat?callId=` | No |
| GET | `/chat/:id` | No |
| POST | `/chat` | No |
| PUT | `/chat/:id/read` | No |

### Gifts (`/api/v1/gifts`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/gifts` | No |
| GET | `/gifts/transactions?userId=` | No |
| POST | `/gifts` | No |
| POST | `/gifts/send` | No |
| PUT | `/gifts/transactions/:id/redeem` | No |

### Donations (`/api/v1/donations`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/donations?userId=` | No |
| POST | `/donations` | No |

### Shop (`/api/v1/shop`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/shop?category=` | No |
| GET | `/shop/:id` | No |
| POST | `/shop` | No |
| PUT | `/shop/:id` | No |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/orders?userId=` | No |
| GET | `/orders/:id` | No |
| GET | `/orders/:id/items` | No |
| POST | `/orders` | No |
| POST | `/orders/:id/items` | No |
| PUT | `/orders/:id/status` | No |

### Blogs (`/api/v1/blogs`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/blogs` | No |
| GET | `/blogs/slug/:slug` | No |
| GET | `/blogs/:id` | No |
| POST | `/blogs` | No |
| PUT | `/blogs/:id` | No |
| DELETE | `/blogs/:id` | No |

### News (`/api/v1/news`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/news` (active only) | No |
| GET | `/news/admin` (all) | No |
| GET | `/news/:id` | No |
| POST | `/news` | No |
| PUT | `/news/:id` | No |

### Reviews (`/api/v1/reviews`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/reviews?astrologerId=&userId=` | No |
| GET | `/reviews/:id` | No |
| POST | `/reviews` | No |
| PUT | `/reviews/:id/visibility` | No |

### Reports (`/api/v1/reports`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/reports` | No |
| GET | `/reports/:id` | No |
| POST | `/reports` | No |
| PUT | `/reports/:id/resolve` | No |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/notifications?userId=&astrologerId=` | No |
| GET | `/notifications/:id` | No |
| POST | `/notifications` | No |
| PUT | `/notifications/:id/read` | No |
| POST | `/notifications/read-all` | No |

### Settings (`/api/v1/settings`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/settings` | No |
| GET | `/settings/:key` | No |
| POST | `/settings/:key` | No |

### API Keys (`/api/v1/api-keys`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/api-keys?provider=` | No |
| POST | `/api-keys` | No |
| PUT | `/api-keys/:id` | No |

### Dynamic Links (`/api/v1/dynamic-links`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/dynamic-links` (active) | No |
| GET | `/dynamic-links/admin` (all) | No |
| GET | `/dynamic-links/page/:pageName` | No |
| POST | `/dynamic-links` | No |
| PUT | `/dynamic-links/:id` | No |

### Website Content (`/api/v1/website-content`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/website-content` (active) | No |
| GET | `/website-content/admin` (all) | No |
| GET | `/website-content/section/:section` | No |
| POST | `/website-content/section/:section` | No |

### Live Sessions (`/api/v1/live-sessions`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/live-sessions` | No |
| GET | `/live-sessions/live` | No |
| GET | `/live-sessions/astrologer/:astrologerId` | No |
| GET | `/live-sessions/:id` | No |
| POST | `/live-sessions` | No |
| PUT | `/live-sessions/:id/status` | No |

### Mandir Pooja (`/api/v1/mandir-pooja`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/mandir-pooja` | No |
| GET | `/mandir-pooja/admin` | No |
| GET | `/mandir-pooja/:id` | No |
| POST | `/mandir-pooja` | No |
| PUT | `/mandir-pooja/:id` | No |
| GET | `/mandir-pooja/bookings/list?userId=&poojaId=` | No |
| POST | `/mandir-pooja/bookings` | No |
| PUT | `/mandir-pooja/bookings/:id/status` | No |

### Support Tickets (`/api/v1/support`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/support/tickets?userId=` | No |
| GET | `/support/tickets/:id` | No |
| POST | `/support/tickets` | No |
| PUT | `/support/tickets/:id/assign` | No |
| PUT | `/support/tickets/:id/resolve` | No |
| GET | `/support/tickets/:id/replies` | No |
| POST | `/support/tickets/:id/replies` | No |

### App Releases (`/api/v1/releases`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/releases?appName=&platform=` | No |
| GET | `/releases/:id` | No |
| POST | `/releases` | No |
| PUT | `/releases/:id` | No |

### Videos (`/api/v1/videos`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| GET | `/videos?category=` | No |
| GET | `/videos/admin` | No |
| GET | `/videos/:id` | No |
| POST | `/videos` | No |
| PUT | `/videos/:id` | No |

### File Upload (`/api/v1/upload`)
| Method | Endpoint | Auth |
|--------|----------|:---:|
| POST | `/upload` (multipart) | No |
| DELETE | `/upload/:filename` | No |

---

## Database

- 37 tables, 16 enum types, 45 FK constraints
- Migration: `src/db/migrations/0000_crazy_dakota_north.sql`
- PostgreSQL 16

## Tech Stack

NestJS 11, TypeScript 5.7, Drizzle ORM 0.45, PostgreSQL 16, JWT + crypto (scrypt), Zod, class-validator, npm
