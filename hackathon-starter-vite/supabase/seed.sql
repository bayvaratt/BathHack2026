-- ============================================
-- MOCK DATA SEED
-- Run this AFTER schema.sql
--
-- Direct flights:      12 routes × 4 classes × 90 days = 4,320 rows
-- 1-stop connecting:    3 routes × 4 classes × 90 days = 1,080 rows
-- 2-stop connecting:    3 routes × 4 classes × 90 days = 1,080 rows
-- Total flight_prices:  6,480 rows
-- ============================================

-- ============================================
-- STEP 1: Origins — UK airports only
-- ============================================
INSERT INTO origins (iata_code, city, country) VALUES
  ('LHR', 'London Heathrow', 'UK'),
  ('MAN', 'Manchester',      'UK'),
  ('EDI', 'Edinburgh',       'UK')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 2: Destinations — popular from UK
-- ============================================
INSERT INTO destinations (iata_code, city, country, region) VALUES
  -- Europe (short haul, usually direct)
  ('MAD', 'Madrid',        'Spain',       'Europe'),
  ('BCN', 'Barcelona',     'Spain',       'Europe'),
  ('LIS', 'Lisbon',        'Portugal',    'Europe'),
  ('CDG', 'Paris',         'France',      'Europe'),
  ('AMS', 'Amsterdam',     'Netherlands', 'Europe'),
  ('FCO', 'Rome',          'Italy',       'Europe'),
  ('ATH', 'Athens',        'Greece',      'Europe'),
  -- Long haul
  ('JFK', 'New York',      'USA',         'Americas'),
  ('DXB', 'Dubai',         'UAE',         'Middle East'),
  ('BKK', 'Bangkok',       'Thailand',    'Asia Pacific'),
  ('NRT', 'Tokyo',         'Japan',       'Asia Pacific'),
  ('SIN', 'Singapore',     'Singapore',   'Asia Pacific'),
  ('SYD', 'Sydney',        'Australia',   'Asia Pacific'),
  ('PVG', 'Shanghai',      'China',       'Asia Pacific')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================
-- STEP 3: DIRECT flights — 90 days × 4 classes
-- 12 routes, stops = 0
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.phase))::numeric, 2),
  'GBP',
  f.airline,
  0,
  f.duration,
  day,
  true
