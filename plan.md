# Wallet, Recharge, Revenue Distribution & Redemption — Implementation Plan

---

## Project Analysis Summary

### Server Modules (NestJS v11, PostgreSQL 16, Drizzle ORM v0.45)

| Module | Files | Status |
|--------|-------|--------|
| **Wallet** | `wallet.service.ts`, `wallet.controller.ts`, `wallet.module.ts` | Existing — basic CRUD, no balance validation calls |
| **Payments** | `payments.service.ts`, `payments.controller.ts`, `payments.module.ts`, `payment.dto.ts`, `rescue.service.ts` | Existing — Razorpay integration working |
| **Transactions** | `transactions.service.ts`, `transactions.controller.ts`, `transactions.module.ts` | Existing — CRUD only |
| **Commission** | `commission.service.ts`, `commission.controller.ts`, `commission.module.ts` | Existing — CRUD for astrologer commission % |
| **Withdrawal** | `withdrawal.service.ts`, `withdrawal.controller.ts`, `withdrawal.module.ts` | Existing — CRUD for withdrawal requests |
| **Calls** | `calls.service.ts`, `calls.controller.ts`, `calls.gateway.ts`, `calls.module.ts` | Existing — calculates cost on endCall but NEVER deducts from wallet |
| **Conversations** | `conversations.service.ts`, `conversations.controller.ts`, `conversations.module.ts`, `chat.gateway.ts` | Existing — WebSocket chat, no charging logic |
| **Admin** | `admin.module.ts`, `admin.controller.ts` (4 files) | Existing — dashboard stats, user/astrologer/call mgmt |

### Database Tables (37 tables — wallet-related only)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `wallets` | `id`, `userId`, `astrologerId`, `balance`, `totalAdded`, `totalDeducted` | Wallet per user & astrologer |
| `transactions` | `id`, `walletId`, `amount`, `type` (enum: add_funds, withdrawal, call_charge, chat_charge, gift, donation, commission, order_payment, refund), `status` (pending, completed, failed), `category`, `description` | Financial ledger |
| `commissions` | `id`, `astrologerId`, `percentage` | Commission % per astrologer (platform cut) |
| `commission_logs` | `id`, `callLogId`, `astrologerId`, `amount`, `percentage`, `totalEarned`, `platformFee` | Commission earned per call |
| `withdrawal_requests` | `id`, `astrologerId`, `walletId`, `amount`, `status` (pending, approved, rejected), `approvedAt` | Astrologer withdrawal requests |
| `users` | `id`, `credits` (int), `name`, `email`, `phone` | Users |
| `astrologers` | `id`, `userId`, `totalEarnings`, `totalOrders`, `experience`, `baseRate` | Astrologers |
| `call_logs` | `id`, `callerId`, `astrologerId`, `status`, `duration`, `cost`, `ratePerMin`, `startedAt`, `endedAt` | Call records |
| `payment_orders` | `id`, `userId`, `amount`, `currency`, `razorpayOrderId`, `status`, `metadata` | Razorpay orders |
| `payment_events` | `id`, `paymentOrderId`, `eventType`, `payload`, `status` | Razorpay webhook events |

### Mobile Screens (Expo SDK 54, RN 0.81.5)

| Screen | Location | Status |
|--------|----------|--------|
| WalletScreen | `UserScreens.tsx` | Shows balance, add funds button, withdrawal history |
| AstrologerWalletScreen | `AstrologerScreens.tsx` | Shows balance, add funds, withdrawal requests |
| AstrologerEarningsScreen | `AstrologerScreens.tsx` | Shows total earnings |
| AstrologerCommissionScreen | `AstrologerScreens.tsx` | Empty placeholder — "Comming Soon" |
| AstrologerWithdrawalScreen | `AstrologerScreens.tsx` | Withdrawal request form |
| PaymentScreen | `PaymentScreen.tsx` | Razorpay checkout (working) |
| PaymentSuccessScreen | `PaymentSuccessScreen.tsx` | Success display (working) |
| PaymentFailureScreen | `PaymentFailureScreen.tsx` | Categorized error display (working) |
| AdminDashboard | Admin section | Stats, charts |
| AdminAstrologersScreen | Admin section | Astrologer management |

