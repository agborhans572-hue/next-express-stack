# Workspace

## Overview

Full-stack monorepo with a React + Vite frontend and Express backend, using TypeScript throughout.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/frontend) with shadcn/ui, Tailwind CSS, wouter routing, TanStack React Query
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for server), Vite (client)

## Artifacts

- **artifacts/frontend** — React + Vite SPA served at `/`
- **artifacts/api-server** — Express API server served at `/api`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Contract

The OpenAPI spec lives at `lib/api-spec/openapi.yaml`. After any change, run codegen to regenerate:

- `lib/api-client-react/src/generated/api.ts` — React Query hooks (used by frontend)
- `lib/api-zod/src/generated/api.ts` — Zod validation schemas (used by server)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Loading System

Custom loading components in `artifacts/frontend/src/components/ui/`:

- **`skeleton.tsx`** — Shimmer skeleton with gradient sweep animation; `SkeletonTable` and `SkeletonCard` helpers
- **`loading-dots.tsx`** — Animated wave-style dots with optional leading text (e.g. "Tracking shipment···")
- **`loading-overlay.tsx`** — Full-page futuristic loading overlay with grid background, glow-sweep lines, and a branded card; supports `light` and `dark` variants
- **`button.tsx`** — Extended with `isLoading` + `loadingText` props; shows `Loader2` spinner and swaps text while pending

CSS keyframes added to `index.css`: `shimmer`, `wave-dot`, `glow-sweep`, `ping-slow`, `pulse-slow`.

## App-Wide Dark Futuristic Theme

Every page uses a consistent dark futuristic theme:

- **Color scheme**: Dark blue-black backgrounds (`#060a13`, `#0a0f1a`) with olive-green accent glows
- **Glass cards**: `bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]`
- **Text**: Headings `text-white`, body `text-gray-400`, labels `text-gray-500`, accents `text-olive-400`
- **Inputs**: `bg-white/[0.05] border-white/[0.1] text-white placeholder:text-gray-500`
- **Status badges**: `bg-{color}-500/15 text-{color}-400 border-{color}-500/25`
- **Buttons**: `bg-olive-500 hover:bg-olive-400 text-white`
- **Effects**: Glassmorphism, animated gradient orbs, grid pattern overlays
- **Utilities** in `index.css`: `.glow-olive`, `.glow-olive-sm`, `.text-gradient-olive`, `.bg-grid-pattern`, `.animate-orb`, `.animate-orb-alt`
- **Animation components** in `fade-in.tsx`: FadeIn, ScaleIn, SlideReveal, CountUp, StaggerList, StaggerItem, FloatIn

Themed pages: homepage, navbar, login, dashboard, track, services, calculator, about, news, contact, admin-login, not-found, privacy, terms, cookies, faq. Admin panel has its own `isDark` toggle system.

## Legal & Support Pages

- **Privacy Policy** (`/privacy`) — 9 sections covering data collection, usage, sharing, security, international transfers, user rights, retention, children's privacy, policy changes
- **Terms & Conditions** (`/terms`) — 10 sections covering acceptance, account security, shipment services, pricing/billing, liability/claims, delivery/returns, IP, prohibited items, dispute resolution, international terms
- **Cookie Policy** (`/cookies`) — 4 cookie types (essential, analytics, functional, marketing) with detailed tables of individual cookies, purposes, and durations; browser management instructions and opt-out tools
- **FAQ** (`/faq`) — 25 questions across 6 categories (Shipping & Delivery, Tracking & Notifications, Pricing & Payment, International Shipping, Insurance & Claims, Account & Support) with search and category navigation

Footer links in homepage updated to point to `/privacy`, `/terms`, `/cookies`, `/faq`.

## Database Schema — shipments table

The `shipmentsTable` (in `lib/db/src/schema/shipments.ts`) has the following fields:

**Sender:** `senderName`, `senderPhone`, `senderStreetAddress`, `senderHomeAddress`, `senderCity`, `senderPostalCode`
**Recipient:** `recipientName`, `recipientEmail`, `recipientPhone`, `recipientStreetAddress`, `recipientHomeAddress`, `recipientCity`, `recipientPostalCode`
**Route:** `origin`, `destination`
**Package:** `weightKg`, `estimatedDelivery`, `status`

All phone and address fields are optional (`text`, nullable). `recipientName`, `origin`, and `destination` are required. The old single `senderAddress`/`recipientAddress` text columns are still present for backward compatibility.

## Registration Flow

Registration is immediate — no email verification step.

1. `POST /api/auth/register` — creates account with `emailVerified: true`, returns `{ message, email }`
2. User is then directed to sign in normally via `POST /api/auth/login`

No SMTP or email sending is used anywhere in the app.

## Admin Form — Country Selects

The admin "Create New Shipment" dialog includes country select dropdowns (replacing the old hardcoded Romania text) in both the origin and destination address sections. The full country list (~160 countries) is defined as the `COUNTRIES` constant in `admin.tsx`.

Existing users were migrated with `email_verified = true` via SQL.

## Live Chat

New DB tables:

- `chat_sessions` — one per user conversation (id, userId, userEmail, status, createdAt, updatedAt)
- `chat_messages` — individual messages (id, sessionId, senderId, senderRole, content, createdAt)

API routes (all require auth):

- `GET /api/chat/sessions` — returns own sessions (user) or all sessions (admin)
- `POST /api/chat/sessions` — creates or returns open session for current user
- `GET /api/chat/sessions/:id/messages` — get messages for session
- `POST /api/chat/sessions/:id/messages` — send message
- `PATCH /api/chat/sessions/:id/close` — admin closes session

Socket.IO events:

- `join:chat(sessionId)` — join a chat room
- `join:admin` — admin joins admin room
- `chat:message` — new message event
- `chat:new_session` — new session notification for admins
- `chat:closed` — session closed event

Frontend:

- `artifacts/frontend/src/components/LiveChat.tsx` — floating chat widget for user dashboard
- Admin panel MessagesPanel has two tabs: "Live Chat" (default), "Contact Form"