FROM generate_series(NOW() - INTERVAL '89 days', NOW(), INTERVAL '1 day') AS day
CROSS JOIN (VALUES
  -- ✈ LHR → MAD (British Airways, direct)
  ('LHR','MAD','economy',          90, 20, 0.0, 'British Airways', 'PT2H30M'),
  ('LHR','MAD','premium_economy', 160, 30, 0.5, 'British Airways', 'PT2H30M'),
  ('LHR','MAD','business',        380, 55, 1.0, 'British Airways', 'PT2H30M'),
  ('LHR','MAD','first',           750, 90, 1.5, 'British Airways', 'PT2H30M'),
  -- ✈ LHR → BCN (Vueling, direct)
  ('LHR','BCN','economy',          85, 18, 0.2, 'Vueling',         'PT2H15M'),
  ('LHR','BCN','premium_economy', 150, 28, 0.7, 'Vueling',         'PT2H15M'),
  ('LHR','BCN','business',        350, 50, 1.2, 'Vueling',         'PT2H15M'),
  ('LHR','BCN','first',           700, 85, 1.7, 'Vueling',         'PT2H15M'),
  -- ✈ LHR → CDG (Air France, direct)
  ('LHR','CDG','economy',          75, 15, 0.4, 'Air France',      'PT1H15M'),
  ('LHR','CDG','premium_economy', 140, 25, 0.9, 'Air France',      'PT1H15M'),
  ('LHR','CDG','business',        320, 45, 1.4, 'Air France',      'PT1H15M'),
  ('LHR','CDG','first',           650, 80, 1.9, 'Air France',      'PT1H15M'),
  -- ✈ LHR → AMS (KLM, direct)
  ('LHR','AMS','economy',          80, 16, 0.1, 'KLM',             'PT1H20M'),
  ('LHR','AMS','premium_economy', 145, 26, 0.6, 'KLM',             'PT1H20M'),
  ('LHR','AMS','business',        340, 48, 1.1, 'KLM',             'PT1H20M'),
  ('LHR','AMS','first',           680, 82, 1.6, 'KLM',             'PT1H20M'),
  -- ✈ LHR → JFK (British Airways, direct)
  ('LHR','JFK','economy',         390, 75, 0.3, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','premium_economy', 680,110, 0.8, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','business',       1450,190, 1.3, 'British Airways', 'PT8H30M'),
  ('LHR','JFK','first',          2900,380, 1.8, 'British Airways', 'PT8H30M'),
  -- ✈ LHR → DXB (Emirates, direct)
  ('LHR','DXB','economy',         330, 65, 0.0, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','premium_economy', 590, 95, 0.5, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','business',       1250,175, 1.0, 'Emirates',        'PT7H00M'),
  ('LHR','DXB','first',          2500,340, 1.5, 'Emirates',        'PT7H00M'),
  -- ✈ LHR → NRT (Japan Airlines, direct)
  ('LHR','NRT','economy',         520, 95, 0.2, 'Japan Airlines',  'PT12H00M'),
  ('LHR','NRT','premium_economy', 900,150, 0.7, 'Japan Airlines',  'PT12H00M'),
  ('LHR','NRT','business',       2200,300, 1.2, 'Japan Airlines',  'PT12H00M'),
  ('LHR','NRT','first',          5500,600, 1.7, 'Japan Airlines',  'PT12H00M'),
  -- ✈ MAN → LIS (TAP Air Portugal, direct)
  ('MAN','LIS','economy',         140, 28, 0.4, 'TAP Air Portugal','PT2H45M'),
  ('MAN','LIS','premium_economy', 250, 42, 0.9, 'TAP Air Portugal','PT2H45M'),
  ('MAN','LIS','business',        480, 72, 1.4, 'TAP Air Portugal','PT2H45M'),
  ('MAN','LIS','first',           900,120, 1.9, 'TAP Air Portugal','PT2H45M'),
  -- ✈ MAN → FCO (Ryanair, direct)
  ('MAN','FCO','economy',         100, 22, 0.1, 'Ryanair',         'PT2H50M'),
  ('MAN','FCO','premium_economy', 180, 32, 0.6, 'Ryanair',         'PT2H50M'),
  ('MAN','FCO','business',        400, 60, 1.1, 'Ryanair',         'PT2H50M'),
  ('MAN','FCO','first',           780,100, 1.6, 'Ryanair',         'PT2H50M'),
  -- ✈ MAN → DXB (Emirates, direct)
  ('MAN','DXB','economy',         310, 62, 0.3, 'Emirates',        'PT7H15M'),
  ('MAN','DXB','premium_economy', 560, 92, 0.8, 'Emirates',        'PT7H15M'),
  ('MAN','DXB','business',       1200,170, 1.3, 'Emirates',        'PT7H15M'),
  ('MAN','DXB','first',          2400,320, 1.8, 'Emirates',        'PT7H15M'),
  -- ✈ EDI → BCN (Vueling, direct)
  ('EDI','BCN','economy',         110, 22, 0.5, 'Vueling',         'PT2H30M'),
  ('EDI','BCN','premium_economy', 195, 35, 1.0, 'Vueling',         'PT2H30M'),
  ('EDI','BCN','business',        420, 62, 1.5, 'Vueling',         'PT2H30M'),
  ('EDI','BCN','first',           820,100, 2.0, 'Vueling',         'PT2H30M'),
  -- ✈ EDI → ATH (EasyJet, direct)
  ('EDI','ATH','economy',         130, 25, 0.7, 'EasyJet',         'PT3H30M'),
  ('EDI','ATH','premium_economy', 230, 38, 1.2, 'EasyJet',         'PT3H30M'),
  ('EDI','ATH','business',        470, 68, 1.7, 'EasyJet',         'PT3H30M'),
  ('EDI','ATH','first',           880,108, 2.2, 'EasyJet',         'PT3H30M')
) AS f(origin, destination, cabin_class, base_price, variation, phase, airline, duration);

-- ============================================
-- STEP 3B: MISSING routes to reach 14×3×4 = 168 price averages
-- All added as direct flights for simplicity
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.phase))::numeric, 2),
  'GBP',
  f.airline,
  0,
  f.duration,
  day,
  true
