# Threat Model

## Project Overview

This project is a logistics and shipment-tracking application built as a pnpm monorepo with a React + Vite frontend (`artifacts/frontend`), an Express API server (`artifacts/api-server`), and a shared PostgreSQL/Drizzle data layer (`lib/db`). It supports public shipment tracking, session-based user accounts, an admin panel, live chat, SMS workflows, and email notifications.

Production-relevant server entry points are the Express app in `artifacts/api-server/src/app.ts`, the HTTP/Socket.IO bootstrap in `artifacts/api-server/src/index.ts`, and the route modules under `artifacts/api-server/src/routes/`. The frontend is untrusted and must not be treated as an enforcement point. The `artifacts/mockup-sandbox` artifact is development-only and should be ignored unless production reachability is demonstrated.

Per platform assumptions, production traffic is served over TLS by default and `NODE_ENV` is `production`.

## Assets

- **User accounts and sessions** — email addresses, password hashes, session cookies, role assignments, and email-verification state. Compromise allows account takeover and admin impersonation.
- **Shipment records** — sender and recipient PII, addresses, phone numbers, tracking numbers, statuses, routes, and delivery dates. Exposure reveals customer and operational data; tampering can falsify logistics state.
- **Tracking history and location data** — tracking events, timestamps, and optional geolocation. This data reveals shipment movement patterns and potentially sensitive business/customer activity.
- **Support communications** — live chat sessions/messages, contact form submissions, and SMS conversations. These contain customer identifiers, message contents, and operational communications.
- **Application secrets and third-party credentials** — session secret, SMTP credentials, Twilio credentials, database access, and optional maps API key. Leakage enables impersonation, message forgery, or infrastructure compromise.

## Trust Boundaries

- **Browser / API boundary** — all frontend requests and Socket.IO events cross from an untrusted client into the Express server. Every protected HTTP route and realtime subscription must be authenticated and authorized server-side.
- **Public / authenticated / admin boundary** — the app exposes public tracking endpoints, user-only shipment/chat features, and admin-only management features. These privilege levels must be strictly separated on the server, not just in the UI.
- **API / database boundary** — the API server has broad write access to PostgreSQL. Injection or broken authorization at the API layer directly exposes or corrupts persistent business data.
- **API / external service boundary** — the server calls SMTP providers, Twilio, and mapping/geocoding providers with secret credentials. Webhooks and outbound requests must validate provenance and avoid unintended disclosure.
- **User / recipient boundary** — shipment senders, recipients, and admins have different visibility expectations. Public tracking should not expose internal/admin-only shipment details, and authenticated users must not access other users' shipment or support data.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/**/*.ts`, `artifacts/api-server/src/socket.ts`
- **Highest-risk areas:** auth and session handling (`routes/auth.ts`, `middleware/auth.ts`), shipment/tracking APIs (`routes/shipments.ts`, `routes/tracking.ts`, `routes/public-track.ts`), support messaging (`routes/chat.ts`, `routes/guest-chat.ts`, `routes/sms.ts`, `socket.ts`), startup seeding (`lib/seed.ts`), and frontend session-scoped cache handling for authenticated data (`frontend/src/context/auth.tsx`, `frontend/src/pages/dashboard.tsx`)
- **Public surfaces:** `/api/auth/*`, `/api/track/:trackingNumber`, `/api/track-zip`, `/api/contact`, `/api/chat/guest-sessions*`, `/api/sms/incoming`, Socket.IO connection path `/api/socket.io`
- **Authenticated surfaces:** `/api/shipments*`, `/api/chat/*`, `/api/auth/me`
- **Admin surfaces:** `/api/users*`, shipment deletion and tracking-event creation, contact inbox, SMS admin APIs, admin realtime listeners
- **Dev-only areas usually out of scope:** `artifacts/mockup-sandbox/**`, generated `dist/**` output unless production routing proves otherwise

## Threat Categories

### Spoofing

This project relies on session-based authentication plus a secondary email-verification flow. The server must only create authenticated sessions after validating the user’s password or a valid, unexpired verification secret for that specific account. Login and other session-establishing routes must not be triggerable cross-site in a way that binds a victim browser to the wrong account. Admin identity must never be inferred from client behavior or untrusted realtime events. Webhooks from Twilio must be verified before they are trusted.

### Tampering

Shipment state, tracking events, recipient details, and support workflows are high-value mutable records. The API must ensure ordinary users can only create and edit the fields they are authorized to control, while status changes, operational notes, and other administrative actions remain admin-only. All client input must be validated and authorization must be enforced against the persisted owner/admin relationship before any write reaches the database.

### Information Disclosure

The application stores customer PII, shipment routes, tracking history, chat transcripts, contact messages, and SMS content. Public endpoints must reveal only intentionally public tracking data, authenticated endpoints must be scoped to the owning user or admin, and realtime channels must not leak admin or customer messages to unauthenticated listeners. Auxiliary lookup features such as postal-code search must not weaken the secrecy assumptions behind tracking-number-based access. Logs and error handling must avoid exposing secrets, credentials, cookies, or internal data.

### Denial of Service

Public auth, contact, tracking, and webhook endpoints can be exercised anonymously or at low cost. These routes must resist brute force and abusive traffic with bounded work, especially for login and verification flows, webhook ingestion, and endpoints that trigger external requests. External calls to email, SMS, and geocoding providers must stay time-bounded so an attacker cannot easily tie up server resources.

### Elevation of Privilege

The main privilege boundaries are between unauthenticated users, authenticated users, and admins. Every admin-only capability must be checked server-side, not only hidden in the frontend. Numeric IDs and tracking identifiers must not permit IDOR access, and realtime subscription mechanisms must enforce the same authorization rules as the corresponding REST endpoints for the full lifetime of the connection, including after logout or session revocation. Startup behavior must not create predictable privileged credentials or other backdoor-like access paths in production.
