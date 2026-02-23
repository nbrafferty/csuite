# C-Suite — Project Kickoff

**Client:** Central Creative Co (CCC)
**Product:** C-Suite — Multi-tenant order management portal for a print/merch shop
**Date:** 2026-02-23

---

## A. Assumptions

### Target users and roles

| Role | Description |
|------|-------------|
| **Client Admin** | Primary contact per client org. Manages users, locations, payment methods. Creates orders, approves proofs, pays invoices. Manages saved products and artwork. |
| **Client User** | Team member within a client org. Can create orders (if permitted), upload artwork, view orders, comment on proofs, request changes. May pay invoices if allowed by admin. |
| **CCC Staff** | Central Creative Co employees. Full cross-tenant access: manage clients, orders, inventory, proofs, invoices, support, and production status. |

### Multi-tenancy model
- **Shared database, tenant-scoped rows.** Every tenant-owned table has a `companyId` foreign key. All queries are scoped to the authenticated user's company.
- CCC Staff users belong to a special "system" company and can access all tenants.
- Tenant isolation is enforced at the middleware and query layer — never rely on client-side filtering alone.

### Auth
- **Email + password** credentials-based auth (NextAuth.js CredentialsProvider).
- **Invite codes** for onboarding: CCC Staff generates an invite link/code tied to a company + role. New users register via invite.
- Password reset via email token.
- No SSO or magic link for MVP — can be added later.
- Sessions stored as HTTP-only cookies (JWT strategy).

### File storage (artwork, proofs)
- **AWS S3** (or S3-compatible like Cloudflare R2) for all uploaded files.
- Pre-signed upload URLs for client-side direct upload.
- Pre-signed download URLs for secure read access.
- Files are keyed by `company/{companyId}/artwork/{assetId}/{version}` and `company/{companyId}/proofs/{proofId}/{version}`.

### Payments
- **Stripe** (existing account) for manual invoice payments.
- Clients can save cards via Stripe Setup Intents.
- Invoices support **pay in full** or **deposit** (e.g., 50% upfront for apparel orders).
- **No autopay for MVP.** All payments are client-initiated.
- Stripe Payment Intents for one-time payments; no subscriptions.

### Inventory supplier sync
- **Deferred from MVP.** Inventory module will be a simple on-hand count managed manually by CCC Staff.
- Future: pull availability from SSActivewear and SanMar APIs.

---

## B. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 14 (App Router) + React 18 + TypeScript | Full-stack framework, SSR/SSG where needed, file-based routing. App Router for layouts and server components. |
| **UI** | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built accessible components. No runtime CSS overhead. Easy to customize. |
| **Backend** | Next.js Route Handlers (REST) | Co-located with frontend. Simple REST endpoints. No need for a separate server for MVP. |
| **Database** | PostgreSQL (Neon) + Prisma ORM | Neon is serverless Postgres with branching. Prisma gives type-safe queries and migrations. |
| **Auth** | NextAuth.js v5 (Auth.js) | Credentials provider + JWT sessions. Built-in CSRF, session management. |
| **File storage** | AWS S3 (pre-signed URLs) | Industry standard. Direct client uploads via pre-signed URLs. Cheap, durable, scalable. |
| **Background jobs** | Inngest (serverless) | Event-driven functions, retries, cron. No infrastructure to manage. Runs on Vercel. |
| **Hosting** | Vercel (app) + Neon (DB) + S3 (files) | Zero-config deploys, preview environments, edge middleware. Fastest path to production. |
| **Email** | Resend | Simple transactional email API. Good DX. |
| **Observability** | Sentry (errors) + Vercel Analytics (performance) | Catch errors in prod, track core web vitals. |

---

## C. Domain Model (v1)

### Company (Tenant)
```
Company
  id              UUID (PK)
  name            String
  slug            String (unique, URL-safe)
  logoUrl         String?
  inviteCode      String (unique)
  stripeCustomerId String?
  createdAt       DateTime
  updatedAt       DateTime
```

### User
```
User
  id              UUID (PK)
  email           String (unique)
  passwordHash    String
  firstName       String
  lastName        String
  role            Enum(CLIENT_ADMIN, CLIENT_USER, CCC_STAFF)
  companyId       UUID (FK → Company)
  isActive        Boolean
  lastLoginAt     DateTime?
  createdAt       DateTime
  updatedAt       DateTime
```

### Location
```
Location
  id              UUID (PK)
  companyId       UUID (FK → Company)
  label           String (e.g., "Main Office", "Warehouse 2")
  address1        String
  address2        String?
  city            String
  state           String
  zip             String
  country         String (default "US")
  contactName     String?
  contactPhone    String?
  isDefault       Boolean
  createdAt       DateTime
```