FROM generate_series(NOW() - INTERVAL '89 days', NOW(), INTERVAL '1 day') AS day
CROSS JOIN (VALUES
  -- ✈ LHR missing routes
  ('LHR','LIS','economy',  120, 25, 0.1, 'TAP Air Portugal', 'PT2H30M'),
  ('LHR','LIS','premium_economy', 210, 38, 0.6, 'TAP Air Portugal', 'PT2H30M'),
  ('LHR','LIS','business', 420, 65, 1.1, 'TAP Air Portugal', 'PT2H30M'),
  ('LHR','LIS','first',    800,105, 1.6, 'TAP Air Portugal', 'PT2H30M'),

  ('LHR','FCO','economy',  100, 22, 0.2, 'Ryanair',          'PT2H40M'),
  ('LHR','FCO','premium_economy', 180, 33, 0.7, 'Ryanair',   'PT2H40M'),
  ('LHR','FCO','business', 390, 58, 1.2, 'Ryanair',          'PT2H40M'),
  ('LHR','FCO','first',    760, 95, 1.7, 'Ryanair',          'PT2H40M'),

  ('LHR','ATH','economy',  110, 23, 0.3, 'EasyJet',          'PT3H30M'),
  ('LHR','ATH','premium_economy', 195, 35, 0.8, 'EasyJet',   'PT3H30M'),
  ('LHR','ATH','business', 410, 60, 1.3, 'EasyJet',          'PT3H30M'),
  ('LHR','ATH','first',    790, 98, 1.8, 'EasyJet',          'PT3H30M'),

  ('LHR','SIN','economy',  480, 90, 0.4, 'Emirates',         'PT13H00M'),
  ('LHR','SIN','premium_economy', 830,135, 0.9, 'Emirates',  'PT13H00M'),
  ('LHR','SIN','business',1900,260, 1.4, 'Emirates',         'PT13H00M'),
  ('LHR','SIN','first',   4000,500, 1.9, 'Emirates',         'PT13H00M'),

  ('LHR','PVG','economy',  550,100, 0.5, 'China Eastern',    'PT11H00M'),
  ('LHR','PVG','premium_economy', 950,150, 1.0, 'China Eastern','PT11H00M'),
  ('LHR','PVG','business',2300,310, 1.5, 'China Eastern',    'PT11H00M'),
  ('LHR','PVG','first',   4800,580, 2.0, 'China Eastern',    'PT11H00M'),

  -- ✈ MAN missing routes
  ('MAN','MAD','economy',   95, 20, 0.1, 'Ryanair',          'PT2H40M'),
  ('MAN','MAD','premium_economy', 170, 30, 0.6, 'Ryanair',   'PT2H40M'),
  ('MAN','MAD','business', 370, 55, 1.1, 'Ryanair',          'PT2H40M'),
  ('MAN','MAD','first',    720, 88, 1.6, 'Ryanair',          'PT2H40M'),

  ('MAN','BCN','economy',   90, 19, 0.2, 'Vueling',          'PT2H25M'),
  ('MAN','BCN','premium_economy', 160, 28, 0.7, 'Vueling',   'PT2H25M'),
  ('MAN','BCN','business', 355, 52, 1.2, 'Vueling',          'PT2H25M'),
  ('MAN','BCN','first',    700, 85, 1.7, 'Vueling',          'PT2H25M'),

  ('MAN','CDG','economy',   80, 17, 0.3, 'Air France',       'PT1H45M'),
  ('MAN','CDG','premium_economy', 145, 26, 0.8, 'Air France','PT1H45M'),
  ('MAN','CDG','business', 330, 48, 1.3, 'Air France',       'PT1H45M'),
  ('MAN','CDG','first',    660, 82, 1.8, 'Air France',       'PT1H45M'),

  ('MAN','AMS','economy',   85, 18, 0.4, 'KLM',              'PT1H50M'),
  ('MAN','AMS','premium_economy', 150, 27, 0.9, 'KLM',       'PT1H50M'),
  ('MAN','AMS','business', 340, 50, 1.4, 'KLM',              'PT1H50M'),
  ('MAN','AMS','first',    670, 83, 1.9, 'KLM',              'PT1H50M'),

  ('MAN','ATH','economy',  120, 24, 0.5, 'EasyJet',          'PT3H40M'),
  ('MAN','ATH','premium_economy', 210, 36, 1.0, 'EasyJet',   'PT3H40M'),
  ('MAN','ATH','business', 430, 63, 1.5, 'EasyJet',          'PT3H40M'),
  ('MAN','ATH','first',    820,102, 2.0, 'EasyJet',          'PT3H40M'),

  ('MAN','JFK','economy',  400, 78, 0.6, 'British Airways',  'PT8H45M'),
  ('MAN','JFK','premium_economy', 700,115, 1.1, 'British Airways','PT8H45M'),
  ('MAN','JFK','business',1480,195, 1.6, 'British Airways',  'PT8H45M'),
  ('MAN','JFK','first',   2950,385, 2.1, 'British Airways',  'PT8H45M'),

  ('MAN','BKK','economy',  440, 84, 0.7, 'Emirates',         'PT13H30M'),
  ('MAN','BKK','premium_economy', 760,125, 1.2, 'Emirates',  'PT13H30M'),
  ('MAN','BKK','business',1850,255, 1.7, 'Emirates',         'PT13H30M'),
  ('MAN','BKK','first',   3900,490, 2.2, 'Emirates',         'PT13H30M'),

  ('MAN','SYD','economy',  700,125, 0.8, 'Emirates',         'PT22H00M'),
  ('MAN','SYD','premium_economy',1180,185, 1.3, 'Emirates',  'PT22H00M'),
  ('MAN','SYD','business',3300,430, 1.8, 'Emirates',         'PT22H00M'),
  ('MAN','SYD','first',   6600,710, 2.3, 'Emirates',         'PT22H00M'),

  ('MAN','PVG','economy',  570,105, 0.9, 'China Eastern',    'PT10H30M'),
  ('MAN','PVG','premium_economy', 970,155, 1.4, 'China Eastern','PT10H30M'),
  ('MAN','PVG','business',2350,315, 1.9, 'China Eastern',    'PT10H30M'),
  ('MAN','PVG','first',   4900,590, 2.4, 'China Eastern',    'PT10H30M'),

  -- ✈ EDI missing routes
  ('EDI','MAD','economy',  100, 21, 0.1, 'Ryanair',          'PT2H45M'),
  ('EDI','MAD','premium_economy', 178, 32, 0.6, 'Ryanair',   'PT2H45M'),
  ('EDI','MAD','business', 385, 56, 1.1, 'Ryanair',          'PT2H45M'),
  ('EDI','MAD','first',    740, 92, 1.6, 'Ryanair',          'PT2H45M'),

  ('EDI','LIS','economy',  115, 23, 0.2, 'TAP Air Portugal', 'PT3H00M'),
  ('EDI','LIS','premium_economy', 200, 35, 0.7, 'TAP Air Portugal','PT3H00M'),
  ('EDI','LIS','business', 415, 62, 1.2, 'TAP Air Portugal', 'PT3H00M'),
  ('EDI','LIS','first',    795,100, 1.7, 'TAP Air Portugal', 'PT3H00M'),

  ('EDI','CDG','economy',   82, 17, 0.3, 'Air France',       'PT1H55M'),
  ('EDI','CDG','premium_economy', 148, 27, 0.8, 'Air France','PT1H55M'),
  ('EDI','CDG','business', 335, 49, 1.3, 'Air France',       'PT1H55M'),
  ('EDI','CDG','first',    665, 82, 1.8, 'Air France',       'PT1H55M'),

  ('EDI','AMS','economy',   87, 18, 0.4, 'KLM',              'PT1H55M'),
  ('EDI','AMS','premium_economy', 153, 28, 0.9, 'KLM',       'PT1H55M'),
  ('EDI','AMS','business', 342, 50, 1.4, 'KLM',              'PT1H55M'),
  ('EDI','AMS','first',    672, 83, 1.9, 'KLM',              'PT1H55M'),

  ('EDI','FCO','economy',  105, 22, 0.5, 'Ryanair',          'PT2H55M'),
  ('EDI','FCO','premium_economy', 185, 33, 1.0, 'Ryanair',   'PT2H55M'),
  ('EDI','FCO','business', 395, 58, 1.5, 'Ryanair',          'PT2H55M'),
  ('EDI','FCO','first',    765, 96, 2.0, 'Ryanair',          'PT2H55M'),

  ('EDI','DXB','economy',  340, 67, 0.6, 'Emirates',         'PT7H30M'),
  ('EDI','DXB','premium_economy', 600, 97, 1.1, 'Emirates',  'PT7H30M'),
  ('EDI','DXB','business',1270,178, 1.6, 'Emirates',         'PT7H30M'),
  ('EDI','DXB','first',   2550,345, 2.1, 'Emirates',         'PT7H30M'),

  ('EDI','BKK','economy',  450, 86, 0.7, 'Emirates',         'PT14H00M'),
  ('EDI','BKK','premium_economy', 775,128, 1.2, 'Emirates',  'PT14H00M'),
  ('EDI','BKK','business',1870,258, 1.7, 'Emirates',         'PT14H00M'),
  ('EDI','BKK','first',   3950,495, 2.2, 'Emirates',         'PT14H00M'),

  ('EDI','NRT','economy',  540, 98, 0.8, 'Japan Airlines',   'PT12H30M'),
  ('EDI','NRT','premium_economy', 920,153, 1.3, 'Japan Airlines','PT12H30M'),
  ('EDI','NRT','business',2250,305, 1.8, 'Japan Airlines',   'PT12H30M'),
  ('EDI','NRT','first',   5600,610, 2.3, 'Japan Airlines',   'PT12H30M'),

  ('EDI','SIN','economy',  490, 92, 0.9, 'Emirates',         'PT13H30M'),
  ('EDI','SIN','premium_economy', 845,138, 1.4, 'Emirates',  'PT13H30M'),
  ('EDI','SIN','business',1950,265, 1.9, 'Emirates',         'PT13H30M'),
  ('EDI','SIN','first',   4100,505, 2.4, 'Emirates',         'PT13H30M'),

  ('EDI','SYD','economy',  710,128, 1.0, 'Emirates',         'PT22H30M'),
  ('EDI','SYD','premium_economy',1190,188, 1.5, 'Emirates',  'PT22H30M'),
  ('EDI','SYD','business',3350,435, 2.0, 'Emirates',         'PT22H30M'),
  ('EDI','SYD','first',   6650,715, 2.5, 'Emirates',         'PT22H30M'),

  ('EDI','PVG','economy',  560,103, 1.1, 'China Eastern',    'PT11H30M'),
  ('EDI','PVG','premium_economy', 960,153, 1.6, 'China Eastern','PT11H30M'),
  ('EDI','PVG','business',2320,313, 2.1, 'China Eastern',    'PT11H30M'),
  ('EDI','PVG','first',   4850,585, 2.6, 'China Eastern',    'PT11H30M')
) AS f(origin, destination, cabin_class, base_price, variation, phase, airline, duration);