---

## Phase 1 — Wallet Balance Validation for Calls & Chat

### Problem
When a user initiates a call or chat, the system NEVER checks if the user has sufficient wallet balance. `WalletService.deductFunds()` exists but is never called anywhere.

### What Needs to Change

#### Server: Calls Gateway (`calls.gateway.ts`)

**Current flow:**
1. User sends `call:start` with `{ astrologerId, type }`
2. Gateway creates a call log with status `pending`
3. Gateway notifies astrologer
4. Astrologer accepts → status becomes `active`
5. Agora token generated, both parties join
6. On end → `endCall()` calculates duration, cost, ratePerMin — saves to DB but NEVER deducts wallet

**Required changes:**

1. **Add wallet balance check BEFORE call acceptance** — When astrologer accepts, check caller's wallet balance. If insufficient, reject the call.
2. **Add live wallet deduction during call** — During active call, periodically deduct funds based on duration. If balance reaches zero, auto-terminate the call.
3. **Deduct wallet on call end** — In `endCall()`, actually call `WalletService.deductFunds()` and create a transaction record.

#### Server: Chat Gateway (`chat.gateway.ts`)

**Current flow:**
1. User creates or joins conversation
2. User sends messages via WebSocket
3. Messages saved to DB
4. NO charging whatsoever

**Required:**
- Add a `conversation_charges` table or use existing `transactions` table with `chat_charge` type
- Deduct per-message or per-minute charge from user wallet
- Check balance before allowing message send

#### Server: Wallet Service (`wallet.service.ts`)

**Method to add:**
- `checkSufficientBalance(userId: string, amount: number): Promise<boolean>` — queries balance, returns true/false
- `deductFundsWithTransaction(userId: string, amount: number, description: string, referenceType: string, referenceId: string): Promise<void>` — atomic deduct + transaction insert in DB transaction

### Implementation Order
1. Add `checkSufficientBalance()` and `deductFundsWithTransaction()` to WalletService
2. Modify CallsGateway to check balance before accepting call
3. Modify CallsGateway/Service to deduct wallet on `endCall`
4. Add ChatGateway balance check + deduction
5. Add conversation_charges table if needed

---

## Phase 2 — Revenue Distribution (Platform Commission)

### Problem
`commissions` table stores astrologer commission % but is never applied. `commission_logs` table exists but is never populated. Platform gets nothing from calls.

### How It Should Work

**On every paid call:**
1. Calculate total call cost (duration × ratePerMin)
2. Deduct full cost from caller's wallet
3. Look up astrologer's commission % from `commissions` table
4. Calculate: `platformFee = totalCost × (commissionPercentage / 100)`
5. Calculate: `astrologerEarnings = totalCost - platformFee`
6. Add `astrologerEarnings` to astrologer's wallet balance
7. Insert record in `commission_logs`
8. Update astrologer's `totalEarnings`

**On every chat message/conversation:**
- Same distribution logic applied to chat charges

### Server Changes

#### Calls Service (`calls.service.ts`)

In `endCall()`:
```typescript
async endCall(callLogId: string, endedBy: string): Promise<void> {
  // ... existing duration/cost calculation ...

  // Deduct from caller wallet
  await this.walletService.deductFundsWithTransaction(
    callerId, cost, `Call with ${astrologerName}`,
    'call_charge', callLogId
  );

  // Apply commission distribution
  await this.commissionService.distributeEarnings(astrologerId, callLogId, cost);

  // Update astrologer totalEarnings
  await this.astrologerService.addEarnings(astrologerId, astrologerEarnings);
}
```