### Order
```
Order
  id              UUID (PK)
  companyId       UUID (FK → Company)
  createdById     UUID (FK → User)
  orderNumber     String (unique, auto-generated)
  status          Enum(DRAFT, SUBMITTED, IN_REVIEW, AWAITING_PROOF, PROOF_APPROVED,
                       IN_PRODUCTION, READY, SHIPPED, COMPLETED, CANCELLED)
  projectName     String?
  poNumber        String?
  eventName       String?
  dueDate         DateTime?
  notes           String?
  reorderedFromId UUID? (FK → Order, self-ref)
  createdAt       DateTime
  updatedAt       DateTime
```

### OrderItem
```
OrderItem
  id              UUID (PK)
  orderId         UUID (FK → Order)
  savedProductId  UUID? (FK → SavedProduct)
  productName     String
  style           String?
  color           String?
  decorationNotes String?
  sizeBreakdown   JSON (e.g., {"S": 10, "M": 20, "L": 15, "XL": 5})
  unitPrice       Decimal?
  totalPrice      Decimal?
  sortOrder       Int
```

### SavedProduct
```
SavedProduct
  id              UUID (PK)
  companyId       UUID (FK → Company)
  name            String
  sku             String?
  style           String?
  color           String?
  decorationPreset JSON? (locations, ink colors, notes)
  defaultSizes    JSON? (template size breakdown)
  artworkAssetId  UUID? (FK → ArtworkAsset)
  isActive        Boolean
  createdAt       DateTime
  updatedAt       DateTime
```

### ArtworkAsset
```
ArtworkAsset
  id              UUID (PK)
  companyId       UUID (FK → Company)
  uploadedById    UUID (FK → User)
  name            String
  currentVersion  Int
  createdAt       DateTime
  updatedAt       DateTime

ArtworkVersion
  id              UUID (PK)
  assetId         UUID (FK → ArtworkAsset)
  version         Int
  fileUrl         String
  fileType        String
  fileSizeBytes   Int
  uploadedById    UUID (FK → User)
  createdAt       DateTime
```

### Proof
```
Proof
  id              UUID (PK)
  orderId         UUID (FK → Order)
  version         Int
  status          Enum(DRAFT, SENT, ANNOTATING, APPROVED, REVISION_REQUESTED)
  imageUrls       JSON (array of image URLs)
  pdfUrl          String?
  publishedById   UUID? (FK → User, CCC Staff)
  approvedById    UUID? (FK → User, Client)
  approvedAt      DateTime?
  lockedAt        DateTime?
  createdAt       DateTime
  updatedAt       DateTime
```

### ProofAnnotation
```
ProofAnnotation
  id              UUID (PK)
  proofId         UUID (FK → Proof)
  authorId        UUID (FK → User)
  imageIndex      Int (which image in the proof)
  pinX            Float (0-1 normalized)
  pinY            Float (0-1 normalized)
  comment         String
  resolvedAt      DateTime?
  createdAt       DateTime
```

### Invoice
```
Invoice
  id              UUID (PK)
  companyId       UUID (FK → Company)
  orderId         UUID? (FK → Order)
  invoiceNumber   String (unique)
  status          Enum(UNPAID, DEPOSIT_PAID, PAID, REFUNDED, VOID)
  totalAmount     Decimal
  depositRequired Decimal? (e.g., 50% of total)
  depositPaid     Decimal (default 0)
  amountPaid      Decimal (default 0)
  dueDate         DateTime?
  issuedAt        DateTime
  paidAt          DateTime?
  stripeInvoiceId String?
  createdAt       DateTime
  updatedAt       DateTime
```

### Payment
```
Payment
  id                  UUID (PK)
  invoiceId           UUID (FK → Invoice)
  amount              Decimal
  type                Enum(DEPOSIT, FULL, PARTIAL)
  stripePaymentIntentId String?
  stripeChargeId      String?
  status              Enum(PENDING, SUCCEEDED, FAILED, REFUNDED)
  paidById            UUID (FK → User)
  createdAt           DateTime
```

### Shipment
```
Shipment
  id              UUID (PK)
  orderId         UUID (FK → Order)
  locationId      UUID (FK → Location, destination)
  carrier         String?
  trackingNumber  String?
  packingSlipUrl  String?
  status          Enum(PENDING, SHIPPED, DELIVERED)
  shippedAt       DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime
```

