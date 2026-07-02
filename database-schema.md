# Astro Shine — Database Schema (Drizzle ORM)

## Conventions

- All tables use `uuid` primary keys
- Timestamps: `createdAt`, `updatedAt` (auto-set)
- Soft delete: `deletedAt` (nullable timestamp)
- Foreign keys: `onDelete: cascade` where appropriate
- Indexes on all foreign keys and frequently queried columns

---

## Enums

```sql
-- User / Astrologer / Admin
user_role          = 'user' | 'astrologer' | 'admin'
auth_provider      = 'email' | 'google' | 'apple'
gender             = 'male' | 'female' | 'other'
verification_status = 'pending' | 'approved' | 'rejected'
online_status      = 'online' | 'offline' | 'busy'

-- Financial
transaction_type   = 'credit' | 'debit'
transaction_status = 'pending' | 'success' | 'failed' | 'refunded'
transaction_category = 'add_funds' | 'withdrawal' | 'call_charge' | 'chat_charge' | 'gift' | 'donation' | 'commission' | 'order_payment' | 'refund'
withdrawal_status  = 'pending' | 'approved' | 'rejected' | 'completed'
commission_type    = 'percentage' | 'fixed'

-- Communication
call_status        = 'initiated' | 'ongoing' | 'completed' | 'missed' | 'cancelled'
call_type          = 'audio' | 'video'
message_type       = 'text' | 'image' | 'voice' | 'file'

-- Content
blog_status        = 'draft' | 'published' | 'archived'
report_reason      = 'spam' | 'harassment' | 'fake_profile' | 'inappropriate' | 'other'
notification_type  = 'system' | 'promotional' | 'transactional' | 'reminder'
```

---

## Tables

### 1. users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default uuid() | |
| name | varchar(255) | not null | |
| email | varchar(255) | unique, not null | |
| phone | varchar(20) | unique, nullable | |
| password | varchar(255) | nullable | null for social login |
| avatar | text | nullable | URL |
| gender | gender | nullable | |
| dateOfBirth | date | nullable | |
| authProvider | auth_provider | not null, default 'email' | |
| authProviderId | varchar(255) | nullable | Google/Apple sub |
| fcmToken | text | nullable | push notifications |
| isActive | boolean | not null, default true | |
| lastLoginAt | timestamp | nullable | |
| onboardingCompleted | boolean | not null, default false | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |
| deletedAt | timestamp | nullable | |

**Indexes:** email, phone, authProviderId

---

### 2. astrologers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default uuid() | |
| name | varchar(255) | not null | |
| email | varchar(255) | unique, not null | |
| phone | varchar(20) | unique, nullable | |
| password | varchar(255) | nullable | |
| avatar | text | nullable | |
| gender | gender | nullable | |
| dateOfBirth | date | nullable | |
| authProvider | auth_provider | not null, default 'email' | |
| authProviderId | varchar(255) | nullable | |
| bio | text | nullable | |
| experience | integer | not null, default 0 | years |
| specialization | text[] | not null, default '[]' | e.g. Vedic, Tarot, Numerology |
| languages | text[] | not null, default '[]' | |
| skills | text[] | not null, default '[]' | |
| pricePerMin | decimal(10,2) | not null, default 0 | |
| rating | decimal(3,2) | not null, default 0 | 0.00 - 5.00 |
| totalReviews | integer | not null, default 0 | |
| totalCalls | integer | not null, default 0 | |
| totalEarnings | decimal(12,2) | not null, default 0 | |
| verificationStatus | verification_status | not null, default 'pending' | |
| verificationDoc | text[] | nullable | document URLs |
| verificationNote | text | nullable | admin note on reject |
| onlineStatus | online_status | not null, default 'offline' | |
| isActive | boolean | not null, default true | |
| fcmToken | text | nullable | |
| lastLoginAt | timestamp | nullable | |
| onboardingCompleted | boolean | not null, default false | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |
| deletedAt | timestamp | nullable | |

**Indexes:** email, phone, verificationStatus, onlineStatus, specialization (GIN), rating

---

### 3. admins

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default uuid() | |
| name | varchar(255) | not null | |
| email | varchar(255) | unique, not null | |
| password | varchar(255) | not null | |
| role | varchar(50) | not null, default 'admin' | super_admin, admin, moderator |
| avatar | text | nullable | |
| isActive | boolean | not null, default true | |
| lastLoginAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** email, role

---

### 4. astrologer_schedules

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| dayOfWeek | integer | not null | 0=Sun, 1=Mon ... 6=Sat |
| startTime | time | not null | |
| endTime | time | not null | |
| isAvailable | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** (astrologerId, dayOfWeek)

---

