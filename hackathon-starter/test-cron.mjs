import { Duffel } from '@duffel/api'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

const duffel = new Duffel({ token: DUFFEL_TOKEN })
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ORIGINS = ['EDI', 'LHR', 'MAN']
const DESTINATIONS = ['AMS', 'ATH', 'BCN', 'BKK', 'CDG', 'DXB', 'FCO', 'JFK', 'LIS', 'MAD', 'NRT', 'PVG', 'SIN', 'SYD']
const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first']
const DEAL_THRESHOLD = 0.1

const departureDate = new Date()
departureDate.setDate(departureDate.getDate() + 30)
const date = departureDate.toISOString().split('T')[0]

console.log(`\nStarting cron test for departure date: ${date}`)
console.log(`Origins: ${ORIGINS.join(', ')}`)
console.log(`Destinations: ${DESTINATIONS.join(', ')}`)
console.log(`Cabin classes: ${CABIN_CLASSES.join(', ')}\n`)

let pricesSaved = 0
let dealsSaved = 0
const errors = []

for (const origin of ORIGINS) {
  for (const dest of DESTINATIONS) {
    for (const cabinClass of CABIN_CLASSES) {
      try {
        process.stdout.write(`Fetching ${origin} → ${dest} [${cabinClass}]... `)

        const offerRequest = await duffel.offerRequests.create({
          slices: [{ origin, destination: dest, departure_date: date }],
          passengers: [{ type: 'adult' }],
          cabin_class: cabinClass,
        })

        const offers = await duffel.offers.list({
          offer_request_id: offerRequest.data.id,
          sort: 'total_amount',
          limit: 5,
        })

        console.log(`${offers.data.length} offers found`)

        for (const offer of offers.data) {
          const slice = offer.slices[0]

          const { data: flightPrice, error: priceError } = await supabase
            .from('flight_prices')
            .insert({
              origin,
              destination: dest,
              departure_date: date,
              cabin_class: cabinClass,
              price_amount: parseFloat(offer.total_amount),
              price_currency: offer.total_currency,
              airline: offer.owner.name,
              stops: slice.segments.length - 1,
              duration: slice.duration,
              checked: false,
            })
            .select('id')
            .single()

          if (priceError || !flightPrice) {
            console.error(`  ✗ flight_prices insert error:`, priceError?.message)
            continue
          }

          pricesSaved++

          const segments = slice.segments.map((seg, index) => ({
            flight_price_id: flightPrice.id,
            segment_order: index + 1,
            flight_number: seg.marketing_carrier.iata_code + seg.marketing_carrier_flight_number,
            flight_date: seg.departing_at.split('T')[0],
            airline: seg.marketing_carrier.name,
            origin: seg.origin.iata_code,
            destination: seg.destination.iata_code,
            departing_at: seg.departing_at,
            arriving_at: seg.arriving_at,
          }))

          const { error: segError } = await supabase.from('flight_details').insert(segments)
          if (segError) console.error(`  ✗ flight_details insert error:`, segError.message)
        }

        const since = new Date()
        since.setDate(since.getDate() - 90)

        const { data: prices } = await supabase
          .from('flight_prices')
          .select('price_amount, price_currency')
          .eq('origin', origin)
          .eq('destination', dest)
          .eq('cabin_class', cabinClass)
          .gte('checked_at', since.toISOString())

        if (prices && prices.length > 0) {
          const avg = prices.reduce((sum, p) => sum + Number(p.price_amount), 0) / prices.length
          const { error: avgError } = await supabase.from('price_averages').upsert(
            {
              origin,
              destination: dest,
              cabin_class: cabinClass,
              average_price: Math.round(avg * 100) / 100,
              currency: prices[0].price_currency,
              calculated_at: new Date().toISOString(),
            },
            { onConflict: 'origin,destination,cabin_class' }
          )
          if (avgError) console.error(`  ✗ price_averages upsert error:`, avgError.message)
        }

        const { data: unchecked } = await supabase
          .from('flight_prices')
          .select('id, price_amount, price_currency, airline, departure_date')
          .eq('origin', origin)
          .eq('destination', dest)
          .eq('cabin_class', cabinClass)
          .eq('checked', false)

        const { data: avgRow } = await supabase
          .from('price_averages')
          .select('average_price')
          .eq('origin', origin)
          .eq('destination', dest)
          .eq('cabin_class', cabinClass)
          .single()

        if (unchecked && avgRow) {
          for (const price of unchecked) {
            const discountPct = 1 - Number(price.price_amount) / Number(avgRow.average_price)

            if (discountPct >= DEAL_THRESHOLD) {
              const { data: deal } = await supabase
                .from('deals')
                .insert({
                  origin,
                  destination: dest,
                  cabin_class: cabinClass,
                  airline: price.airline,
                  departure_date: price.departure_date,
                  new_price: price.price_amount,
                  currency: price.price_currency,
                  discount_percent: Math.round(discountPct * 100),
                })
                .select('id')
                .single()

              if (deal) {
                dealsSaved++
                console.log(`  🎯 Deal! ${origin}→${dest} [${cabinClass}] £${price.price_amount} (${Math.round(discountPct * 100)}% off)`)

                const { data: prefs } = await supabase
                  .from('user_preferences')
                  .select('subscriber_id')
                  .eq('origin', origin)
                  .eq('destination', dest)
                  .eq('cabin_class', cabinClass)

                if (prefs && prefs.length > 0) {
                  await supabase.from('notifications').insert(
                    prefs.map((p) => ({ subscriber_id: p.subscriber_id, deal_id: deal.id }))
                  )
                }
              }
            }

            await supabase.from('flight_prices').update({ checked: true }).eq('id', price.id)
          }
        }
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`)
        errors.push(`${origin}-${dest}-${cabinClass}`)
      }
    }
  }
}

console.log(`\n✓ Done`)
console.log(`  Prices saved: ${pricesSaved}`)
console.log(`  Deals found:  ${dealsSaved}`)
console.log(`  Errors:       ${errors.length > 0 ? errors.join(', ') : 'none'}`)
