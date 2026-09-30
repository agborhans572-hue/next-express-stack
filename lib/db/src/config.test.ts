import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateMigrationDatabaseUrl,
  validateRuntimeDatabaseEnvironment,
} from "./config";

const pooledUrl =
  "postgresql://app:secret@ep-example-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require";
const directUrl =
  "postgresql://owner:secret@ep-example.eu-west-1.aws.neon.tech/neondb?sslmode=require";

test("Vercel accepts only a pooled Neon runtime URL with verified SSL", () => {
  assert.equal(
    validateRuntimeDatabaseEnvironment({
      VERCEL: "1",
      DATABASE_URL: pooledUrl,
    }).hostname,
    "ep-example-pooler.eu-west-1.aws.neon.tech",
  );
  assert.throws(
    () =>
      validateRuntimeDatabaseEnvironment({
        VERCEL: "1",
        DATABASE_URL: directUrl,
      }),
    /pooled Neon endpoint/,
  );
  assert.throws(
    () =>
      validateRuntimeDatabaseEnvironment({
        VERCEL: "1",
        DATABASE_URL: pooledUrl.replace("?sslmode=require", ""),
      }),
    /sslmode/,
  );
});

test("Vercel rejects migration credentials", () => {
  assert.throws(
    () =>
      validateRuntimeDatabaseEnvironment({
        VERCEL: "1",
        DATABASE_URL: pooledUrl,
        MIGRATION_DATABASE_URL: directUrl,
      }),
    /must not be exposed/,
  );
});

test("Neon migrations require the direct endpoint and verified SSL", () => {
  assert.doesNotThrow(() => validateMigrationDatabaseUrl(directUrl));
  assert.throws(
    () => validateMigrationDatabaseUrl(pooledUrl),
    /direct Neon endpoint/,
  );
  assert.throws(
    () =>
      validateMigrationDatabaseUrl(directUrl.replace("?sslmode=require", "")),
    /sslmode/,
  );
});