### MessageThread + Message
```
MessageThread
  id              UUID (PK)
  companyId       UUID (FK → Company)
  orderId         UUID? (FK → Order, optional link)
  proofId         UUID? (FK → Proof, optional link)
  subject         String
  status          Enum(OPEN, CLOSED)
  createdById     UUID (FK → User)
  createdAt       DateTime
  updatedAt       DateTime

Message
  id              UUID (PK)
  threadId        UUID (FK → MessageThread)
  authorId        UUID (FK → User)
  body            String
  attachmentUrls  JSON?
  createdAt       DateTime
```

### InventoryItem + InventoryLedgerEntry
```
InventoryItem
  id              UUID (PK)
  companyId       UUID (FK → Company)
  locationId      UUID (FK → Location)
  sku             String
  productName     String
  color           String?
  size            String?
  onHand          Int
  reserved        Int (default 0)
  available       Int (computed: onHand - reserved)
  updatedAt       DateTime

InventoryLedgerEntry
  id              UUID (PK)
  itemId          UUID (FK → InventoryItem)
  adjustedById    UUID (FK → User)
  quantityChange  Int (positive = add, negative = remove)
  reason          String
  createdAt       DateTime
```

### AuditLogEvent
```
AuditLogEvent
  id              UUID (PK)
  companyId       UUID? (FK → Company)
  userId          UUID? (FK → User)
  action          String (e.g., "order.created", "proof.approved")
  entityType      String (e.g., "Order", "Proof")
  entityId        UUID?
  metadata        JSON?
  ipAddress       String?
  createdAt       DateTime
```

---

## D. API Design (v1)

All endpoints are REST, prefixed with `/api`. Tenant scoping is enforced by middleware — the authenticated user's `companyId` is injected into every query.

### Auth
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Email + password login | Public |
| POST | `/api/auth/logout` | Clear session | Any |
| POST | `/api/auth/forgot-password` | Send reset email | Public |
| POST | `/api/auth/reset-password` | Reset with token | Public |
| POST | `/api/auth/register` | Register via invite code | Public |

### Me / Tenancy
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/me` | Current user + company | Any |
| GET | `/api/company` | Company profile | Client Admin, Staff |
| PATCH | `/api/company` | Update company profile | Client Admin, Staff |
| GET | `/api/company/users` | List users in company | Client Admin, Staff |
| POST | `/api/company/users/invite` | Send invite | Client Admin, Staff |
| PATCH | `/api/company/users/:id` | Update user role/status | Client Admin, Staff |
| GET | `/api/company/locations` | List locations | Any |
| POST | `/api/company/locations` | Add location | Client Admin, Staff |
| PATCH | `/api/company/locations/:id` | Update location | Client Admin, Staff |
| DELETE | `/api/company/locations/:id` | Remove location | Client Admin, Staff |

### Orders
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/orders` | List orders (filtered) | Any |
| POST | `/api/orders` | Create order | Client Admin, Client User, Staff |
| GET | `/api/orders/:id` | Order detail | Any (own company) |
| PATCH | `/api/orders/:id` | Update order | Client Admin, Staff |
| POST | `/api/orders/:id/reorder` | Duplicate as new draft | Client Admin, Client User |
| PATCH | `/api/orders/:id/status` | Update status | Staff only |
| GET | `/api/orders/:id/items` | List line items | Any (own company) |
| POST | `/api/orders/:id/items` | Add line item | Client Admin, Client User, Staff |
| PATCH | `/api/orders/:id/items/:itemId` | Update line item | Client Admin, Client User, Staff |
| DELETE | `/api/orders/:id/items/:itemId` | Remove line item | Client Admin, Client User, Staff |

### Shipments (multi-ship)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/orders/:id/shipments` | List shipments for order | Any (own company) |
| POST | `/api/orders/:id/shipments` | Add shipment destination | Client Admin, Staff |
| PATCH | `/api/shipments/:id` | Update tracking/status | Staff only |

### Saved Products
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/saved-products` | List saved products | Any |
| POST | `/api/saved-products` | Create saved product | Client Admin, Client User |
| GET | `/api/saved-products/:id` | Detail | Any (own company) |
| PATCH | `/api/saved-products/:id` | Update | Client Admin |
| DELETE | `/api/saved-products/:id` | Soft delete | Client Admin |

### Artwork
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/artwork` | List artwork assets | Any |
| POST | `/api/artwork` | Create asset + get upload URL | Any |
| GET | `/api/artwork/:id` | Detail with versions | Any (own company) |
| POST | `/api/artwork/:id/versions` | Upload new version | Any |