### 5. kundli_records

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, not null | |
| name | varchar(255) | not null | |
| gender | gender | not null | |
| dateOfBirth | date | not null | |
| timeOfBirth | time | not null | |
| placeOfBirth | varchar(255) | not null | |
| latitude | decimal(10,7) | nullable | |
| longitude | decimal(10,7) | nullable | |
| timezone | varchar(50) | nullable | |
| chartData | jsonb | nullable | full chart response |
| planetaryPositions | jsonb | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** userId

---

### 6. matchmaking_records

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, not null | |
| person1Name | varchar(255) | not null | |
| person1Dob | date | not null | |
| person1Tob | time | not null | |
| person1Place | varchar(255) | not null | |
| person2Name | varchar(255) | not null | |
| person2Dob | date | not null | |
| person2Tob | time | not null | |
| person2Place | varchar(255) | not null | |
| matchScore | integer | nullable | out of 36 (guna) |
| matchDetails | jsonb | nullable | detailed breakdown |
| createdAt | timestamp | not null, default now() | |

**Indexes:** userId

---

### 7. horoscope_records

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| zodiacSign | varchar(20) | not null | |
| date | date | not null | |
| prediction | text | not null | |
| luckyNumber | integer | nullable | |
| luckyColor | varchar(50) | nullable | |
| mood | varchar(50) | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** (zodiacSign, date) — unique

---

### 8. panchang_records

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| date | date | not null, unique | |
| tithi | varchar(100) | nullable | |
| nakshatra | varchar(100) | nullable | |
| yoga | varchar(100) | nullable | |
| karana | varchar(100) | nullable | |
| sunrise | time | nullable | |
| sunset | time | nullable | |
| moonrise | time | nullable | |
| moonset | time | nullable | |
| rahuKaal | jsonb | nullable | start/end time |
| data | jsonb | nullable | full response |
| createdAt | timestamp | not null, default now() | |

**Indexes:** date

---

### 9. wallets

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, nullable | null if astrologer wallet |
| astrologerId | uuid | FK -> astrologers.id, nullable | null if user wallet |
| balance | decimal(12,2) | not null, default 0 | |
| totalAdded | decimal(12,2) | not null, default 0 | |
| totalDeducted | decimal(12,2) | not null, default 0 | |
| currency | varchar(10) | not null, default 'INR' | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** userId, astrologerId
**Check:** exactly one of userId or astrologerId must be set

---

### 10. transactions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| walletId | uuid | FK -> wallets.id, not null | |
| userId | uuid | FK -> users.id, nullable | |
| astrologerId | uuid | FK -> astrologers.id, nullable | |
| type | transaction_type | not null | |
| category | transaction_category | not null | |
| amount | decimal(12,2) | not null | |
| fee | decimal(12,2) | not null, default 0 | platform fee |
| netAmount | decimal(12,2) | not null | amount - fee |
| status | transaction_status | not null, default 'pending' | |
| referenceId | varchar(255) | nullable | payment gateway ref |
| gatewayResponse | jsonb | nullable | full gateway response |
| description | text | nullable | |
| metadata | jsonb | nullable | extra context |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** walletId, userId, astrologerId, status, category, createdAt

---

### 11. withdrawal_requests

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| amount | decimal(12,2) | not null | |
| status | withdrawal_status | not null, default 'pending' | |
| bankAccount | jsonb | not null | account details |
| adminNote | text | nullable | |
| processedBy | uuid | FK -> admins.id, nullable | |
| processedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** astrologerId, status

---

### 12. commissions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null, unique | one per astrologer |
| type | commission_type | not null, default 'percentage' | |
| value | decimal(5,2) | not null | percentage or fixed amount |
| minAmount | decimal(10,2) | nullable | min before commission applies |
| maxCap | decimal(10,2) | nullable | max commission per transaction |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** astrologerId

---

### 13. commission_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| transactionId | uuid | FK -> transactions.id, nullable | |
| callId | uuid | FK -> call_logs.id, nullable | |
| amount | decimal(12,2) | not null | commission earned |
| percentage | decimal(5,2) | not null | rate applied |
| totalEarned | decimal(12,2) | not null | astrologer's share |
| platformFee | decimal(12,2) | not null | platform's share |
| createdAt | timestamp | not null, default now() | |

**Indexes:** astrologerId, transactionId, callId

---

### 14. call_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| userId | uuid | FK -> users.id, not null | |
| type | call_type | not null | |
| status | call_status | not null, default 'initiated' | |
| startedAt | timestamp | nullable | |
| endedAt | timestamp | nullable | |
| duration | integer | nullable | seconds |
| cost | decimal(10,2) | nullable | total cost |
| ratePerMin | decimal(10,2) | nullable | rate at time of call |
| agoraChannel | varchar(255) | nullable | |
| agoraToken | text | nullable | |
| recordingUrl | text | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** astrologerId, userId, status, createdAt

---

