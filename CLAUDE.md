# C-Suite

Multi-tenant order management portal for Central Creative Co (a print/merch shop).

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (credentials provider, JWT sessions)
- **File storage**: AWS S3 (pre-signed URLs)
- **Payments**: Stripe (manual invoice pay, deposits)
- **Email**: Resend

## Project Structure

```
src/
  app/
    (auth)/          # Public auth pages (login, register, forgot-password)
    (dashboard)/     # Authenticated app shell with sidebar
      dashboard/     # Dashboard home + all feature pages
    api/             # REST API route handlers
      auth/          # NextAuth routes
      me/            # GET /api/me
  components/
    nav/             # Sidebar, user menu
    ui/              # shadcn/ui components
  lib/
    auth.ts          # NextAuth config
    db.ts            # Prisma client singleton
    permissions.ts   # RBAC permission matrix
    api.ts           # API helpers (requireAuth, tenantWhere, etc.)
    utils.ts         # cn() utility
  generated/
    prisma/          # Generated Prisma client
  middleware.ts      # Auth middleware (redirects, session checks)
prisma/
  schema.prisma      # Database schema
  seed.ts            # Seed script (demo users + companies)
docs/
  PROJECT_KICKOFF.md # Full project spec
```

## Commands

```bash
npm run dev              # Start dev server
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed database
npx prisma studio        # Open Prisma Studio (DB browser)
npx prisma generate      # Regenerate Prisma client
npm run build            # Production build
npm run lint             # ESLint
```

## Roles

- **CCC_STAFF**: Central Creative Co employees. Cross-tenant access.
- **CLIENT_ADMIN**: Primary client contact. Manages users, pays invoices, approves proofs.
- **CLIENT_USER**: Client team member. Views orders, uploads artwork, comments on proofs.

## Multi-Tenancy

Every tenant-owned table has a `companyId` FK. All queries MUST be scoped via `tenantWhere()` from `src/lib/api.ts`. CCC_STAFF can access any tenant.

## Seed Accounts

All passwords: `password123`
- CCC Staff: `admin@centralcreative.co`
- Client Admin: `admin@acme.com`
- Client User: `user@acme.com`

## Key Conventions

- REST API endpoints under `/api/`
- Tenant isolation enforced in middleware + query layer
- Permissions checked via `can(role, action)` from `src/lib/permissions.ts`
- File uploads go through S3 pre-signed URLs, never through the app server
- All monetary amounts stored as `Decimal(10,2)` in Postgres