### Proofs
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/orders/:id/proofs` | List proofs for order | Any (own company) |
| POST | `/api/orders/:id/proofs` | Publish proof | Staff only |
| GET | `/api/proofs/:id` | Proof detail | Any (own company) |
| POST | `/api/proofs/:id/annotations` | Add annotation | Any (own company) |
| PATCH | `/api/proofs/:id/annotations/:aId` | Resolve annotation | Any (own company) |
| POST | `/api/proofs/:id/approve` | Approve (locks proof) | Client Admin |
| POST | `/api/proofs/:id/request-revision` | Request changes (unlocks for new version) | Client Admin |

**Proof locking rules:**
1. When a client approves, `status` → `APPROVED`, `lockedAt` is set. No more annotations allowed.
2. Client can request revision → status goes to `REVISION_REQUESTED`. CCC Staff publishes new version.
3. If order is `IN_PRODUCTION` or later, revision requests are blocked.

### Billing
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/invoices` | List invoices | Any |
| GET | `/api/invoices/:id` | Invoice detail | Any (own company) |
| POST | `/api/invoices` | Issue invoice | Staff only |
| POST | `/api/invoices/:id/pay` | Pay (deposit or full) | Client Admin |
| GET | `/api/billing/payment-methods` | List saved cards | Client Admin |
| POST | `/api/billing/payment-methods` | Save card (Stripe SetupIntent) | Client Admin |
| DELETE | `/api/billing/payment-methods/:id` | Remove card | Client Admin |

### Support
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/threads` | List threads | Any |
| POST | `/api/threads` | Create thread | Any |
| GET | `/api/threads/:id` | Thread with messages | Any (own company) |
| POST | `/api/threads/:id/messages` | Post message | Any (own company) |
| PATCH | `/api/threads/:id` | Close/reopen thread | Client Admin, Staff |

### Admin (CCC Staff only)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/companies` | List all companies | Staff |
| GET | `/api/admin/companies/:id` | Company detail | Staff |
| POST | `/api/admin/companies` | Create company | Staff |
| GET | `/api/admin/audit-log` | Global audit log | Staff |

---

## E. Database Schema Draft (Prisma)

See `prisma/schema.prisma` in the repo for the full schema. Key indexing decisions:

### Indexes (added first)
```
User:           @@index([companyId])        -- list users by company
                @@unique([email])           -- login lookup
Order:          @@index([companyId, status]) -- filtered order list
                @@index([companyId, createdAt]) -- sorted order list
                @@unique([orderNumber])
OrderItem:      @@index([orderId])
Invoice:        @@index([companyId, status])
                @@unique([invoiceNumber])
Payment:        @@index([invoiceId])
Proof:          @@index([orderId])
ArtworkAsset:   @@index([companyId])
MessageThread:  @@index([companyId])
InventoryItem:  @@index([companyId, locationId])
AuditLogEvent:  @@index([companyId, createdAt])
                @@index([entityType, entityId])
```

### Relations summary
```
Company  1 ←→ N  User
Company  1 ←→ N  Order
Company  1 ←→ N  Location
Company  1 ←→ N  SavedProduct
Company  1 ←→ N  ArtworkAsset
Company  1 ←→ N  Invoice
Company  1 ←→ N  MessageThread
Company  1 ←→ N  InventoryItem
Order    1 ←→ N  OrderItem
Order    1 ←→ N  Proof
Order    1 ←→ N  Shipment
Order    1 ←→ N  Invoice
Order    0 ←→ 1  Order (reorderedFrom)
Proof    1 ←→ N  ProofAnnotation
Invoice  1 ←→ N  Payment
MessageThread 1 ←→ N Message
InventoryItem 1 ←→ N InventoryLedgerEntry
ArtworkAsset  1 ←→ N ArtworkVersion
```

---

## F. Permission Matrix

