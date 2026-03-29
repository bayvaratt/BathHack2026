# WanderDrop

A flight deal monitoring system that tracks prices across 3 UK airports and 14 global destinations, detects discounts, and notifies subscribers by email and WhatsApp.

---

## What it does

- **Polls the Duffel API** every day across 3 origins × 14 destinations × 4 cabin classes (168 routes)
- **Detects deals** when a price is 5%+ below the 90-day average for that route
- **Notifies subscribers** by email (Resend) and WhatsApp (Twilio) the moment a deal is found
- **Frontend** lets users browse live deals, search by origin/destination/class/date window, and sign up for alerts

---

## Architecture

```
hackathon-starter/        ← Next.js backend (deployed to Vercel)
  app/api/cron/route.ts   ← Daily cron: polls Duffel, stores prices, detects deals, sends notifications
  lib/
    destinations.ts       ← Origins (EDI, LHR, MAN) and 14 destination airports
    notifications.ts      ← Email (Resend) + WhatsApp (Twilio) sending logic
    duffel.ts             ← Duffel API client
    supabase.ts           ← Supabase client

hackathon-starter-vite/   ← React + Vite frontend (deployed to Vercel)
  src/pages/
    Index.tsx             ← Main deals page with flight class filter
    SearchResults.tsx     ← Filtered search results
    Notify.tsx            ← Subscribe to deal alerts
  src/components/
    DealCard.tsx          ← Deal card with click-to-modal
    DealModal.tsx         ← Price comparison chart + flight details popup
    SearchForm.tsx        ← Search bar (origin, destination, class, date window)
```

---

## Database (Supabase)

| Table | Purpose |
|---|---|
| `flight_prices` | Raw prices fetched from Duffel each run |
| `price_averages` | Rolling 90-day average per route + cabin class |
| `deals` | Prices detected as significantly below average |
| `flight_details` | Per-segment flight data (times, flight numbers) |
| `origins` | Departure airports |
| `destinations` | Destination airports with city, country, region |
| `subscribers` | Email and/or WhatsApp number |
| `user_preferences` | Subscriber alert preferences (origin, region, cabin class, depart window) |
| `notifications` | Log of sent notifications |

---

## Covered routes

**Origins:** Edinburgh (EDI), London Heathrow (LHR), Manchester (MAN)

**Destinations:**
- Europe: Amsterdam, Athens, Barcelona, Paris, Rome, Lisbon, Madrid
- Asia: Bangkok, Dubai, Tokyo, Shanghai, Singapore, Sydney
- Americas: New York

**Cabin classes:** Economy, Premium Economy, Business, First

---

## Environment variables

### Backend (`hackathon-starter`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DUFFEL_ACCESS_TOKEN` | Duffel API token |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `RESEND_FROM_EMAIL` | Sender email address |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for WhatsApp |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number (e.g. `+14155238886`) |
| `CRON_SECRET` | Optional secret to protect the cron endpoint |

### Frontend (`hackathon-starter-vite`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

---

## Cron schedule

Runs daily at midnight UTC (`0 0 * * *`). Each run:
1. Removes deals with past departure dates
2. Fetches prices for 4 departure date windows (1, 2, 3, 4 weeks ahead) spread across all 168 routes
3. Recalculates rolling averages
4. Identifies deals and notifies matching subscribers
