-- ============================================
-- REFERENCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS airports (
  iata_code   CHAR(3) PRIMARY KEY,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  country     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS airlines (
  iata_code   CHAR(2) PRIMARY KEY,
  name        TEXT NOT NULL
);

-- ============================================
-- FLIGHTS
-- ============================================

CREATE TABLE IF NOT EXISTS flights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin           CHAR(3) NOT NULL REFERENCES airports(iata_code),
  destination      CHAR(3) NOT NULL REFERENCES airports(iata_code),
  departure_at     TIMESTAMPTZ NOT NULL,
  arrival_at       TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  stops            INT NOT NULL DEFAULT 0,
  airline_code     CHAR(2) NOT NULL REFERENCES airlines(iata_code),
  flight_number    TEXT NOT NULL,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flight_number, departure_at)
);

CREATE INDEX IF NOT EXISTS idx_flights_origin_dest ON flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights(departure_at);

-- ============================================
-- CABIN PRICES (economy / premium_economy / business / first)
-- ============================================

CREATE TYPE cabin_class_enum AS ENUM ('economy', 'premium_economy', 'business', 'first');

CREATE TABLE IF NOT EXISTS cabin_prices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id            UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  cabin_class          cabin_class_enum NOT NULL,
  price                NUMERIC(10, 2) NOT NULL,
  currency             CHAR(3) NOT NULL DEFAULT 'GBP',
  seats_available      INT,
  is_cheapest_in_class BOOLEAN DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flight_id, cabin_class)
);

CREATE INDEX IF NOT EXISTS idx_cabin_prices_flight ON cabin_prices(flight_id);

-- ============================================
-- PRICE HISTORY (snapshot every poll)
-- ============================================

CREATE TABLE IF NOT EXISTS price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_price_id  UUID NOT NULL REFERENCES cabin_prices(id) ON DELETE CASCADE,
  price           NUMERIC(10, 2) NOT NULL,
  seats_available INT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_cabin ON price_history(cabin_price_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- ============================================
-- USERS (extends Supabase Auth)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES (routes they watch)
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin      CHAR(3) NOT NULL REFERENCES airports(iata_code),
  destination CHAR(3) NOT NULL REFERENCES airports(iata_code),
  cabin_class cabin_class_enum NOT NULL DEFAULT 'economy',
  max_price   NUMERIC(10, 2),
  currency    CHAR(3) NOT NULL DEFAULT 'GBP',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, origin, destination, cabin_class)
);

-- ============================================
-- DEALS (detected by AI / rule-based system)
-- ============================================

CREATE TABLE IF NOT EXISTS deals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_price_id   UUID NOT NULL REFERENCES cabin_prices(id) ON DELETE CASCADE,
  old_price        NUMERIC(10, 2) NOT NULL,
  new_price        NUMERIC(10, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL,
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_detected ON deals(detected_at);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
