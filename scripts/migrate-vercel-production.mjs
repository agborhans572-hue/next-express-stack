import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Production database migration skipped for this build target.");
} else {
  console.log("Applying production database migrations before publication.");
  const result = spawnSync(
    process.platform === "win32" ? "corepack.cmd" : "corepack",
    ["pnpm", "--filter", "@workspace/db", "migrate"],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
