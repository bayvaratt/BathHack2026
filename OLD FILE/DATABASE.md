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
| `origins` | Departure airports (IATA code, city, country) |
| `destinations` | Arrival airports (IATA code, city, country, region) |
| `flight_prices` | One row per flight per poll — this IS the price history |
| `profiles` | User accounts (linked to Supabase Auth) |
| `user_preferences` | Routes & cabin class each user watches |
| `deals` | Discounts detected by the AI system |
| `notifications` | Alerts sent to users |

### Cabin classes supported:
`economy` | `premium_economy` | `business` | `first`

---

## Data Flow

```
Duffel API (Friend 2)
    ↓ every poll, insert into
origins → destinations → flight_prices

AI System (Friend 3)
    ↓ reads flight_prices, compares prices over time
    ↓ detects drop → inserts into deals
    ↓ queries user_preferences → inserts into notifications

Frontend (Friend 1)
    ↓ reads notifications + deals for logged-in user
```

---

## Friend 2 — Duffel API → Database

Every time you poll Duffel, for each offer do this in order:

### 1. Insert origin airport (if not exists)
```js
await supabase.from('origins').upsert({
  iata_code: 'LHR',
  city: 'London',
  country: 'UK'
}, { onConflict: 'iata_code' })
```

### 2. Insert destination airport (if not exists)
```js
await supabase.from('destinations').upsert({
  iata_code: 'JFK',
  city: 'New York',
  country: 'US',
  region: 'Americas'
}, { onConflict: 'iata_code' })
```

### 3. Insert flight price (ALWAYS — every poll = new row)
```js
await supabase.from('flight_prices').insert({
  origin: 'LHR',
  destination: 'JFK',
  departure_date: '2026-04-01',         // date only
  cabin_class: 'economy',               // 'economy' | 'premium_economy' | 'business' | 'first'
  price_amount: 299.99,
  price_currency: 'GBP',
  airline: 'British Airways',           // plain text from Duffel offer.owner.name
  stops: 0,
  duration: 'PT8H30M',                  // ISO 8601 from Duffel segment.duration
  checked_at: new Date().toISOString()
})
```

### Duffel field mapping:
| Duffel field | Our column |
|---|---|
| `slices[0].origin.iata_code` | `origin` |
| `slices[0].destination.iata_code` | `destination` |
| `slices[0].segments[0].departing_at` (date part) | `departure_date` |
| `slices[0].segments[0].passengers[0].cabin_class` | `cabin_class` |
| `total_amount` | `price_amount` |
| `total_currency` | `price_currency` |
| `owner.name` | `airline` |
| `slices[0].segments[0].stops.length` | `stops` |
| `slices[0].duration` | `duration` |

---

## Friend 3 — AI / Rule-Based System

### Read latest prices and detect drops
```js
// Get last 2 price snapshots for each route+cabin combo
const { data } = await supabase
  .from('flight_prices')
  .select('*')
  .eq('origin', 'LHR')
  .eq('destination', 'JFK')
  .eq('cabin_class', 'economy')
  .order('checked_at', { ascending: false })
  .limit(100)

// Compare consecutive rows to find price drops
// If (previous_price - current_price) / previous_price > threshold → it's a deal
```

### Insert a deal when discount detected
```js
const { data: deal } = await supabase.from('deals').insert({
  origin: 'LHR',
  destination: 'JFK',
  cabin_class: 'economy',
  airline: 'British Airways',
  departure_date: '2026-04-01',
  old_price: 499.99,
  new_price: 299.99,
  currency: 'GBP',
  discount_percent: 40.0
}).select().single()
```

### Notify matching users
```js
// Find users watching this route + cabin class within their budget
const { data: users } = await supabase
  .from('user_preferences')
  .select('user_id')
  .eq('origin', 'LHR')
  .eq('destination', 'JFK')
  .eq('cabin_class', 'economy')
  .eq('is_active', true)
  .lte('max_price', 299.99)

// Insert a notification for each matching user
const notifications = users.map(u => ({
  user_id: u.user_id,
  deal_id: deal.id
}))

await supabase.from('notifications').insert(notifications)
```

---

## Friend 1 — Frontend

### Get unread notifications for logged-in user
```js
const { data } = await supabase
  .from('notifications')
  .select('*, deals(*)')
  .eq('user_id', currentUserId)
  .eq('is_read', false)
  .order('sent_at', { ascending: false })
```

### Mark notification as read
```js
await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
```