-- ============================================
-- STEP 4: 1-STOP connecting flights — 90 days × 4 classes
-- 3 routes, stops = 1 (2 legs each)
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.phase))::numeric, 2),
  'GBP',
  f.airline,
  1,
  f.duration,
  day,
  true
FROM generate_series(NOW() - INTERVAL '89 days', NOW(), INTERVAL '1 day') AS day
CROSS JOIN (VALUES
  -- ✈ LHR → BKK via DXB (Emirates, 1 stop)
  ('LHR','BKK','economy',         420, 80, 0.1, 'Emirates', 'PT15H30M'),
  ('LHR','BKK','premium_economy', 720,120, 0.6, 'Emirates', 'PT15H30M'),
  ('LHR','BKK','business',       1800,250, 1.1, 'Emirates', 'PT15H30M'),
  ('LHR','BKK','first',          3800,480, 1.6, 'Emirates', 'PT15H30M'),
  -- ✈ MAN → SIN via DXB (Emirates, 1 stop)
  ('MAN','SIN','economy',         480, 90, 0.3, 'Emirates', 'PT16H00M'),
  ('MAN','SIN','premium_economy', 820,135, 0.8, 'Emirates', 'PT16H00M'),
  ('MAN','SIN','business',       2000,270, 1.3, 'Emirates', 'PT16H00M'),
  ('MAN','SIN','first',          4200,500, 1.8, 'Emirates', 'PT16H00M'),
  -- ✈ EDI → JFK via LHR (British Airways, 1 stop)
  ('EDI','JFK','economy',         420, 80, 0.5, 'British Airways', 'PT11H00M'),
  ('EDI','JFK','premium_economy', 730,120, 1.0, 'British Airways', 'PT11H00M'),
  ('EDI','JFK','business',       1600,220, 1.5, 'British Airways', 'PT11H00M'),
  ('EDI','JFK','first',          3200,430, 2.0, 'British Airways', 'PT11H00M')
) AS f(origin, destination, cabin_class, base_price, variation, phase, airline, duration);