#### Commission Service (`commission.service.ts`)

**New method:**
- `distributeEarnings(astrologerId, callLogId, totalCost)` — calculates split, credits astrologer wallet, inserts commission_log

**Currently exists (reuse):**
- `findByAstrologerId(astrologerId)` — get commission %
- `create(data)` / `update(id, data)` — CRUD

#### Astrologer Service / Wallet

- Need method to credit astrologer wallet: `WalletService.creditFunds(astrologerId, amount, description, type, referenceId)`

---

## Phase 3 — Redemption (Withdrawal Flow)

### Problem
Withdrawal requests can be approved/rejected but the flow is incomplete:
1. No balance check before creating withdrawal request
2. On approval, astrologer wallet is NOT deducted
3. No transaction record for approved withdrawals

### How It Should Work

**Create withdrawal request:**
1. Astrologer requests withdrawal of amount X
2. Check astrologer wallet balance >= X
3. Create `withdrawal_requests` record with status `pending`
4. Admin reviews in admin panel

**Approve withdrawal:**
1. Admin approves request
2. Deduct X from astrologer wallet
3. Create transaction record with type `withdrawal`, status `completed`
4. Update `withdrawal_requests` status to `approved`, set `approvedAt`

**Reject withdrawal:**
1. Admin rejects
2. Update status to `rejected`
3. Nothing else needed

### Server Changes

#### Withdrawal Service (`withdrawal.service.ts`)

- Add balance check in `create()` method
- Add wallet deduction + transaction creation in `approve()` method

---

## Phase 4 — Astrologer Commission Screen

### Problem
The AstrologerCommissionScreen shows "Comming Soon" — completely empty.

### What to Build

A screen showing:
- Current commission percentage
- Total earnings (from `astrologers.totalEarnings`)
- Total platform fees paid
- List of commission_logs entries (filterable by date)
- Total calls, total revenue generated

### API Endpoints Needed

| Method | Path | Description |
|--------|------|-------------|
| GET | `/commission/astrologer/:id/logs` | Commission logs for astrologer (paginated) |
| GET | `/commission/astrologer/:id/stats` | Aggregated stats (total earnings, fees, calls) |

### Mobile Changes

AstrologerCommissionScreen — replace placeholder with real data display:
- Summary cards (commission %, total earnings, platform fees paid)
- List of commission logs with date, call info, amount breakdown
- Pull-to-refresh

---

## Phase 5 — Wallet Balance Display Across App

### Problem
Wallet balance is only shown on WalletScreen. Users can't see their balance when:
- Browsing astrologer profiles
- Initiating a call
- On home screen

### Mobile Changes

| Screen | Change |
|--------|--------|
| UserHomeScreen | Add wallet balance badge in header |
| AstrologerProfileScreen | Show caller's balance when initiating call |
| CallScreen | Show remaining balance/live deduction counter |
| ChatRoomScreen | Show balance/charge indicator |
| ProfileScreen | Show wallet balance |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallet/me` | Get current user's wallet (already exists) |

---

## Phase 6 — Admin Revenue Dashboard

### Problem
Admin dashboard shows user/astrologer/call stats but NO revenue/financial data.

### What to Build

Add to Admin Dashboard:
- Total platform revenue (sum of all platform fees from commission_logs)
- Total user deposits (sum of add_funds transactions)
- Total withdrawals processed
- Pending withdrawal requests count + amount
- Daily/weekly/monthly revenue charts
- Recent transactions list
- How much commssion he got .

### API Endpoints Needed

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/revenue/summary` | Aggregated revenue stats |
| GET | `/admin/revenue/transactions` | Paginated transaction list |
| GET | `/admin/revenue/chart?period=week` | Chart data by period |

---

## Database Changes

