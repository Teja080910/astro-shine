# Pending Tasks — Muhurat (Auspicious Timings)

---

## Feature Summary

Muhurat provides auspicious timing recommendations. Categories are dynamic — admin can create, edit, and deactivate categories as needed.

### Relationship

```
muhurat_categories (Admin CRUD)
    └── muhurat entries (Admin CRUD + Astrologer CRUD own entries)
         └── createdBy → astrologers.id OR admins.id (nullable)
```

Both admin and astrologers can create/manage muhurat entries directly. Admin manages all entries. Astrologers manage only their own entries. No review/approval step — entries go live immediately. Categories are managed by admin only.

### Default Seed Categories

| Category | Description |
|----------|-------------|
| Marriage Muhurat | Auspicious dates/times for weddings |
| Housewarming Muhurat | Auspicious timing for Griha Pravesh |
| Bhoomi Pujan Muhurat | Auspicious timing for ground-breaking / land worship |
| Naming Ceremony Muhurat | Auspicious timing for Naamkaran |
| Mundan Muhurat | Auspicious timing for first haircut ceremony |

Admin can add more or deactivate any of these.

---

## Role-Based Access

| Action | Admin | User | Astrologer |
|--------|:-----:|:----:|:----------:|
| **Categories** | | | |
| View all muhurat categories (active + inactive) | Yes | No | No |
| View active muhurat categories | Yes | Yes | Yes |
| Create / Edit / Deactivate category | Yes | No | No |
| **Entries** | | | |
| View all muhurat entries | Yes | No | Yes (own only) |
| View active muhurat entries | Yes | Yes | Yes |
| Filter entries by category | Yes | Yes | Yes |
| Create entry | **Yes** | No | **Yes** |
| Edit / Delete own entry | **Yes** | No | **Yes** |
| Edit / Delete any entry | **Yes** | No | No |
| Toggle active/inactive (any entry) | **Yes** | No | No |

- **Admin** creates categories, manages all entries (full CRUD).
- **Astrologer** creates and manages their own muhurat entries. They can mark them active/inactive.
- **User** can browse active muhurat timings in the mobile app (read-only).

No review/approval needed — entries go live as soon as they're created and marked active.

---

## Tasks

### 1. Database

- [ ] **Create `muhurat_categories` schema** — `server/src/db/schemas/muhurat-categories.ts`
  - Columns: `id` (uuid PK), `name` (varchar 255, unique), `description` (text, nullable), `isActive` (boolean, default true), `createdAt`, `updatedAt`
- [ ] **Create `muhurat` schema** — `server/src/db/schemas/muhurat.ts`
  - Columns: `id` (uuid PK), `categoryId` (uuid FK -> muhurat_categories.id, cascade), `name` (varchar 255), `date` (date), `time` (time), `description` (text, nullable), `createdBy` (uuid nullable — FK to astrologers.id or admins.id), `isActive` (boolean, default true), `createdAt`, `updatedAt`
  - **Unique constraint**: `(date, time)` — prevents two entries at the same date and time
- [ ] **Export from barrel** — `server/src/db/schemas/index.ts`
  - Add `export { muhuratCategories } from './muhurat-categories';`
  - Add `export { muhurat } from './muhurat';`
- [ ] **Seed default categories** — create a migration seed script or include in the initial migration
  - Marriage, Housewarming, Bhoomi Pujan, Naming Ceremony, Mundan
- [ ] **Generate and apply migration**
  ```bash
  cd server && npm run db:generate && npm run db:migrate
  ```

### 2. Backend — Muhurat Categories (NestJS)

- [ ] **Create module** — `server/src/modules/muhurat-categories/muhurat-categories.module.ts`
- [ ] **Create controller** — `server/src/modules/muhurat-categories/muhurat-categories.controller.ts`
  - `GET /muhurat-categories` — list active categories
  - `GET /muhurat-categories/admin` — list all categories (admin)
  - `GET /muhurat-categories/:id` — get single category
  - `POST /muhurat-categories` — create category
  - `PUT /muhurat-categories/:id` — update category