-- ============================================
-- STEP 5: 2-STOP connecting flights — 90 days × 4 classes
-- 3 routes, stops = 2 (3 legs each)
-- ============================================
INSERT INTO flight_prices (
  origin, destination, departure_date,
  cabin_class, price_amount, price_currency,
  airline, stops, duration, checked_at, checked
)
SELECT
  f.origin,
  f.destination,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  f.cabin_class::cabin_class_enum,
  ROUND((f.base_price + f.variation * SIN(EXTRACT(DOY FROM day) * 0.3 + f.phase))::numeric, 2),
  'GBP',
  f.airline,
  2,
  f.duration,
  day,
  true
FROM generate_series(NOW() - INTERVAL '89 days', NOW(), INTERVAL '1 day') AS day
CROSS JOIN (VALUES
  -- ✈ LHR → BKK via DXB + PVG (London→Dubai→Shanghai→Bangkok, 2 stops)
  ('LHR','BKK','economy',         580,110, 0.2, 'Emirates', 'PT22H00M'),
  ('LHR','BKK','premium_economy', 980,165, 0.7, 'Emirates', 'PT22H00M'),
  ('LHR','BKK','business',       2400,320, 1.2, 'Emirates', 'PT22H00M'),
  ('LHR','BKK','first',          5000,600, 1.7, 'Emirates', 'PT22H00M'),
  -- ✈ LHR → SYD via DXB + SIN (London→Dubai→Singapore→Sydney, 2 stops)
  ('LHR','SYD','economy',         680,120, 0.4, 'Emirates', 'PT24H30M'),
  ('LHR','SYD','premium_economy',1150,180, 0.9, 'Emirates', 'PT24H30M'),
  ('LHR','SYD','business',       3200,420, 1.4, 'Emirates', 'PT24H30M'),
  ('LHR','SYD','first',          6500,700, 1.9, 'Emirates', 'PT24H30M'),
  -- ✈ MAN → NRT via LHR + DXB (Manchester→London→Dubai→Tokyo, 2 stops)
  ('MAN','NRT','economy',         620,115, 0.6, 'Emirates', 'PT20H30M'),
  ('MAN','NRT','premium_economy',1050,170, 1.1, 'Emirates', 'PT20H30M'),
  ('MAN','NRT','business',       2800,380, 1.6, 'Emirates', 'PT20H30M'),
  ('MAN','NRT','first',          5800,650, 2.1, 'Emirates', 'PT20H30M')
) AS f(origin, destination, cabin_class, base_price, variation, phase, airline, duration);

