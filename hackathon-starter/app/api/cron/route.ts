import { duffel } from '@/lib/duffel'
import { supabase } from '@/lib/supabase'
import { ORIGINS, DESTINATIONS } from '@/lib/destinations'
import { sendNotificationsForDeal } from '@/lib/notifications'

const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const
const DEAL_THRESHOLD = 0.3
const DAYS_AHEAD = 30

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const departureDate = new Date()
  departureDate.setDate(departureDate.getDate() + DAYS_AHEAD)
  const date = departureDate.toISOString().split('T')[0]

  // Clear all previous deals at the start of each run
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const errors: string[] = []
  let pricesSaved = 0
  let dealsFound = 0
  let emailsSent = 0
  let whatsappSent = 0

  for (const origin of ORIGINS) {
    for (const dest of DESTINATIONS) {
      for (const cabinClass of CABIN_CLASSES) {
        try {
          await new Promise(r => setTimeout(r, 100))
          const offerRequest = await duffel.offerRequests.create({
            slices: [{ origin: origin.code, destination: dest.code, departure_date: date, arrival_time: null, departure_time: null }],
            passengers: [{ type: 'adult' }],
            cabin_class: cabinClass,
          })

          const offers = await duffel.offers.list({
            offer_request_id: offerRequest.data.id,
            sort: 'total_amount',
            limit: 5,
          })

          for (const offer of offers.data) {
            const slice = offer.slices[0]

            const { data: flightPrice, error: priceError } = await supabase
              .from('flight_prices')
              .insert({
                origin: origin.code,
                destination: dest.code,
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

            if (priceError || !flightPrice) continue

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

            await supabase.from('flight_details').insert(segments)
          }

          // Recalculate 90-day average
          const since = new Date()
          since.setDate(since.getDate() - 90)

          const { data: prices } = await supabase
            .from('flight_prices')
            .select('price_amount, price_currency')
            .eq('origin', origin.code)
            .eq('destination', dest.code)
            .eq('cabin_class', cabinClass)
            .gte('checked_at', since.toISOString())

          if (prices && prices.length > 0) {
            const avg = prices.reduce((sum, p) => sum + Number(p.price_amount), 0) / prices.length
            await supabase.from('price_averages').upsert(
              {
                origin: origin.code,
                destination: dest.code,
                cabin_class: cabinClass,
                average_price: Math.round(avg * 100) / 100,
                currency: prices[0].price_currency,
                calculated_at: new Date().toISOString(),
              },
              { onConflict: 'origin,destination,cabin_class' }
            )
          }

          // Check unchecked prices for deals
          const { data: unchecked } = await supabase
            .from('flight_prices')
            .select('id, price_amount, price_currency, airline, departure_date, cabin_class')
            .eq('origin', origin.code)
            .eq('destination', dest.code)
            .eq('cabin_class', cabinClass)
            .eq('checked', false)

          const { data: avgRow } = await supabase
            .from('price_averages')
            .select('average_price')
            .eq('origin', origin.code)
            .eq('destination', dest.code)
            .eq('cabin_class', cabinClass)
            .single()

          if (unchecked && avgRow) {
            for (const price of unchecked) {
              const discountPct = 1 - Number(price.price_amount) / Number(avgRow.average_price)

              if (discountPct >= DEAL_THRESHOLD) {
                const { data: deal } = await supabase
                  .from('deals')
                  .insert({
                    origin: origin.code,
                    destination: dest.code,
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
                  dealsFound++
                  const { data: prefs } = await supabase
                    .from('user_preferences')
                    .select('subscriber_id')
                    .eq('origin', origin.code)
                    .eq('destination', dest.code)
                    .eq('cabin_class', cabinClass)

                  if (prefs && prefs.length > 0) {
                    await supabase.from('notifications').insert(
                      prefs.map((p) => ({ subscriber_id: p.subscriber_id, deal_id: deal.id }))
                    )

                    const sendResult = await sendNotificationsForDeal(
                      {
                        id: deal.id,
                        origin: origin.code,
                        destination: dest.code,
                        cabin_class: cabinClass,
                        airline: price.airline,
                        departure_date: price.departure_date,
                        new_price: price.price_amount,
                        currency: price.price_currency,
                        discount_percent: Math.round(discountPct * 100),
                      },
                      prefs.map((p) => p.subscriber_id),
                    )

                    emailsSent += sendResult.emailsSent
                    whatsappSent += sendResult.whatsappSent
                  }
                }
              }

              await supabase.from('flight_prices').update({ checked: true }).eq('id', price.id)
            }
          }
        } catch {
          errors.push(`${origin.code}-${dest.code}-${cabinClass}`)
        }
      }
    }
  }

  return Response.json({
    date,
    checked_at: new Date().toISOString(),
    prices_saved: pricesSaved,
    deals_found: dealsFound,
    emails_sent: emailsSent,
    whatsapp_sent: whatsappSent,
    errors,
  })
}
