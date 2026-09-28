# Shiprion production runbook

## Vercel + Supabase topology

Supabase is the managed PostgreSQL provider; it does not replace the Shiprion
schema, Drizzle ORM, migrations, authorization, or application sessions. The
same committed migrations continue to be the source of truth.

- Vercel serves the Vite SPA from `public/` and the Express API from the
  catch-all `api/[...path].ts` function.
- Supabase's transaction pooler handles application traffic. Each warm Vercel
  instance opens at most one local PostgreSQL connection.
- A direct connection or the Supabase session pooler runs schema migrations.
- Vercel Cron processes the persistent email outbox once per minute.
- Vercel builds use authenticated HTTP polling for tracking, dashboard, and
  chat refreshes. The long-running deployment still uses Socket.IO.
- Proof-of-delivery files remain private in any S3-compatible bucket. Supabase
  Storage can be used when configured through its S3 endpoint.

## 1. Create and migrate the Supabase database

In the Supabase dashboard, open **Connect** and copy both connection strings:

1. Set `DATABASE_URL` to the **transaction pooler** URL (port `6543`) and make
   sure it uses `sslmode=require`.
2. Set `MIGRATION_DATABASE_URL` to the direct URL or **session pooler** URL
   (port `5432`) with `sslmode=require`. Use the session pooler when the machine
   running migrations does not have IPv6 connectivity.
3. Set `DATABASE_POOL_MAX=1` in Vercel.

Apply reviewed migrations before the first deployment and whenever a release
contains a new file under `lib/db/migrations`:

```powershell
$env:DATABASE_URL="<Supabase transaction-pooler URL>"
$env:MIGRATION_DATABASE_URL="<Supabase direct or session-pooler URL>"
corepack pnpm --filter @workspace/db migrate
```

Do not run `drizzle-kit push` against production, and do not run migrations in
the request handler or concurrently from preview builds.

## 2. Create the first production admin

Run this once from a trusted terminal after migrations. The password is hashed
before insertion; the command never writes it to the repository.

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL="admin@your-domain.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="<a unique 12+ character password>"
corepack pnpm --filter @workspace/api-server bootstrap:admin
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD
```

If that email already belongs to an admin, the command makes no changes. It
will not silently promote a customer account.

## 3. Configure Vercel

Import the repository as one Vercel project and leave the project root at the
repository root. `vercel.json` selects Vite, the build command, output folder,
API function limit, SPA fallback, and email cron schedule.

Add these variables in Vercel Project Settings for Production and Preview:

- `DATABASE_URL`, `DATABASE_POOL_MAX=1`
- `SESSION_SECRET` (at least 32 random characters)
- `APP_ORIGIN` (the final HTTPS production origin, without a trailing path)
- `CRON_SECRET` (at least 16 random characters)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`,
  `SUPPORT_EMAIL`
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`
- `GOOGLE_MAPS_API_KEY` when map geocoding is enabled

Keep `MIGRATION_DATABASE_URL` in the protected release environment or CI
secret store; the running Vercel application does not need it. Vercel preview
origins are admitted from the platform-provided deployment URL, while links in
email continue to use `APP_ORIGIN`.

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

Development sample accounts remain disabled by default. They require
`SEED_DEVELOPMENT=true`, explicit seed passwords, and the separate
`corepack pnpm --filter @workspace/api-server seed` command. Never use sample
seeding to create production accounts.

## Long-running deployment compatibility

The existing non-Vercel process remains supported. `pnpm start` serves the SPA,
runs Socket.IO, verifies SMTP, starts the persistent outbox worker, handles
graceful shutdown, and uses `PORT`. It applies committed migrations at startup;
for stricter release control, apply them beforehand with the migration command.