### New Table: `conversation_charges` (if per-message charging)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, defaultRandom |
| conversationId | uuid | FK -> conversations.id |
| userId | uuid | NOT NULL |
| astrologerId | uuid | NOT NULL |
| messagesCount | int | NOT NULL, default 0 |
| totalCharged | decimal(10,2) | NOT NULL, default 0 |
| ratePerMessage | decimal(10,2) | NOT NULL |
| startedAt | timestamp | NOT NULL |
| lastChargedAt | timestamp | nullable |
| status | varchar | 'active', 'completed' |
| createdAt | timestamp | defaultNow |

### Migration — New Columns on Existing Tables

**`astrologers` table:**
- No new columns needed — `totalEarnings` already exists

**`wallets` table:**
- No new columns needed — `balance`, `totalAdded`, `totalDeducted` already exist

**`withdrawal_requests` table:**
- Add `processedAt` timestamp if missing
- Add `transactionId` FK to transactions (nullable)

No new tables strictly needed for core flow — all financial tracking reuses existing `transactions`, `commission_logs`, `withdrawal_requests`.

---

## Server Implementation Details

### Phase 1A — WalletService Enhancements

**File:** `server/src/modules/wallet/wallet.service.ts`

```typescript
// New methods to add:

async checkSufficientBalance(userId: string, amount: number): Promise<boolean> {
  const wallet = await this.getWalletByUserId(userId);
  return wallet.balance >= amount;
}

async deductFundsAtomic(userId: string, amount: number, 
  description: string, transactionType: string, referenceId?: string): Promise<void>
{
  return this.db.transaction(async (tx) => {
    // Lock wallet row
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .forUpdate()
      .then(rows => rows[0]);

    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Deduct
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${amount}`,
        totalDeducted: sql`${wallets.totalDeducted} + ${amount}`,
      })
      .where(eq(wallets.id, wallet.id));

    // Create transaction record
    await tx.insert(transactions).values({
      walletId: wallet.id,
      amount: amount,
      type: transactionType as any,
      status: 'completed',
      description,
      referenceId,
      createdAt: new Date(),
    });
  });
}

async creditFunds(userId: string, astrologerId: string | null, amount: number,
  description: string, transactionType: string, referenceId?: string): Promise<void>
{
  return this.db.transaction(async (tx) => {
    let wallet;
    if (userId) {
      wallet = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .forUpdate()
        .then(rows => rows[0]);
    } else if (astrologerId) {
      wallet = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.astrologerId, astrologerId))
        .forUpdate()
        .then(rows => rows[0]);
    }

    if (!wallet) throw new BadRequestException('Wallet not found');

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount}`,
        totalAdded: sql`${wallets.totalAdded} + ${amount}`,
      })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(transactions).values({
      walletId: wallet.id,
      amount: amount,
      type: transactionType as any,
      status: 'completed',
      description,
      referenceId,
      createdAt: new Date(),
    });
  });
}
```

### Phase 1B — Calls Gateway Balance Check

**File:** `server/src/modules/calls/calls.gateway.ts`

In `handleAcceptCall`:
```typescript
// Before notifying caller that astrologer accepted:
const canPay = await this.walletService.checkSufficientBalance(callerId, MINIMUM_BALANCE);
if (!canPay) {
  // Notify caller: insufficient balance
  // Notify astrologer: call cancelled due to caller balance
  // Update call log status to 'failed'
  return;
}
```

In `handleEndCall` (calls.service.ts `endCall`):
```typescript
// At the end of endCall():
await this.walletService.deductFundsAtomic(
  callerId, cost, 
  `Call with ${astrologerName} (${duration} min)`,
  'call_charge', callLogId
);

await this.commissionService.distributeEarnings(astrologerId, callLogId, cost);
```

### Phase 1C — Chat Charging

**File:** `server/src/modules/conversations/chat.gateway.ts`