### 15. chat_messages

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| callId | uuid | FK -> call_logs.id, not null | groups messages by session |
| senderId | uuid | FK, not null | references users or astrologers |
| senderRole | user_role | not null | 'user' or 'astrologer' |
| type | message_type | not null, default 'text' | |
| content | text | nullable | for text messages |
| mediaUrl | text | nullable | for image/voice/file |
| duration | integer | nullable | voice message duration (sec) |
| isRead | boolean | not null, default false | |
| readAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** callId, senderId, createdAt

---

### 16. gifts

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | varchar(255) | not null | |
| image | text | nullable | |
| price | decimal(10,2) | not null | |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

---

### 17. gift_transactions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| giftId | uuid | FK -> gifts.id, not null | |
| senderId | uuid | FK -> users.id, not null | |
| receiverId | uuid | FK -> astrologers.id, not null | |
| transactionId | uuid | FK -> transactions.id, nullable | payment |
| isRedeemed | boolean | not null, default false | |
| redeemedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** senderId, receiverId, giftId

---

### 18. donations

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, nullable | anonymous if null |
| amount | decimal(10,2) | not null | |
| transactionId | uuid | FK -> transactions.id, nullable | |
| message | text | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** userId

---

### 19. shop_products

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | varchar(255) | not null | |
| description | text | nullable | |
| price | decimal(10,2) | not null | |
| comparePrice | decimal(10,2) | nullable | for showing discount |
| images | text[] | not null, default '[]' | |
| category | varchar(100) | nullable | |
| stock | integer | not null, default 0 | |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** category, isActive

---

### 20. orders

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, not null | |
| totalAmount | decimal(12,2) | not null | |
| status | varchar(50) | not null, default 'pending' | pending, confirmed, shipped, delivered, cancelled |
| shippingAddress | jsonb | nullable | |
| transactionId | uuid | FK -> transactions.id, nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** userId, status

---

### 21. order_items

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| orderId | uuid | FK -> orders.id, not null | |
| productId | uuid | FK -> shop_products.id, not null | |
| quantity | integer | not null, default 1 | |
| unitPrice | decimal(10,2) | not null | |
| totalPrice | decimal(12,2) | not null | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** orderId, productId

---

### 22. blogs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | varchar(255) | not null | |
| slug | varchar(255) | unique, not null | |
| content | text | not null | |
| excerpt | text | nullable | |
| coverImage | text | nullable | |
| authorId | uuid | nullable | references users, astrologers, or admins |
| authorRole | user_role | nullable | 'user', 'astrologer', or 'admin' |
| status | blog_status | not null, default 'draft' | |
| tags | text[] | not null, default '[]' | |
| viewCount | integer | not null, default 0 | |
| publishedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** slug, status, publishedAt, tags (GIN)

---

### 23. news

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | varchar(255) | not null | |
| content | text | not null | |
| image | text | nullable | |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

---

### 24. reviews

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, not null | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| rating | integer | not null | 1-5 |
| comment | text | nullable | |
| callId | uuid | FK -> call_logs.id, nullable | |
| isVisible | boolean | not null, default true | admin toggle |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** (userId, astrologerId) — unique, astrologerId, rating

---

### 25. reports

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| reporterId | uuid | FK, not null | references users or astrologers |
| reporterRole | user_role | not null | |
| reportedUserId | uuid | FK -> users.id, nullable | |
| reportedAstrologerId | uuid | FK -> astrologers.id, nullable | |
| reason | report_reason | not null | |
| description | text | nullable | |
| status | varchar(50) | not null, default 'pending' | pending, reviewed, dismissed |
| resolvedBy | uuid | FK -> admins.id, nullable | |
| resolvedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** reporterId, status

---

### 26. notifications

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, nullable | |
| astrologerId | uuid | FK -> astrologers.id, nullable | |
| type | notification_type | not null | |
| title | varchar(255) | not null | |
| body | text | not null | |
| data | jsonb | nullable | deep link payload |
| isRead | boolean | not null, default false | |
| readAt | timestamp | nullable | |
| image | text | nullable | |
| createdAt | timestamp | not null, default now() | |

**Indexes:** (userId, isRead), (astrologerId, isRead), createdAt

---

### 27. app_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| key | varchar(100) | unique, not null | |
| value | jsonb | not null | |
| description | text | nullable | |
| updatedBy | uuid | FK -> admins.id, nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** key

---

### 28. api_keys

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| provider | varchar(100) | not null | agora, stripe, razorpay, etc. |
| keyName | varchar(100) | not null | |
| apiKey | text | not null | encrypted |
| apiSecret | text | nullable | encrypted |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** provider

---

### 29. dynamic_links

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| pageName | varchar(100) | unique, not null | e.g. terms, privacy, about |
| url | text | not null | |
| isActive | boolean | not null, default true | |
| updatedBy | uuid | FK -> admins.id, nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** pageName

