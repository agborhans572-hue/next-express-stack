import { defineConfig, devices } from "@playwright/test";

const fullStack = process.env.E2E_FULL === "true";
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/shiprion_test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: !fullStack,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: fullStack ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: fullStack
    ? [
        {
          command: "corepack pnpm --filter @workspace/api-server dev:e2e",
          url: "http://127.0.0.1:8080/api/healthz",
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            ...process.env,
            NODE_ENV: "development",
            PORT: "8080",
            DATABASE_URL: databaseUrl,
            APP_ORIGIN: baseURL,
            SESSION_SECRET:
              process.env.SESSION_SECRET ??
              "e2e-session-secret-that-is-longer-than-thirty-two-characters",
            SEED_DEVELOPMENT: "true",
            SEED_CUSTOMER_PASSWORD:
              process.env.SEED_CUSTOMER_PASSWORD ?? "Customer-E2E-Password!1",
            SEED_ADMIN_PASSWORD:
              process.env.SEED_ADMIN_PASSWORD ?? "Admin-E2E-Password!1",
          },
        },
        {
          command: "corepack pnpm --filter @workspace/frontend dev",
          url: baseURL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            ...process.env,
            FRONTEND_PORT: "5173",
            API_ORIGIN: "http://127.0.0.1:8080",
          },
        },
      ]
    : {
        command: "corepack pnpm --filter @workspace/frontend dev",
        url: baseURL,
        timeout: 60_000,
        reuseExistingServer: true,
        env: {
          ...process.env,
          FRONTEND_PORT: "5173",
          API_ORIGIN: "http://127.0.0.1:8080",
        },
      },
});
