CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_email_unique"
  ON "newsletter_subscriptions" ("email");