| Action | Client User | Client Admin | CCC Staff |
|--------|:-----------:|:------------:|:---------:|
| **Auth & Account** | | | |
| Sign in / sign out | Yes | Yes | Yes |
| Update own profile | Yes | Yes | Yes |
| Reset own password | Yes | Yes | Yes |
| **User Management** | | | |
| View company users | No | Yes | Yes |
| Invite users to company | No | Yes | Yes |
| Deactivate/remove user | No | Yes | Yes |
| Change user role | No | Yes | Yes |
| **Company & Locations** | | | |
| View company profile | Yes | Yes | Yes |
| Edit company profile | No | Yes | Yes |
| Manage locations | No | Yes | Yes |
| **Orders** | | | |
| View own company orders | Yes | Yes | Yes |
| Create order | Yes | Yes | Yes |
| Edit order (draft) | Yes | Yes | Yes |
| Submit order | Yes | Yes | Yes |
| Cancel order | No | Yes | Yes |
| Reorder from past order | Yes | Yes | Yes |
| Update order status | No | No | Yes |
| **Saved Products** | | | |
| View saved products | Yes | Yes | Yes |
| Create saved product | Yes | Yes | Yes |
| Edit saved product | No | Yes | Yes |
| Delete saved product | No | Yes | Yes |
| **Artwork** | | | |
| View artwork library | Yes | Yes | Yes |
| Upload artwork | Yes | Yes | Yes |
| Upload new version | Yes | Yes | Yes |
| Delete artwork | No | Yes | Yes |
| **Proofs** | | | |
| View proofs | Yes | Yes | Yes |
| Publish proof | No | No | Yes |
| Annotate proof | Yes | Yes | Yes |
| Approve proof | No | Yes | No |
| Request proof revision | No | Yes | No |
| **Billing** | | | |
| View invoices | Yes | Yes | Yes |
| Pay invoice (deposit/full) | No | Yes | No |
| Manage payment methods | No | Yes | No |
| Issue invoice | No | No | Yes |
| Void/refund invoice | No | No | Yes |
| **Support** | | | |
| View support threads | Yes | Yes | Yes |
| Create support thread | Yes | Yes | Yes |
| Post message | Yes | Yes | Yes |
| Close/reopen thread | No | Yes | Yes |
| **Inventory** | | | |
| View inventory | Yes | Yes | Yes |
| Adjust inventory | No | No | Yes |
| View inventory ledger | No | Yes | Yes |
| **Admin** | | | |
| View all tenants | No | No | Yes |
| Create company/tenant | No | No | Yes |
| View global audit log | No | No | Yes |

---

## G. MVP Milestone Plan

### Milestone 1: Foundation (Week 1)
**Deliverables:**
- Repo scaffolded (Next.js + Prisma + Tailwind + shadcn/ui)
- Database schema deployed (Company, User, Location)
- Auth flow: login, logout, register via invite code, forgot/reset password
- Middleware: session validation, tenant scoping, role-based guards
- `GET /api/me` endpoint
- App shell: layout with sidebar nav, dashboard placeholder
- CCC Staff can create companies and generate invite codes
- Basic user management (list, invite, deactivate)

### Milestone 2: Orders (Week 2)
**Deliverables:**
- Order CRUD: list, create (wizard), detail view
- Order items with size breakdowns
- Order status timeline (Staff can update)
- Reorder from past order
- Saved Products CRUD
- Multi-ship: assign shipment destinations per order
- Shipment tracking display

### Milestone 3: Artwork + Proofs (Week 2–3)
**Deliverables:**
- Artwork library: upload, version history, usage links
- S3 pre-signed upload + download
- Proof publishing (Staff uploads proof images + PDF)
- Proof viewer with image display
- Annotation layer: pin + comment on proof images
- Approve / request revision flow with locking rules
- Proof state machine enforcement

### Milestone 4: Billing (Week 3)
**Deliverables:**
- Stripe integration: save card, create payment method
- Invoice list + detail views
- Pay invoice (deposit or full) via Stripe Payment Intent
- Payment history + receipts
- Staff can issue invoices linked to orders

### Milestone 5: Support + Polish (Week 3–4)
**Deliverables:**
- Support threads: create, list, detail
- Message posting with file attachments
- Thread linked to orders or proofs (optional)
- Email notifications (Resend): invite, proof published, invoice issued
- Inventory module: basic on-hand counts, manual adjustments, ledger
- Audit log (background writes on all mutations)
- Error states, empty states, loading skeletons
- Mobile responsive pass

---

## H. Repo Scaffolding Plan

### Commands to scaffold and run locally

```bash
# 1. Initialize Next.js with TypeScript, Tailwind, App Router
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git

# 2. Install core dependencies
npm install prisma @prisma/client next-auth@beta bcryptjs
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install stripe zod
npm install -D @types/bcryptjs

# 3. Install UI dependencies
npx shadcn@latest init
npx shadcn@latest add button card input label dialog dropdown-menu
npx shadcn@latest add avatar badge separator sheet sidebar table tabs toast

# 4. Initialize Prisma
npx prisma init --datasource-provider postgresql

# 5. Write schema (see prisma/schema.prisma)
# 6. Run initial migration
npx prisma migrate dev --name init

# 7. Seed database with CCC Staff company + admin user
npx prisma db seed

# 8. Run dev server
npm run dev
```

### Environment variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/csuite?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="csuite-uploads"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Resend (email)
RESEND_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
