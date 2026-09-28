CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  status text NOT NULL DEFAULT 'active',
  full_name text,
  phone text,
  company text,
  email_verified boolean NOT NULL DEFAULT false,
  verification_code text,
  verification_code_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE users SET role = 'customer' WHERE role = 'user';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','operator','support','admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','restricted','banned'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS service_rates (
  id serial PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  base_fee_cents integer NOT NULL,
  per_kg_cents integer NOT NULL,
  fuel_pct real NOT NULL DEFAULT 0,
  min_weight_kg real NOT NULL DEFAULT 0.1,
  max_weight_kg real NOT NULL DEFAULT 1000,
  transit_days_min integer NOT NULL DEFAULT 1,
  transit_days_max integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  CONSTRAINT service_rates_values_check CHECK (
    base_fee_cents >= 0 AND per_kg_cents >= 0 AND fuel_pct >= 0 AND fuel_pct <= 100
    AND min_weight_kg > 0 AND max_weight_kg >= min_weight_kg
    AND transit_days_min >= 0 AND transit_days_max >= transit_days_min
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS service_rates_code_version_uq ON service_rates(code, version);
CREATE INDEX IF NOT EXISTS service_rates_active_idx ON service_rates(active);
INSERT INTO service_rates (code,name,description,version,base_fee_cents,per_kg_cents,fuel_pct,min_weight_kg,max_weight_kg,transit_days_min,transit_days_max)
VALUES
 ('standard','Standard','Reliable road delivery',1,599,250,8,0.1,1000,3,5),
 ('express','Express','Priority next-day delivery',1,1499,600,8,0.1,250,1,2),
 ('international','International','Worldwide parcel delivery',1,3499,1150,8,0.1,100,5,10),
 ('air','Air Freight','Priority air cargo',1,6999,1800,8,1,2000,1,3),
 ('sea','Sea Freight','High-volume ocean freight',1,8999,80,8,25,50000,10,30)
ON CONFLICT (code, version) DO NOTHING;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quotes (
  id serial PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  customer_id integer REFERENCES users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  origin text NOT NULL,
  destination text NOT NULL,
  cargo_type text NOT NULL,
  weight_kg real NOT NULL,
  length_cm real,
  width_cm real,
  height_cm real,
  notes text,
  service_rate_id integer NOT NULL REFERENCES service_rates(id),
  rate_snapshot jsonb NOT NULL,
  estimated_price_cents integer NOT NULL,
  final_price_cents integer,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'submitted',
  valid_until timestamptz,
  offered_at timestamptz,
  accepted_at timestamptz,
  converted_at timestamptz,
  converted_shipment_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_status_check CHECK (status IN ('submitted','under_review','offered','accepted','rejected','expired','converted')),
  CONSTRAINT quotes_money_check CHECK (estimated_price_cents >= 0 AND (final_price_cents IS NULL OR final_price_cents >= 0)),
  CONSTRAINT quotes_weight_check CHECK (weight_kg > 0)
);
CREATE INDEX IF NOT EXISTS quotes_customer_idx ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS quotes_email_idx ON quotes(contact_email);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_converted_shipment_uq ON quotes(converted_shipment_id) WHERE converted_shipment_id IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shipments (
  id serial PRIMARY KEY,
  tracking_number text NOT NULL UNIQUE,
  sender_id integer REFERENCES users(id) ON DELETE SET NULL,
  customer_id integer REFERENCES users(id) ON DELETE SET NULL,
  source_quote_id integer,
  price_cents integer,
  sender_name text,
  sender_phone text,
  sender_address text,
  sender_street_address text,
  sender_home_address text,
  sender_city text,
  sender_postal_code text,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_phone text,
  recipient_address text,
  recipient_street_address text,
  recipient_home_address text,
  recipient_city text,
  recipient_postal_code text,
  origin text NOT NULL,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  weight_kg real,
  estimated_delivery date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customer_id integer REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS source_quote_id integer;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS price_cents integer;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS ownership_needs_review boolean NOT NULL DEFAULT false;
UPDATE shipments SET customer_id = sender_id WHERE customer_id IS NULL AND sender_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM users WHERE users.id = shipments.sender_id AND users.role = 'customer'
);
UPDATE shipments SET ownership_needs_review = true
WHERE customer_id IS NULL AND sender_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM users WHERE users.id = shipments.sender_id AND users.role IN ('admin','operator','support')
);
DO $$ BEGIN
  ALTER TABLE shipments ADD CONSTRAINT shipments_status_check CHECK (status IN ('pending','registered','picked_up','in_transit','customs','on_hold_customs','arrived_at_port','out_for_delivery','delivered','cancelled')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS shipments_customer_idx ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS shipments_status_idx ON shipments(status);
CREATE INDEX IF NOT EXISTS shipments_quote_idx ON shipments(source_quote_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS tracking_events (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  location text NOT NULL,
  status text NOT NULL,
  description text NOT NULL,
  latitude double precision,
  longitude double precision,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tracking_events_shipment_time_idx ON tracking_events(shipment_id, occurred_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages(status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_sessions (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  guest_name text,
  guest_token text,
  guest_token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_sessions_user_status_idx ON chat_sessions(user_id,status);
CREATE TABLE IF NOT EXISTS chat_messages (
  id serial PRIMARY KEY,
  session_id integer NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id integer,
  sender_role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_time_idx ON chat_messages(session_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auth_tokens (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  quote_id integer REFERENCES quotes(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_lookup_idx ON auth_tokens(type,email);
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id,read_at,created_at DESC);
CREATE TABLE IF NOT EXISTS email_outbox (
  id serial PRIMARY KEY,
  to_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_outbox_pending_idx ON email_outbox(status,next_attempt_at);
CREATE TABLE IF NOT EXISTS proof_deliveries (
  id serial PRIMARY KEY,
  shipment_id integer NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  delivered_at timestamptz NOT NULL,
  notes text,
  object_key text NOT NULL,
  original_file_name text NOT NULL,
  content_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
  id serial PRIMARY KEY,
  actor_id integer REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_events(entity_type,entity_id,created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits(expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS user_sessions (
  sid varchar NOT NULL COLLATE "default" PRIMARY KEY,
  sess json NOT NULL,
  expire timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);
