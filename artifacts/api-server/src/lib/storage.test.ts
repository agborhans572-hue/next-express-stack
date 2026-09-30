import assert from "node:assert/strict";
import { test } from "node:test";
import { validateVercelR2Environment } from "./storage";

test("Vercel accepts the Cloudflare R2 S3 endpoint", () => {
  assert.doesNotThrow(() =>
    validateVercelR2Environment({
      VERCEL: "1",
      S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
      S3_REGION: "auto",
      S3_FORCE_PATH_STYLE: "false",
    }),
  );
});

test("Vercel rejects non-R2 or insecure object storage", () => {
  assert.throws(
    () =>
      validateVercelR2Environment({
        VERCEL: "1",
        S3_ENDPOINT: "http://storage.example.com",
        S3_REGION: "auto",
        S3_FORCE_PATH_STYLE: "false",
      }),
    /Cloudflare R2 HTTPS endpoint/,
  );
  assert.throws(
    () =>
      validateVercelR2Environment({
        VERCEL: "1",
        S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
        S3_REGION: "us-east-1",
        S3_FORCE_PATH_STYLE: "false",
      }),
    /S3_REGION=auto/,
  );
});
