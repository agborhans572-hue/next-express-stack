# Shiprion production runbook

## Vercel + Neon + Cloudflare R2 topology

Neon is the managed PostgreSQL provider; it does not replace the Shiprion
schema, Drizzle ORM, migrations, authorization, or application sessions. The
same committed migrations continue to be the source of truth.

- Vercel serves the Vite SPA from `public/` and the Express API from the
  catch-all `api/index.mjs` function.
- Neon's pooled endpoint handles application traffic. Each warm Vercel
  instance opens at most one local PostgreSQL connection.
- A direct Neon connection runs schema migrations outside Vercel.
- Vercel Cron processes the persistent email outbox daily at 02:00 UTC.
- Vercel builds use authenticated HTTP polling for tracking, dashboard, and
  chat refreshes. The long-running deployment still uses Socket.IO.
- Proof-of-delivery files remain private in Cloudflare R2 through its
  S3-compatible endpoint.

## 1. Create and migrate Neon

Create one Neon project with `production` and `preview` branches. In the Neon
connection dialog, copy both connection strings for each branch:

1. Set `DATABASE_URL` to the pooled URL. Its hostname contains `-pooler` and
   the URL must use `sslmode=require`.
2. Set `MIGRATION_DATABASE_URL` to the direct URL with `sslmode=require`.
3. Set `DATABASE_POOL_MAX=1` in Vercel.

Apply reviewed migrations twice to each branch before the first deployment;
the second run verifies that the migration journal is idempotent. Repeat this
whenever a release adds a file under `lib/db/migrations`:

```powershell
$env:DATABASE_URL="<Neon pooled URL>"
$env:MIGRATION_DATABASE_URL="<Neon direct URL>"
corepack pnpm --filter @workspace/db migrate
corepack pnpm --filter @workspace/db migrate
```

Do not run `drizzle-kit push` against production, and do not run migrations in
the request handler or concurrently from preview builds.

## 2. Create the first production admin

Run this once from a trusted terminal after migrations. The password is hashed
before insertion; the command never writes it to the repository.

```powershell
$env:DATABASE_URL="<Neon direct production URL>"
$env:MIGRATION_DATABASE_URL="<Neon direct production URL>"
$env:BOOTSTRAP_ADMIN_EMAIL="admin@your-domain.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="<a unique 12+ character password>"
corepack pnpm --filter @workspace/api-server bootstrap:admin
Remove-Item Env:DATABASE_URL, Env:MIGRATION_DATABASE_URL,
  Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD
```

If that email already belongs to an admin, the command makes no changes. It
will not silently promote a customer account.

## 3. Configure Vercel

Import the repository as one Vercel project and leave the project root at the
repository root. `vercel.json` selects Vite, the build command, output folder,
API function limit, SPA fallback, and email cron schedule.

Add these variables in Vercel Project Settings. Production uses the Neon
`production` branch and its own R2 bucket; Preview uses the Neon `preview`
branch and a separate R2 bucket:

- `DATABASE_URL`, `DATABASE_POOL_MAX=1`
- `SESSION_SECRET` (at least 32 random characters)
- `APP_ORIGIN` (the final HTTPS production origin, without a trailing path)
- `CRON_SECRET` (at least 16 random characters)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`,
  `SUPPORT_EMAIL`
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`
- `GOOGLE_MAPS_API_KEY` when map geocoding is enabled

Never add `MIGRATION_DATABASE_URL` to Vercel. Keep it in a protected local or
release environment only. Vercel preview origins are admitted from the
platform-provided deployment URL, while links in email continue to use
`APP_ORIGIN`.

For Cloudflare R2, create bucket-scoped Object Read & Write tokens and use:

- `S3_REGION=auto`
- `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `S3_FORCE_PATH_STYLE=false`
- the bucket name, access-key ID, and secret generated for that environment

## 4. Build and release

Every Vercel build runs the workspace typecheck and complete frontend/API
build through `pnpm run vercel-build`. GitHub CI additionally runs formatting,
linting, unit and integration tests, browser workflows, and a production
dependency audit.

For each release:

1. Run `corepack pnpm run ci`.
2. Run `corepack pnpm audit --prod --audit-level high`.
3. Apply new migrations once using `MIGRATION_DATABASE_URL`.
4. Deploy the same verified commit to Vercel.
5. Check `/api/healthz`, `/api/readyz`, login, one state-changing request, and
   the latest email cron invocation in Vercel logs.

After production verification, remove Supabase connection variables from every
Vercel environment. Keep the Supabase project only for a short rollback window
with its previously exposed password rotated, then delete it when rollback is
no longer required.

Development sample accounts remain disabled by default. They require
`SEED_DEVELOPMENT=true`, explicit seed passwords, and the separate
`corepack pnpm --filter @workspace/api-server seed` command. Never use sample
seeding to create production accounts.

## Long-running deployment compatibility

The existing non-Vercel process remains supported. `pnpm start` serves the SPA,
runs Socket.IO, verifies SMTP, starts the persistent outbox worker, handles
graceful shutdown, and uses `PORT`. It applies committed migrations at startup;
for stricter release control, apply them beforehand with the migration command.