-- ============================================
-- STEP 6: flight_details — legs for 1-STOP flights
-- Each connecting flight_prices row gets 2 leg rows
-- We insert for all 4 cabin classes of each route
-- ============================================

-- ✈ LHR → BKK via DXB (1 stop): LHR→DXB then DXB→BKK
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Emirates',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + INTERVAL '30 days' + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=1 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=1 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=1 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=1 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'EK007', 'LHR', 'DXB', INTERVAL '9 hours',  30, INTERVAL '19 hours 15 minutes'),
  (2, 'EK374', 'DXB', 'BKK', INTERVAL '22 hours', 31, INTERVAL '8 hours 30 minutes')
) AS legs(seg, fnum, orig, dest, dep, arr_offset, arr);

-- ✈ MAN → SIN via DXB (1 stop): MAN→DXB then DXB→SIN
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Emirates',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + INTERVAL '30 days' + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='SIN' AND stops=1 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='SIN' AND stops=1 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='SIN' AND stops=1 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='SIN' AND stops=1 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'EK019', 'MAN', 'DXB', INTERVAL '6 hours',  30, INTERVAL '17 hours 30 minutes'),
  (2, 'EK352', 'DXB', 'SIN', INTERVAL '21 hours', 31, INTERVAL '9 hours')
) AS legs(seg, fnum, orig, dest, dep, arr_offset, arr);

-- ✈ EDI → JFK via LHR (1 stop): EDI→LHR then LHR→JFK
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'British Airways',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + INTERVAL '30 days' + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='EDI' AND destination='JFK' AND stops=1 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='EDI' AND destination='JFK' AND stops=1 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='EDI' AND destination='JFK' AND stops=1 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='EDI' AND destination='JFK' AND stops=1 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'BA1472', 'EDI', 'LHR', INTERVAL '7 hours',  30, INTERVAL '8 hours 30 minutes'),
  (2, 'BA117',  'LHR', 'JFK', INTERVAL '11 hours', 30, INTERVAL '19 hours 30 minutes')
) AS legs(seg, fnum, orig, dest, dep, arr_offset, arr);

