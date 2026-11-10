-- =====================================================================
-- Royal Gas Stove Center — PostgreSQL schema (Neon / any PostgreSQL 13+)
-- Tables only. Data is copied from the old MySQL database with:
--   node scripts/migrate-mysql-to-postgres.mjs
-- (database/schema.sql is the original MySQL version, kept for reference.)
-- =====================================================================

-- Keeps updated_at current on every UPDATE (MySQL did this with ON UPDATE CURRENT_TIMESTAMP).
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(140) NOT NULL UNIQUE,
  tagline       VARCHAR(255),
  description   TEXT,
  image         VARCHAR(255),
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     SMALLINT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  category_id       INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name              VARCHAR(180) NOT NULL,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  short_description VARCHAR(300),
  description       TEXT,
  specs             JSON,   -- JSON (not JSONB) keeps the spec rows in the order they were entered
  images            JSON,
  is_featured       SMALLINT NOT NULL DEFAULT 0,
  is_active         SMALLINT NOT NULL DEFAULT 1,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured);

CREATE TABLE IF NOT EXISTS inquiries (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  email       VARCHAR(160),
  city        VARCHAR(100),
  product     VARCHAR(200),
  message     TEXT,
  source      VARCHAR(40) DEFAULT 'website',
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(255),
  status      VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','closed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries (created_at);

CREATE TABLE IF NOT EXISTS certificates (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  issued_by   VARCHAR(160),
  year        VARCHAR(10),
  image       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   SMALLINT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  designation VARCHAR(160),
  message     TEXT NOT NULL,
  product     VARCHAR(180),
  rating      SMALLINT NOT NULL DEFAULT 5,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   SMALLINT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reels (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  link        VARCHAR(255),
  poster      VARCHAR(255) NOT NULL,
  video       VARCHAR(255),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   SMALLINT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(60) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160),
  password_hash VARCHAR(255) NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id           SERIAL PRIMARY KEY,
  ip_address   VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_ip_time ON login_attempts (ip_address, attempted_at);

CREATE TABLE IF NOT EXISTS settings (
  "key"   VARCHAR(80) PRIMARY KEY,
  "value" TEXT,
  "label" VARCHAR(160),
  "group" VARCHAR(40) DEFAULT 'general'
);

DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
