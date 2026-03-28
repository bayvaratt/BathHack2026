-- ============================================
-- MOCK DATA SEED
-- 90 days × 4 cabin classes × 5 routes = 1,800 rows (360 rows per flight)
-- Run this AFTER schema.sql
-- ============================================

-- ============================================
-- STEP 1: Origins (departure airports)
-- ============================================
INSERT INTO origins (iata_code, city, country) VALUES
  ('BRS', 'Bristol',    'UK'),
  ('LHR', 'London',     'UK'),
  ('MAN', 'Manchester', 'UK')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 2: Destinations (arrival airports)
-- ============================================
INSERT INTO destinations (iata_code, city, country, region) VALUES
  ('MAD', 'Madrid',    'Spain',    'Europe'),
  ('LIS', 'Lisbon',    'Portugal', 'Europe'),
  ('BCN', 'Barcelona', 'Spain',    'Europe'),
  ('JFK', 'New York',  'USA',      'Americas'),
  ('DXB', 'Dubai',     'UAE',      'Middle East')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 3: 90 days of flight prices
-- All 4 cabin classes for all 5 routes
-- Price varies realistically using SIN wave
-- ============================================
INSERT INTO flight_prices (
  origin, destination, flight_number, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at
)
SELECT
  f.origin,
  f.destination,
  f.flight_number,
  (CURRENT_DATE + INTERVAL '30 days')::date AS departure_date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.offset))::numeric, 2) AS price_amount,
  'GBP',
  f.airline,
  f.stops,
  f.duration,
  day AS checked_at
FROM generate_series(
  NOW() - INTERVAL '89 days',
  NOW(),
  INTERVAL '1 day'
) AS day
CROSS JOIN (VALUES
  -- ✈ BRS → MAD (Ryanair)
  ('BRS','MAD','FR1234','economy',          150, 30, 0.0, 'Ryanair',          0, 'PT2H30M'),
  ('BRS','MAD','FR1234','premium_economy',  260, 45, 0.5, 'Ryanair',          0, 'PT2H30M'),
  ('BRS','MAD','FR1234','business',         480, 70, 1.0, 'Ryanair',          0, 'PT2H30M'),
  ('BRS','MAD','FR1234','first',            850, 110,1.5, 'Ryanair',          0, 'PT2H30M'),
  -- ✈ BRS → LIS (TAP Air Portugal)
  ('BRS','LIS','TP1235','economy',          175, 35, 0.2, 'TAP Air Portugal',  0, 'PT2H45M'),
  ('BRS','LIS','TP1235','premium_economy',  290, 50, 0.7, 'TAP Air Portugal',  0, 'PT2H45M'),
  ('BRS','LIS','TP1235','business',         530, 85, 1.2, 'TAP Air Portugal',  0, 'PT2H45M'),
  ('BRS','LIS','TP1235','first',            970, 140,1.7, 'TAP Air Portugal',  0, 'PT2H45M'),
  -- ✈ MAN → BCN (Vueling)
  ('MAN','BCN','VY8092','economy',          130, 28, 0.4, 'Vueling',           0, 'PT2H20M'),
  ('MAN','BCN','VY8092','premium_economy',  220, 40, 0.9, 'Vueling',           0, 'PT2H20M'),
  ('MAN','BCN','VY8092','business',         420, 65, 1.4, 'Vueling',           0, 'PT2H20M'),
  ('MAN','BCN','VY8092','first',            780, 105,1.9, 'Vueling',           0, 'PT2H20M'),
  -- ✈ LHR → JFK (British Airways)
  ('LHR','JFK','BA117', 'economy',          390, 75, 0.1, 'British Airways',   0, 'PT8H30M'),
  ('LHR','JFK','BA117', 'premium_economy',  680, 110,0.6, 'British Airways',   0, 'PT8H30M'),
  ('LHR','JFK','BA117', 'business',        1450, 190,1.1, 'British Airways',   0, 'PT8H30M'),
  ('LHR','JFK','BA117', 'first',           2900, 380,1.6, 'British Airways',   0, 'PT8H30M'),
  -- ✈ LHR → DXB (Emirates)
  ('LHR','DXB','EK007', 'economy',          330, 65, 0.3, 'Emirates',          0, 'PT7H00M'),
  ('LHR','DXB','EK007', 'premium_economy',  590, 95, 0.8, 'Emirates',          0, 'PT7H00M'),
  ('LHR','DXB','EK007', 'business',        1250, 175,1.3, 'Emirates',          0, 'PT7H00M'),
  ('LHR','DXB','EK007', 'first',           2500, 340,1.8, 'Emirates',          0, 'PT7H00M')
) AS f(origin, destination, flight_number, cabin_class, base_price, variation, offset, airline, stops, duration);

-- ============================================
-- STEP 4: Calculate 90-day averages
-- and insert into price_averages
-- ============================================
INSERT INTO price_averages (
  origin, destination, flight_number,
  cabin_class, average_price, currency,
  sample_count, calculated_at
)
SELECT
  origin,
  destination,
  flight_number,
  cabin_class,
  ROUND(AVG(price_amount)::numeric, 2) AS average_price,
  price_currency,
  COUNT(*) AS sample_count,
  NOW() AS calculated_at
FROM flight_prices
WHERE checked_at >= NOW() - INTERVAL '90 days'
GROUP BY origin, destination, flight_number, cabin_class, price_currency
ON CONFLICT (origin, destination, flight_number, cabin_class)
DO UPDATE SET
  average_price  = EXCLUDED.average_price,
  sample_count   = EXCLUDED.sample_count,
  calculated_at  = EXCLUDED.calculated_at;
