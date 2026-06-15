# C-Suite Development Guide

## Quick Start

```bash
npm run dev          # Full setup: docker, prisma generate, db push, seed, next dev
npm run dev:next     # Just Next.js (when DB is already running)
npm run build        # Production build
npm run db:seed      # Re-seed database
```

## Stack

- **Framework**: Next.js 14 App Router (TypeScript, strict mode)
- **Database**: PostgreSQL 16 via Prisma 7 (NOT SQLite)
- **API**: tRPC v11 with superjson transformer
- **Auth**: NextAuth v5, credentials provider, JWT strategy
- **Payments**: Stripe Elements (embedded, not redirect Checkout)
- **Styling**: Tailwind CSS with custom design tokens
- **Path alias**: `@/*` maps to `./src/*`

## Architecture

### Multi-Tenant Model
All tenant-owned data is scoped by `companyId`. Every tRPC query must filter by `ctx.companyId` (provided by the auth middleware). CCC_STAFF can optionally target a different company via `companyId` input params.

### Roles (UserRole enum)
- `CCC_STAFF` — Central Creative staff, can see/manage everything
- `CLIENT_ADMIN` — Client company admin, manages their own company
- `CLIENT_USER` — Client company member, read/limited-write access

### tRPC Procedures
- `protectedProcedure` — any authenticated user
- `staffProcedure` — CCC_STAFF only
- `adminProcedure` — CLIENT_ADMIN or CCC_STAFF

### Route Groups
- `(dashboard)` — authenticated app pages
- `(auth)` — login, register (public)

### Key Directories
```
src/server/trpc/routers/   # tRPC routers (18 total)
src/components/             # React components by domain
src/app/(dashboard)/        # Dashboard pages
src/app/api/                # API routes (auth, webhooks)
prisma/schema.prisma        # Database schema
prisma/seed.ts              # Seed data
```

## Design System (CCC Brand)

### Fonts
- **Display headings**: `font-display` (Poster Gothic ATF) — always uppercase with `tracking-display`
- **Labels/eyebrows**: `font-label` (Acumin Pro Extra Condensed) — uppercase with `tracking-label`
- **Body**: Barlow (default sans)

### Colors — Use Tailwind tokens, NEVER hardcode hex values
- Accent: `coral` / `coral-dark` / `coral-light` (the only brand accent, #da5245)
- Surfaces: `surface-bg`, `surface-card`, `surface-secondary`, `surface-border`
- Text: `foreground`, `foreground-secondary`, `foreground-muted`, `ink-muted`, `ink-faint`
- Do NOT use `text-gray-*` or raw hex like `#333338` — use the token equivalents

### UI Rules
- Max border radius: `rounded-lg` (8px) — never use `rounded-xl` or higher
- Page h1: `font-display text-2xl uppercase tracking-display text-foreground`
- Section headers: `font-label text-[11px] uppercase tracking-label text-ink-muted`

## Seed Accounts (dev only, password: `password123`)

- `admin@centralcreative.co` — CCC_STAFF
- `sarah@acmecorp.com` — CLIENT_ADMIN (Acme Corp)
- `mike@acmecorp.com` — CLIENT_USER (Acme Corp)

## Environment Variables

Required: `DATABASE_URL`, `AUTH_SECRET`
Optional: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

Stripe integration degrades gracefully when keys are missing.

## Common Patterns

### Adding a new tRPC router
1. Create `src/server/trpc/routers/my-router.ts`
2. Use appropriate procedure (`protectedProcedure`, `staffProcedure`, `adminProcedure`)
3. Always scope queries with `ctx.companyId` (or `resolveCompanyId` pattern for staff)
4. Register in `src/server/trpc/root.ts`

### Prisma imports
```ts
import { prisma } from "@/server/db/prisma";
```

### tRPC client imports
```ts
import { trpc } from "@/lib/trpc";
```
