-- ============================================
-- MOCK DATA SEED
-- Run this AFTER schema.sql
--
-- Direct flights:    90 days × 4 cabin classes × 5 routes = 1,800 rows
-- Connecting flights: 90 days × 4 cabin classes × 2 routes = 720 rows
--                     each with 3 legs in flight_details
-- ============================================

-- ============================================
-- STEP 1: UK Origins (departure airports)
-- ============================================
INSERT INTO origins (iata_code, city, country) VALUES
  ('BRS', 'Bristol',          'UK'),
  ('LHR', 'London Heathrow',  'UK'),
  ('LGW', 'London Gatwick',   'UK'),
  ('MAN', 'Manchester',       'UK'),
  ('EDI', 'Edinburgh',        'UK'),
  ('BHX', 'Birmingham',       'UK'),
  ('STN', 'London Stansted',  'UK')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 2: Destinations
-- ============================================
INSERT INTO destinations (iata_code, city, country, region) VALUES
  ('MAD', 'Madrid',    'Spain',       'Europe'),
  ('LIS', 'Lisbon',    'Portugal',    'Europe'),
  ('BCN', 'Barcelona', 'Spain',       'Europe'),
  ('JFK', 'New York',  'USA',         'Americas'),
  ('DXB', 'Dubai',     'UAE',         'Middle East'),
  ('SYD', 'Sydney',    'Australia',   'Asia Pacific'),
  ('BKK', 'Bangkok',   'Thailand',    'Asia Pacific')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 3: 90 days of flight prices — DIRECT flights
-- 5 routes × 4 cabin classes × 90 days = 1,800 rows
-- Price varies with a SIN wave for realism
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date AS departure_date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.offset))::numeric, 2) AS price_amount,
  'GBP',
  f.airline,
  0,  -- direct flight
  f.duration,
  day AS checked_at,
  true AS checked  -- mark as already checked (historical data)
FROM generate_series(
  NOW() - INTERVAL '89 days',
  NOW(),
  INTERVAL '1 day'
) AS day
CROSS JOIN (VALUES
  -- ✈ BRS → MAD (Ryanair, direct)
  ('BRS','MAD','economy',         150, 30, 0.0, 'Ryanair',         'PT2H30M'),
  ('BRS','MAD','premium_economy', 260, 45, 0.5, 'Ryanair',         'PT2H30M'),
  ('BRS','MAD','business',        480, 70, 1.0, 'Ryanair',         'PT2H30M'),
  ('BRS','MAD','first',           850,110, 1.5, 'Ryanair',         'PT2H30M'),
  -- ✈ BRS → LIS (TAP Air Portugal, direct)
  ('BRS','LIS','economy',         175, 35, 0.2, 'TAP Air Portugal','PT2H45M'),
  ('BRS','LIS','premium_economy', 290, 50, 0.7, 'TAP Air Portugal','PT2H45M'),
  ('BRS','LIS','business',        530, 85, 1.2, 'TAP Air Portugal','PT2H45M'),
  ('BRS','LIS','first',           970,140, 1.7, 'TAP Air Portugal','PT2H45M'),
  -- ✈ MAN → BCN (Vueling, direct)
  ('MAN','BCN','economy',         130, 28, 0.4, 'Vueling',         'PT2H20M'),
  ('MAN','BCN','premium_economy', 220, 40, 0.9, 'Vueling',         'PT2H20M'),
  ('MAN','BCN','business',        420, 65, 1.4, 'Vueling',         'PT2H20M'),
  ('MAN','BCN','first',           780,105, 1.9, 'Vueling',         'PT2H20M'),
  -- ✈ LHR → JFK (British Airways, direct)
  ('LHR','JFK','economy',         390, 75, 0.1, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','premium_economy', 680,110, 0.6, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','business',       1450,190, 1.1, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','first',          2900,380, 1.6, 'British Airways', 'PT8H30M'),
  -- ✈ LHR → DXB (Emirates, direct)
  ('LHR','DXB','economy',         330, 65, 0.3, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','premium_economy', 590, 95, 0.8, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','business',       1250,175, 1.3, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','first',          2500,340, 1.8, 'Emirates',        'PT7H00M')
) AS f(origin, destination, cabin_class, base_price, variation, offset, airline, duration);

-- ============================================
-- STEP 4: 90 days of flight prices — CONNECTING flights
-- 2 routes × 4 cabin classes × 90 days = 720 rows
-- stops = 2 (2 connections = 3 legs)
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date AS departure_date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.offset))::numeric, 2) AS price_amount,
  'GBP',
  f.airline,
  2,  -- 2 connections = 3 legs
  f.duration,
  day AS checked_at,
  true AS checked
FROM generate_series(
  NOW() - INTERVAL '89 days',
  NOW(),
  INTERVAL '1 day'
) AS day
CROSS JOIN (VALUES
  -- ✈ BRS → SYD via LHR + DXB (Emirates, 2 stops)
  ('BRS','SYD','economy',          650,120, 0.2, 'Emirates','PT22H30M'),
  ('BRS','SYD','premium_economy', 1100,180, 0.7, 'Emirates','PT22H30M'),
  ('BRS','SYD','business',        3200,400, 1.2, 'Emirates','PT22H30M'),
  ('BRS','SYD','first',           6500,700, 1.7, 'Emirates','PT22H30M'),
  -- ✈ MAN → BKK via LHR + DXB (Emirates, 2 stops)
  ('MAN','BKK','economy',          520,100, 0.4, 'Emirates','PT18H45M'),
  ('MAN','BKK','premium_economy',  900,160, 0.9, 'Emirates','PT18H45M'),
  ('MAN','BKK','business',        2800,350, 1.4, 'Emirates','PT18H45M'),
  ('MAN','BKK','first',           5500,600, 1.9, 'Emirates','PT18H45M')
) AS f(origin, destination, cabin_class, base_price, variation, offset, airline, duration);