In `handleMessage`:
```typescript
// Check if conversation has an astrologer participant
// Deduct per-message charge from user
const CHARGE_PER_MESSAGE = 5; // or get from config
const canSend = await this.walletService.checkSufficientBalance(senderId, CHARGE_PER_MESSAGE);
if (!canSend) {
  socket.emit('error', { message: 'Insufficient wallet balance to send message' });
  return;
}

// Save message
// ...

// Deduct after successful save
await this.walletService.deductFundsAtomic(
  senderId, CHARGE_PER_MESSAGE,
  'Chat message', 'chat_charge', messageId
);
```

### Phase 2 — Commission Distribution

**File:** `server/src/modules/commission/commission.service.ts`

**New method:**
```typescript
async distributeEarnings(astrologerId: string, callLogId: string, totalCost: number): Promise<void> {
  // Get commission percentage
  const commission = await this.findByAstrologerId(astrologerId);
  const percentage = commission?.percentage ?? 10; // default 10% if not set

  const platformFee = (totalCost * percentage) / 100;
  const astrologerEarnings = totalCost - platformFee;

  return this.db.transaction(async (tx) => {
    // Credit astrologer wallet
    const astrologerWallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.astrologerId, astrologerId))
      .forUpdate()
      .then(rows => rows[0]);

    if (astrologerWallet) {
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${astrologerEarnings}`,
          totalAdded: sql`${wallets.totalAdded} + ${astrologerEarnings}`,
        })
        .where(eq(wallets.id, astrologerWallet.id));

      await tx.insert(transactions).values({
        walletId: astrologerWallet.id,
        amount: astrologerEarnings,
        type: 'commission',
        status: 'completed',
        description: `Earnings from call ${callLogId}`,
        referenceId: callLogId,
        createdAt: new Date(),
      });
    }

    // Insert commission log
    await tx.insert(commissionLogs).values({
      callLogId,
      astrologerId,
      amount: totalCost,
      percentage,
      totalEarned: astrologerEarnings,
      platformFee,
      createdAt: new Date(),
    });

    // Update astrologer totalEarnings
    await tx
      .update(astrologers)
      .set({
        totalEarnings: sql`${astrologers.totalEarnings} + ${astrologerEarnings}`,
      })
      .where(eq(astrologers.id, astrologerId));
  });
}
```

### Phase 3 — Withdrawal Enhancements

**File:** `server/src/modules/withdrawal/withdrawal.service.ts`

**Create (add balance check):**
```typescript
async create(data: CreateWithdrawalDto): Promise<WithdrawalRequest> {
  const wallet = await this.walletService.getWalletByAstrologerId(data.astrologerId);
  if (!wallet || wallet.balance < data.amount) {
    throw new BadRequestException('Insufficient wallet balance');
  }
  // ... existing creation logic ...
}
```

**Approve (add deduction):**
```typescript
async approve(id: string): Promise<void> {
  return this.db.transaction(async (tx) => {
    const request = await tx
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id))
      .forUpdate()
      .then(rows => rows[0]);

    if (!request || request.status !== 'pending') {
      throw new BadRequestException('Invalid withdrawal request');
    }

    // Deduct from astrologer wallet
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, request.walletId))
      .forUpdate()
      .then(rows => rows[0]);

    if (!wallet || wallet.balance < request.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${request.amount}`,
        totalDeducted: sql`${wallets.totalDeducted} + ${request.amount}`,
      })
      .where(eq(wallets.id, request.walletId));

    // Create transaction
    const [transaction] = await tx.insert(transactions).values({
      walletId: request.walletId,
      amount: request.amount,
      type: 'withdrawal',
      status: 'completed',
      description: `Withdrawal approved by admin`,
      createdAt: new Date(),
    }).returning();

    // Update request
    await tx
      .update(withdrawalRequests)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        transactionId: transaction.id,
      })
      .where(eq(withdrawalRequests.id, id));
  });
}
```

---

## Mobile Implementation Details

### Phase 4 — Astrologer Commission Screen

**File:** `app/src/screens/astrologer/AstrologerScreens.tsx`

Replace the "Comming Soon" placeholder with:

```typescript
// AstrologerCommissionScreen
// - Fetch commission logs from API
// - Show summary: commission %, total earnings, platform fees
// - FlatList of commission logs with date, amount, breakdown
// - Pull-to-refresh
// - Empty state if no data
```

### Phase 5 — Wallet Balance Display

**File:** `app/src/screens/user/UserScreens.tsx` — UserHomeScreen

Add balance badge in header:
```typescript
// On mount, fetch wallet /wallet/me
// Show balance as a chip/badge next to greeting
```

**File:** `app/src/context/AuthContext.tsx` or new `WalletContext.tsx`

Consider adding wallet balance to global context so it's accessible everywhere without repeated API calls.

### Phase 6 — Admin Revenue Dashboard

**Admin dashboard screen** — Add revenue section:
- Summary cards (total revenue, pending withdrawals, total deposits)
- Recent transactions list
- Revenue chart (use existing chart library or simple rendering)

---

## API Endpoints Summary

### Phase 1 — Wallet & Calls

| Method | Path | Description | New/Existing |
|--------|------|-------------|-------------|
| GET | `/wallet/me` | Get current user wallet | Existing |
| GET | `/wallet/astrologer/:id` | Get astrologer wallet | Existing |
| POST | `/wallet/deduct` | (Internal/admin) Deduct funds | New |

### Phase 2 — Commission

| Method | Path | Description | New/Existing |
|--------|------|-------------|-------------|
| GET | `/commission/:astrologerId` | Get commission % | Existing |
| POST | `/commission` | Create commission | Existing |
| PUT | `/commission/:id` | Update commission | Existing |
| GET | `/commission/astrologer/:id/logs` | Commission logs (paginated) | New |
| GET | `/commission/astrologer/:id/stats` | Aggregated commission stats | New |

### Phase 3 — Withdrawal

| Method | Path | Description | New/Existing |
|--------|------|-------------|-------------|
| POST | `/withdrawal` | Create withdrawal request | Existing (needs balance check) |
| PUT | `/withdrawal/:id/approve` | Approve withdrawal | Existing (needs deduction) |
| PUT | `/withdrawal/:id/reject` | Reject withdrawal | Existing |
| GET | `/withdrawal` | List all (admin) | Existing |
| GET | `/withdrawal/astrologer/:id` | List astrologer's requests | Existing |

### Phase 6 — Admin Revenue

| Method | Path | Description | New/Existing |
|--------|------|-------------|-------------|
| GET | `/admin/revenue/summary` | Revenue summary stats | New |
| GET | `/admin/revenue/transactions` | Paginated transactions | New |
| GET | `/admin/revenue/chart` | Chart data | New |

---

## Implementation Order (Recommended)

```
Phase 1A — WalletService: checkSufficientBalance, deductFundsAtomic, creditFunds
Phase 1B — CallsGateway: balance check before accept, wallet deduct on endCall
Phase 2   — CommissionService: distributeEarnings called from CallsService.endCall
Phase 3   — WithdrawalService: balance check on create, deduction on approve
Phase 1C — ChatGateway: per-message balance check + deduction
Phase 4   — AstrologerCommissionScreen (mobile)
Phase 5   — Wallet balance display across mobile app
Phase 6   — Admin Revenue Dashboard
```

---

## Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| (none new — all changes are to existing files) | | |

## Files to Modify

| File | Phase | Change |
|------|-------|--------|
| `server/src/modules/wallet/wallet.service.ts` | 1A | Add checkSufficientBalance, deductFundsAtomic, creditFunds |
| `server/src/modules/calls/calls.service.ts` | 1B | Call wallet deduct + commission distribution in endCall |
| `server/src/modules/calls/calls.gateway.ts` | 1B | Add balance check before accepting call |
| `server/src/modules/commission/commission.service.ts` | 2 | Add distributeEarnings method |
| `server/src/modules/withdrawal/withdrawal.service.ts` | 3 | Add balance check in create, deduction in approve |
| `server/src/modules/conversations/chat.gateway.ts` | 1C | Add per-message balance check + deduct |
| `app/src/screens/astrologer/AstrologerScreens.tsx` | 4 | Replace commission placeholder with real UI |
| `app/src/screens/user/UserScreens.tsx` | 5 | Add wallet balance badge to UserHomeScreen |
| `app/src/navigation/Navigation.tsx` | 4,5 | Add new routes/screens if needed |
| `app/src/shared/api-client.ts` | 2,4,6 | Add new API methods for commission logs, admin revenue |
| `app/src/context/AuthContext.tsx` | 5 | Add wallet balance to context |
| Admin dashboard screens | 6 | Add revenue section |

---

## Testing Plan

### Wallet Service Tests

| Test | What to Verify |
|------|---------------|
| checkSufficientBalance | Returns true when balance >= amount, false otherwise |
| deductFundsAtomic | Deducts correctly, creates transaction, throws on insufficient |
| creditFunds | Credits correctly, creates transaction |
| deductFundsAtomic (concurrent) | DB transaction isolation — two simultaneous deductions don't race |

### Calls Flow Tests

| Test | What to Verify |
|------|---------------|
| Accept call with balance | Proceeds normally |
| Accept call without balance | Rejected with error message |
| End call deducts wallet | Balance decreases by correct amount |
| Commission distribution | Platform fee + astrologer earnings calculated correctly |
| Commission distribution (no commission set) | Uses default 10% |

### Withdrawal Flow Tests

| Test | What to Verify |
|------|---------------|
| Create withdrawal with balance | Created successfully |
| Create withdrawal without balance | Rejected |
| Approve withdrawal | Wallet deducted, transaction created |
| Approve twice (same request) | Prevents double deduction |

---

## Rollback Plan

### Safe Rollback (per phase)

| Phase | Database | Backend | Mobile |
|-------|----------|---------|--------|
| 1A | No changes | Revert wallet.service.ts | N/A |
| 1B | No changes | Revert calls.service.ts, calls.gateway.ts | N/A |
| 1C | Drop conversation_charges if created | Revert chat.gateway.ts | N/A |
| 2 | No changes | Revert commission.service.ts | N/A |
| 3 | No changes | Revert withdrawal.service.ts | N/A |
| 4 | N/A | N/A | Revert AstrologerScreens.tsx |
| 5 | N/A | N/A | Revert UserScreens.tsx, Navigation.tsx |
| 6 | No changes | Revert admin endpoints | Revert admin screens |

No irreversible database changes — all changes are application logic additions. No existing columns are dropped or modified. All new logic is additive.

---

## Edge Cases & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Double deduction on call end | User charged twice | Idempotency: check if transaction already exists for callLogId |
| Race condition on concurrent call acceptance | User balance used twice | `FOR UPDATE` row lock in DB transaction |
| Astrologer has no wallet record | Commission distribution fails | Auto-create wallet on astrologer registration (if not already) |
| Chat message sent but deduct fails | Message delivered but balance not deducted | Deduct BEFORE insert; if deduct fails, don't save message |
| Withdrawal approved but wallet empty (admin race) | Negative balance | `FOR UPDATE` lock + balance check inside transaction |
| Very long call with low balance | Auto-terminate mid-call | Periodic balance check + force end call + notify both parties |
| Network failure during wallet deduct | Transaction rolled back | Atomic DB transaction ensures consistency |
| Commission % set to 0 | Astrologer gets nothing | Treat 0% as valid (platform takes all); or enforce minimum 5% |
| Commission % set to 100 | Platform gets nothing | Treat as valid (astrologer keeps all); admin sets this consciously |
| User not found during deduction | Call fails | Validate caller exists before starting call |