-- ============================================
-- STEP 7: flight_details — legs for 2-STOP flights
-- Each connecting flight_prices row gets 3 leg rows
-- ============================================

-- ✈ LHR → BKK via DXB + PVG (2 stops): LHR→DXB → DXB→PVG → PVG→BKK
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Emirates',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + legs.dep_offset + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=2 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=2 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=2 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='BKK' AND stops=2 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'EK007', 'LHR', 'DXB', 30, INTERVAL '9 hours',  30, INTERVAL '19 hours 15 minutes'),
  (2, 'EK308', 'DXB', 'PVG', 30, INTERVAL '22 hours 30 minutes', 31, INTERVAL '8 hours 30 minutes'),
  (3, 'EK306', 'PVG', 'BKK', 31, INTERVAL '12 hours', 31, INTERVAL '15 hours 30 minutes')
) AS legs(seg, fnum, orig, dest, dep_offset, dep, arr_offset, arr);

-- ✈ LHR → SYD via DXB + SIN (2 stops): LHR→DXB → DXB→SIN → SIN→SYD
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Emirates',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + legs.dep_offset + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='SYD' AND stops=2 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='SYD' AND stops=2 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='SYD' AND stops=2 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='LHR' AND destination='SYD' AND stops=2 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'EK007', 'LHR', 'DXB', 30, INTERVAL '8 hours',  30, INTERVAL '18 hours 15 minutes'),
  (2, 'EK352', 'DXB', 'SIN', 30, INTERVAL '21 hours 30 minutes', 31, INTERVAL '9 hours 30 minutes'),
  (3, 'EK404', 'SIN', 'SYD', 31, INTERVAL '14 hours', 31, INTERVAL '23 hours 30 minutes')
) AS legs(seg, fnum, orig, dest, dep_offset, dep, arr_offset, arr);

-- ✈ MAN → NRT via LHR + DXB (2 stops): MAN→LHR → LHR→DXB → DXB→NRT
INSERT INTO flight_details (flight_price_id, segment_order, flight_number, flight_date, airline, origin, destination, departing_at, arriving_at)
SELECT
  fp.id,
  legs.seg,
  legs.fnum,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'Emirates',
  legs.orig,
  legs.dest,
  (CURRENT_DATE + legs.dep_offset + legs.dep)::timestamptz,
  (CURRENT_DATE + legs.arr_offset + legs.arr)::timestamptz
FROM (
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='NRT' AND stops=2 AND cabin_class='economy'         ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='NRT' AND stops=2 AND cabin_class='premium_economy' ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='NRT' AND stops=2 AND cabin_class='business'        ORDER BY checked_at DESC LIMIT 1)
  UNION ALL
  (SELECT id FROM flight_prices WHERE origin='MAN' AND destination='NRT' AND stops=2 AND cabin_class='first'           ORDER BY checked_at DESC LIMIT 1)
) AS fp
CROSS JOIN (VALUES
  (1, 'EK319', 'MAN', 'LHR', 30, INTERVAL '7 hours',  30, INTERVAL '8 hours 20 minutes'),
  (2, 'EK007', 'LHR', 'DXB', 30, INTERVAL '10 hours 30 minutes', 30, INTERVAL '20 hours 45 minutes'),
  (3, 'EK318', 'DXB', 'NRT', 30, INTERVAL '23 hours 30 minutes', 31, INTERVAL '16 hours')
) AS legs(seg, fnum, orig, dest, dep_offset, dep, arr_offset, arr);

-- ============================================
-- STEP 8: Calculate 90-day price averages
-- ============================================
INSERT INTO price_averages (origin, destination, cabin_class, average_price, currency, calculated_at)
SELECT
  origin,
  destination,
  cabin_class,
  ROUND(AVG(price_amount)::numeric, 2),
  price_currency,
  NOW()
FROM flight_prices
WHERE checked_at >= NOW() - INTERVAL '90 days'
GROUP BY origin, destination, cabin_class, price_currency
ON CONFLICT (origin, destination, cabin_class)
DO UPDATE SET
  average_price = EXCLUDED.average_price,
  calculated_at = EXCLUDED.calculated_at;