-- ============================================
-- STEP 5: Flight details — legs for CONNECTING flights
-- BRS → SYD:  BRS→LHR → LHR→DXB → DXB→SYD  (3 legs)
-- MAN → BKK:  MAN→LHR → LHR→DXB → DXB→BKK  (3 legs)
-- We insert flight_details for the LATEST row of each route/class combo
-- ============================================

-- BRS → SYD (economy) — 3 legs
WITH fp AS (
  SELECT id FROM flight_prices
  WHERE origin = 'BRS' AND destination = 'SYD' AND cabin_class = 'economy'
  ORDER BY checked_at DESC LIMIT 1
)
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT fp.id, 1, 'EK302', CURRENT_DATE + 30, 'Emirates', 'BRS', 'LHR',
  (CURRENT_DATE + 30 + TIME '06:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '07:20')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 2, 'EK007', CURRENT_DATE + 30, 'Emirates', 'LHR', 'DXB',
  (CURRENT_DATE + 30 + TIME '09:30')::timestamptz,
  (CURRENT_DATE + 30 + TIME '19:45')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 3, 'EK412', CURRENT_DATE + 31, 'Emirates', 'DXB', 'SYD',
  (CURRENT_DATE + 31 + TIME '02:10')::timestamptz,
  (CURRENT_DATE + 31 + TIME '21:30')::timestamptz FROM fp;

-- BRS → SYD (business) — 3 legs
WITH fp AS (
  SELECT id FROM flight_prices
  WHERE origin = 'BRS' AND destination = 'SYD' AND cabin_class = 'business'
  ORDER BY checked_at DESC LIMIT 1
)
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT fp.id, 1, 'EK302', CURRENT_DATE + 30, 'Emirates', 'BRS', 'LHR',
  (CURRENT_DATE + 30 + TIME '06:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '07:20')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 2, 'EK007', CURRENT_DATE + 30, 'Emirates', 'LHR', 'DXB',
  (CURRENT_DATE + 30 + TIME '09:30')::timestamptz,
  (CURRENT_DATE + 30 + TIME '19:45')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 3, 'EK412', CURRENT_DATE + 31, 'Emirates', 'DXB', 'SYD',
  (CURRENT_DATE + 31 + TIME '02:10')::timestamptz,
  (CURRENT_DATE + 31 + TIME '21:30')::timestamptz FROM fp;

-- MAN → BKK (economy) — 3 legs
WITH fp AS (
  SELECT id FROM flight_prices
  WHERE origin = 'MAN' AND destination = 'BKK' AND cabin_class = 'economy'
  ORDER BY checked_at DESC LIMIT 1
)
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT fp.id, 1, 'EK319', CURRENT_DATE + 30, 'Emirates', 'MAN', 'LHR',
  (CURRENT_DATE + 30 + TIME '07:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '08:15')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 2, 'EK007', CURRENT_DATE + 30, 'Emirates', 'LHR', 'DXB',
  (CURRENT_DATE + 30 + TIME '10:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '20:15')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 3, 'EK374', CURRENT_DATE + 31, 'Emirates', 'DXB', 'BKK',
  (CURRENT_DATE + 31 + TIME '01:45')::timestamptz,
  (CURRENT_DATE + 31 + TIME '11:30')::timestamptz FROM fp;

-- MAN → BKK (business) — 3 legs
WITH fp AS (
  SELECT id FROM flight_prices
  WHERE origin = 'MAN' AND destination = 'BKK' AND cabin_class = 'business'
  ORDER BY checked_at DESC LIMIT 1
)
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT fp.id, 1, 'EK319', CURRENT_DATE + 30, 'Emirates', 'MAN', 'LHR',
  (CURRENT_DATE + 30 + TIME '07:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '08:15')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 2, 'EK007', CURRENT_DATE + 30, 'Emirates', 'LHR', 'DXB',
  (CURRENT_DATE + 30 + TIME '10:00')::timestamptz,
  (CURRENT_DATE + 30 + TIME '20:15')::timestamptz FROM fp
UNION ALL
SELECT fp.id, 3, 'EK374', CURRENT_DATE + 31, 'Emirates', 'DXB', 'BKK',
  (CURRENT_DATE + 31 + TIME '01:45')::timestamptz,
  (CURRENT_DATE + 31 + TIME '11:30')::timestamptz FROM fp;

-- ============================================
-- STEP 6: Calculate 90-day averages
-- and upsert into price_averages
-- ============================================
INSERT INTO price_averages (origin, destination, cabin_class, average_price, currency, calculated_at)
SELECT
  origin,
  destination,
  cabin_class,
  ROUND(AVG(price_amount)::numeric, 2) AS average_price,
  price_currency,
  NOW() AS calculated_at
FROM flight_prices
WHERE checked_at >= NOW() - INTERVAL '90 days'
GROUP BY origin, destination, cabin_class, price_currency
ON CONFLICT (origin, destination, cabin_class)
DO UPDATE SET
  average_price = EXCLUDED.average_price,
  calculated_at = EXCLUDED.calculated_at;