- [ ] **Create service** — `server/src/modules/muhurat-categories/muhurat-categories.service.ts`
  - Standard Drizzle CRUD with `isActive` filter on public endpoints

### 3. Backend — Muhurat Entries (NestJS)

- [ ] **Create module** — `server/src/modules/muhurat/muhurat.module.ts`
- [ ] **Create controller** — `server/src/modules/muhurat/muhurat.controller.ts`
  - `GET /muhurat` — list active entries (optional `?categoryId=` filter)
  - `GET /muhurat/admin` — list all entries (admin only)
  - `GET /muhurat/my` — list entries created by logged-in astrologer (auth required)
  - `GET /muhurat/:id` — get single entry (with category + creator details)
  - `POST /muhurat` — create entry (auth required, sets `createdBy` and role from JWT)
  - `PUT /muhurat/:id` — update entry (owner or admin)
  - `DELETE /muhurat/:id` — delete entry (owner or admin)
- [ ] **Create service** — `server/src/modules/muhurat/muhurat.service.ts`
  - Standard Drizzle CRUD, join with categories and creators on read
  - `findAll()` — returns active entries filtered by `isActive`
  - `findMyEntries(userId)` — returns entries created by a specific user
  - `create()` — returns 409 Conflict if same `(date, time)` already exists
- [ ] **Register both modules** — `server/src/app.module.ts`
  - Import and add `MuhuratCategoriesModule` and `MuhuratModule`

### 4. Shared Packages

- [ ] **Add types** — `packages/shared-types/src/index.ts`
  - `MuhuratCategory` interface (`{ id, name, description?, isActive, createdAt, updatedAt }`)
  - `MuhuratItem` interface (`{ id, categoryId, categoryName?, name, date, time, description?, createdBy?, createdByName?, isActive, createdAt, updatedAt }`)
- [ ] **Add API client** — `packages/api-client/src/index.ts`
  - `muhuratCategories` section: `list()`, `get()`, `create()`, `update()`
  - `muhurat` section: `list()`, `get()`, `create()`, `update()`

### 5. Admin Panel (Web)

- [ ] **Create Muhurat Categories page** — `web/src/app/muhurat/categories/page.tsx`
  - List categories with active/inactive badges
  - Add/Edit modal: name input, description textarea, active toggle
- [ ] **Create Muhurat Entries page** — `web/src/app/muhurat/page.tsx`
  - List all entries with category name, date, time, creator name, active/inactive badge
  - Add/Edit modal: name input, category dropdown (fetched from API), date picker, time picker, description textarea, active toggle
- [ ] **Add sidebar links** — `web/src/components/AdminLayout.tsx`
  - Import `Clock` icon from lucide-react
  - Add collapsible or nested menu:
    ```
    Muhurat
      ├── Categories   → /muhurat/categories
      └── Entries      → /muhurat
    ```
    OR two separate top-level items:
    - `{ href: '/muhurat', icon: Clock, label: 'Muhurat' }` — entries page with category filter
    - `{ href: '/muhurat/categories', icon: Tags, label: 'Muhurat Categories' }`

### 6. Mobile App (Future — not in scope now)

- [ ] Create `app/src/screens/user/MuhuratScreen.tsx` — fetch categories, show as tabs, list approved entries (User)
- [ ] Create `app/src/screens/astrologer/AstrologerMuhuratScreen.tsx` — my entries list with status badges + create new entry form (Astrologer)
- [ ] Add to `app/src/navigation/Navigation.tsx`
- [ ] Export from screen barrel files

---

## Estimated Effort

| Task | Time |
|------|------|
| Database schemas + migration + seed | 20 min |
| NestJS modules (categories + entries) | 40 min |
| Shared types + API client | 15 min |
| Admin panel pages (categories + entries) | 35 min |
| Sidebar update | 5 min |
| Testing | 25 min |
| **Total** | **~2.5 hours** |