---

### 30. website_content

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| section | varchar(100) | unique, not null | e.g. hero, about, footer |
| content | jsonb | not null | structured content |
| isActive | boolean | not null, default true | |
| updatedBy | uuid | FK -> admins.id, nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** section

---

### 31. live_sessions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| astrologerId | uuid | FK -> astrologers.id, not null | |
| title | varchar(255) | nullable | |
| thumbnail | text | nullable | |
| status | varchar(50) | not null, default 'scheduled' | scheduled, live, ended |
| scheduledAt | timestamp | nullable | |
| startedAt | timestamp | nullable | |
| endedAt | timestamp | nullable | |
| viewerCount | integer | not null, default 0 | |
| maxViewers | integer | nullable | |
| agoraChannel | varchar(255) | nullable | |
| agoraToken | text | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** astrologerId, status

---

### 32. mandir_pooja

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | varchar(255) | not null | |
| description | text | nullable | |
| image | text | nullable | |
| price | decimal(10,2) | not null | |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

---

### 33. pooja_bookings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, not null | |
| poojaId | uuid | FK -> mandir_pooja.id, not null | |
| bookingDate | date | not null | |
| amount | decimal(10,2) | not null | |
| transactionId | uuid | FK -> transactions.id, nullable | |
| status | varchar(50) | not null, default 'pending' | pending, confirmed, completed, cancelled |
| notes | text | nullable | user's prayer request |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** userId, poojaId, status

---

### 34. support_tickets

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK -> users.id, nullable | |
| astrologerId | uuid | FK -> astrologers.id, nullable | |
| subject | varchar(255) | not null | |
| message | text | not null | |
| status | varchar(50) | not null, default 'open' | open, in_progress, resolved, closed |
| priority | varchar(20) | not null, default 'normal' | low, normal, high, urgent |
| assignedTo | uuid | FK -> admins.id, nullable | |
| resolvedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** userId, astrologerId, status, assignedTo

---

### 35. ticket_replies

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| ticketId | uuid | FK -> support_tickets.id, not null | |
| senderId | uuid | FK, not null | |
| senderRole | user_role | not null | |
| message | text | not null | |
| attachments | text[] | nullable | file URLs |
| createdAt | timestamp | not null, default now() | |

**Indexes:** ticketId

---

### 36. app_releases

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| appName | varchar(50) | not null | 'user' or 'astrologer' |
| platform | varchar(20) | not null | 'android' or 'ios' |
| version | varchar(20) | not null | e.g. 1.0.0 |
| buildNumber | integer | not null | |
| releaseNotes | text | nullable | |
| downloadUrl | text | nullable | |
| isMandatory | boolean | not null, default false | force update |
| isActive | boolean | not null, default true | |
| releasedAt | timestamp | nullable | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** (appName, platform, version)

---

### 37. videos

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | varchar(255) | not null | |
| description | text | nullable | |
| url | text | not null | |
| thumbnail | text | nullable | |
| category | varchar(100) | nullable | |
| duration | integer | nullable | seconds |
| isActive | boolean | not null, default true | |
| createdAt | timestamp | not null, default now() | |
| updatedAt | timestamp | not null, auto-update | |

**Indexes:** category, isActive

---

## Relations Summary

```
users
  └── kundli_records (1:N)
  └── matchmaking_records (1:N)
  └── wallet (1:1)
  └── transactions (1:N)
  └── orders (1:N)
  └── reviews (1:N)
  └── gift_transactions (as sender) (1:N)
  └── donations (1:N)
  └── notifications (1:N)
  └── pooja_bookings (1:N)
  └── support_tickets (1:N)
  └── blogs (as author) (1:N)

astrologers
  └── astrologer_schedules (1:N)
  └── wallet (1:1)
  └── commissions (1:1)
  └── commission_logs (1:N)
  └── withdrawal_requests (1:N)
  └── call_logs (1:N)
  └── reviews (1:N)
  └── gift_transactions (as receiver) (1:N)
  └── live_sessions (1:N)
  └── notifications (1:N)
  └── support_tickets (1:N)
  └── blogs (as author) (1:N)

admins
  └── blogs (as author) (1:N)
  └── withdrawal_requests (processedBy) (1:N)
  └── reports (resolvedBy) (1:N)
  └── app_settings (updatedBy) (1:N)
  └── dynamic_links (updatedBy) (1:N)
  └── website_content (updatedBy) (1:N)
  └── support_tickets (assignedTo) (1:N)

call_logs
  └── chat_messages (1:N)
  └── reviews (1:N)
  └── commission_logs (1:N)

transactions
  └── commission_logs (1:N)
  └── gift_transactions (1:N)
  └── donations (1:N)
  └── orders (1:N)
  └── pooja_bookings (1:N)
```
