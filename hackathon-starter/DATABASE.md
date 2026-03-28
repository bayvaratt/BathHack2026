# BathHack2026 — Database Guide

## Supabase Connection
```
URL:      https://ctklqcaajphsxmvwxdeg.supabase.co
ANON KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0a2xxY2FhanBoc3htdnd4ZGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODkxOTYsImV4cCI6MjA5MDI2NTE5Nn0.hI5ZhvM9r-08uERqFvPV-z1nuYFgJZXP9Oa4gpfDzUY
```

Install the Supabase client:
```bash
npm install @supabase/supabase-js
```

Initialize:
```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ctklqcaajphsxmvwxdeg.supabase.co',
  'YOUR_ANON_KEY'
)
```

---

## Table Overview

| Table | Description |
|---|---|
| `airports` | Reference — IATA airport codes |
| `airlines` | Reference — IATA airline codes |
| `flights` | One row per unique flight |
| `cabin_prices` | Economy / Business / First price per flight |
| `price_history` | Price snapshot every time Amadeus is polled |
| `profiles` | User accounts (linked to Supabase Auth) |
| `user_preferences` | Routes & cabin class each user watches |
| `deals` | Discounts detected by the AI system |
| `notifications` | Alerts sent to users |

---

## Friend 2 — Amadeus API → Database

Every time you poll Amadeus, do this in order:

### 1. Insert airport (if not exists)
```js
await supabase.from('airports').upsert({
  iata_code: 'LHR',
  name: 'Heathrow Airport',
  city: 'London',
  country: 'UK'
}, { onConflict: 'iata_code' })
```

### 2. Insert airline (if not exists)
```js
await supabase.from('airlines').upsert({
  iata_code: 'BA',
  name: 'British Airways'
}, { onConflict: 'iata_code' })
```

### 3. Insert flight (if not exists)
```js
const { data: flight } = await supabase.from('flights').upsert({
  origin: 'LHR',
  destination: 'JFK',
  departure_at: '2026-04-01T10:00:00Z',
  arrival_at: '2026-04-01T13:00:00Z',
  duration_minutes: 480,
  stops: 0,
  airline_code: 'BA',
  flight_number: 'BA117',
  fetched_at: new Date().toISOString()
}, { onConflict: 'flight_number,departure_at' }).select().single()
```

### 4. Upsert cabin prices (economy / business / first)
```js
const { data: cabinPrice } = await supabase.from('cabin_prices').upsert({
  flight_id: flight.id,
  cabin_class: 'economy', // 'economy' | 'business' | 'first'
  price: 299.99,
  currency: 'GBP',
  seats_available: 12,
}, { onConflict: 'flight_id,cabin_class' }).select().single()
```

### 5. Always insert into price_history (every poll)
```js
await supabase.from('price_history').insert({
  cabin_price_id: cabinPrice.id,
  price: 299.99,
  seats_available: 12,
  recorded_at: new Date().toISOString()
})
```

---

## Friend 3 — AI / Rule-Based System

### Read price history to detect drops
```js
const { data } = await supabase
  .from('price_history')
  .select('*, cabin_prices(*, flights(*))')
  .order('recorded_at', { ascending: false })
  .limit(1000)
```

### Insert a deal when discount detected
```js
const { data: deal } = await supabase.from('deals').insert({
  cabin_price_id: 'cabin-price-uuid-here',
  old_price: 499.99,
  new_price: 299.99,
  discount_percent: 40.0,
  detected_at: new Date().toISOString()
}).select().single()
```

### Send notification to matching users
```js
// Find users watching this route + cabin class
const { data: users } = await supabase
  .from('user_preferences')
  .select('user_id')
  .eq('origin', 'LHR')
  .eq('destination', 'JFK')
  .eq('cabin_class', 'economy')
  .eq('is_active', true)
  .lte('max_price', 299.99) // only notify if within their budget

// Insert notifications for each user
const notifications = users.map(u => ({
  user_id: u.user_id,
  deal_id: deal.id,
}))

await supabase.from('notifications').insert(notifications)
```

---

## Data Flow Summary

```
Amadeus API (Friend 2)
    ↓ inserts into
airports → airlines → flights → cabin_prices → price_history

AI System (Friend 3)
    ↓ reads price_history, detects drop
    ↓ inserts into deals
    ↓ queries user_preferences for matching users
    ↓ inserts into notifications

Frontend (Friend 1)
    ↓ reads notifications for logged-in user
    ↓ reads deals + flights for deal details
```
