-- Additive migration. Runtime role only receives access to this schema.
-- Rollback: disable the feature and restore the prior release; retain all balances.
CREATE SCHEMA IF NOT EXISTS titans_images;
CREATE TABLE IF NOT EXISTS titans_images.accounts (
  user_id text PRIMARY KEY CHECK (user_id ~ '^user_[A-Za-z0-9]+$'),
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS titans_images.transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES titans_images.accounts(user_id),
  delta integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS titans_images.jobs (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES titans_images.accounts(user_id),
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  kind text NOT NULL CHECK (kind IN ('original', 'selfie')),
  source_id uuid REFERENCES titans_images.jobs(id),
  state text NOT NULL CHECK (state IN ('reserved', 'running', 'unknown', 'succeeded', 'failed')),
  budget_micros integer NOT NULL DEFAULT 250000 CHECK (budget_micros >= 0),
  cost_micros integer CHECK (cost_micros >= 0),
  usage jsonb,
  consent_version text NOT NULL DEFAULT 'images-v1',
  images_expired boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_user_created ON titans_images.jobs(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS titans_images.payments (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES titans_images.accounts(user_id),
  credits integer NOT NULL CHECK (credits > 0),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  revoked integer NOT NULL DEFAULT 0 CHECK (revoked >= 0 AND revoked <= credits),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS titans_images.settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  generation_enabled boolean NOT NULL DEFAULT false,
  sales_enabled boolean NOT NULL DEFAULT false,
  day_micros integer NOT NULL DEFAULT 10000000 CHECK (day_micros >= 0),
  month_micros integer NOT NULL DEFAULT 20000000 CHECK (month_micros >= 0)
);
INSERT INTO titans_images.settings(id) VALUES (true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS titans_images.packs (
  id text PRIMARY KEY,
  price_cents integer NOT NULL CHECK (price_cents BETWEEN 100 AND 100000),
  credits integer NOT NULL CHECK (credits BETWEEN 1 AND 10000),
  enabled boolean NOT NULL DEFAULT true
);
INSERT INTO titans_images.packs(id,price_cents,credits) VALUES
  ('photos_10',500,10), ('photos_25',1000,25), ('photos_40',1500,40),
  ('photos_60',2000,60), ('photos_80',2500,80), ('photos_100',3000,100)
  ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS titans_images.orders (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES titans_images.accounts(user_id),
  pack_id text NOT NULL REFERENCES titans_images.packs(id),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  credits integer NOT NULL CHECK (credits > 0),
  checkout_id text UNIQUE,
  plan_id text,
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS titans_images.admin_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
