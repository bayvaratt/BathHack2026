-- ============================================
-- DROP OLD TABLES (clean slate)
-- ============================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS cabin_prices CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS airlines CASCADE;
DROP TABLE IF EXISTS airports CASCADE;
DROP TABLE IF EXISTS price_averages CASCADE;
DROP TABLE IF EXISTS flight_prices CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS origins CASCADE;
DROP TYPE IF EXISTS cabin_class_enum CASCADE;

-- ============================================
-- CABIN CLASS ENUM
-- ============================================

CREATE TYPE cabin_class_enum AS ENUM ('economy', 'premium_economy', 'business', 'first');

-- ============================================
-- ORIGINS — departure airports
-- ============================================

CREATE TABLE origins (
  iata_code text PRIMARY KEY,
  city      text NOT NULL,
  country   text NOT NULL
);

-- ============================================
-- DESTINATIONS — arrival airports
-- ============================================

CREATE TABLE destinations (
  iata_code text PRIMARY KEY,
  city      text NOT NULL,
  country   text NOT NULL,
  region    text NOT NULL  -- e.g. 'Europe', 'Asia', 'Americas'
);

-- ============================================
-- FLIGHT PRICES — price snapshot every poll
-- (this IS the price history — one new row per poll)
-- ============================================

CREATE TABLE flight_prices (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origin         text NOT NULL REFERENCES origins(iata_code),
  destination    text NOT NULL REFERENCES destinations(iata_code),
  flight_number  text NOT NULL,  -- e.g. 'BA117' — uniquely identifies the flight
  departure_date date NOT NULL,
  cabin_class    cabin_class_enum NOT NULL DEFAULT 'economy',
  price_amount   numeric NOT NULL,
  price_currency text NOT NULL DEFAULT 'GBP',
  airline        text NOT NULL,
  stops          integer NOT NULL DEFAULT 0,
  duration       text NOT NULL,  -- e.g. 'PT8H30M' (ISO 8601)
  checked_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flight_prices_route ON flight_prices(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flight_prices_cabin ON flight_prices(cabin_class);
CREATE INDEX IF NOT EXISTS idx_flight_prices_checked ON flight_prices(checked_at);

-- ============================================
-- PRICE AVERAGES — 90-day average per flight/class
-- calculated by Friend 3's script
-- ============================================

CREATE TABLE price_averages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin        text NOT NULL REFERENCES origins(iata_code),
  destination   text NOT NULL REFERENCES destinations(iata_code),
  flight_number text NOT NULL,
  cabin_class   cabin_class_enum NOT NULL,
  average_price numeric NOT NULL,
  currency      text NOT NULL DEFAULT 'GBP',
  sample_count  integer NOT NULL,  -- how many data points used to calculate
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(origin, destination, flight_number, cabin_class)
);

-- ============================================
-- SUBSCRIBERS — no login needed, just email
-- ============================================

CREATE TABLE subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- USER PREFERENCES — routes each subscriber watches
-- one row per destination they pick
-- ============================================

CREATE TABLE user_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  origin        text NOT NULL REFERENCES origins(iata_code),   -- departure airport e.g. BRS
  destination   text NOT NULL REFERENCES destinations(iata_code), -- arrival airport e.g. MAD
  cabin_class   cabin_class_enum NOT NULL DEFAULT 'economy',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, origin, destination, cabin_class)
);

-- ============================================
-- DEALS — discounts detected by AI system
-- ============================================

CREATE TABLE deals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin           text NOT NULL REFERENCES origins(iata_code),
  destination      text NOT NULL REFERENCES destinations(iata_code),
  cabin_class      cabin_class_enum NOT NULL,
  airline          text NOT NULL,
  departure_date   date NOT NULL,
  new_price        numeric NOT NULL,
  currency         text NOT NULL DEFAULT 'GBP',
  discount_percent numeric(5,2) NOT NULL,
  detected_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_detected ON deals(detected_at);

-- ============================================
-- NOTIFICATIONS — alerts sent to users
-- ============================================

CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  deal_id       uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  is_read       boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_subscriber ON notifications(subscriber_id);
