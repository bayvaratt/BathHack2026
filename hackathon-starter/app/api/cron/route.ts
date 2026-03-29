import { ORIGINS, DESTINATIONS } from '@/lib/destinations'
import { duffel } from '@/lib/duffel'
import { sendNotificationsForDeal } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const
const DEAL_THRESHOLD = 0.05
const BATCH_SIZE = 10
// Rotate through 4 dates spread across next month — each run picks a different one
const DATE_OFFSETS = [7, 14, 21, 28]

function isWildcardRegion(region: string) {
  return region === 'all' || region === 'everywhere'
}

function getDaysUntilDeparture(departureDate: string) {
  const now = new Date()
  const departure = new Date(departureDate)
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((departure.getTime() - now.getTime()) / msPerDay)
}

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pre-compute all 4 departure dates
  const dates = DATE_OFFSETS.map((offset) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  })

  // Only remove deals with past departure dates — keep current deals until new ones replace them
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('deals').delete().lt('departure_date', today)

  const errors: string[] = []
  let pricesSaved = 0
  let dealsFound = 0
  let emailsSent = 0
  let whatsappSent = 0

  const tasks: Array<{
    origin: typeof ORIGINS[number]
    dest: typeof DESTINATIONS[number]
    cabinClass: typeof CABIN_CLASSES[number]
    date: string
  }> = []

  let taskIndex = 0
  for (const origin of ORIGINS) {
    for (const dest of DESTINATIONS) {
      for (const cabinClass of CABIN_CLASSES) {
        tasks.push({ origin, dest, cabinClass, date: dates[taskIndex % dates.length] })
        taskIndex++
      }
    }
  }

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async ({ origin, dest, cabinClass, date }) => {
        const offerRequest = await duffel.offerRequests.create({
          slices: [{
            origin: origin.code,
            destination: dest.code,
            departure_date: date,
            arrival_time: null,
            departure_time: null,
          }],
          passengers: [{ type: 'adult' }],
          cabin_class: cabinClass,
        })

        const offers = await duffel.offers.list({
          offer_request_id: offerRequest.data.id,
          sort: 'total_amount',
          limit: 5,
        })

        let saved = 0
        let deals = 0
        let batchEmailsSent = 0
        let batchWhatsappSent = 0

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

          if (priceError || !flightPrice) {
            continue
          }

          saved++

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
          const avg =
            prices.reduce((sum, price) => sum + Number(price.price_amount), 0) /
            prices.length

          await supabase.from('price_averages').upsert(
            {
              origin: origin.code,
              destination: dest.code,
              cabin_class: cabinClass,
              average_price: Math.round(avg * 100) / 100,
              currency: prices[0].price_currency,
              calculated_at: new Date().toISOString(),
            },
            { onConflict: 'origin,destination,cabin_class' },
          )
        }

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
            const discountPct =
              1 - Number(price.price_amount) / Number(avgRow.average_price)

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
                deals++

                const { data: prefs } = await supabase
                  .from('user_preferences')
                  .select('subscriber_id, region, depart_within_days')
                  .eq('origin', origin.code)
                  .eq('cabin_class', cabinClass)

                const daysUntilDeparture = getDaysUntilDeparture(
                  price.departure_date,
                )
                const matchingPrefs = (prefs ?? []).filter((pref) =>
                  (pref.depart_within_days == null ||
                    daysUntilDeparture <= pref.depart_within_days) &&
                  (isWildcardRegion(pref.region) ||
                    pref.region === dest.code ||
                    pref.region === dest.region),
                )

                if (matchingPrefs.length > 0) {
                  await supabase.from('notifications').insert(
                    matchingPrefs.map((pref) => ({
                      subscriber_id: pref.subscriber_id,
                      deal_id: deal.id,
                    })),
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
                    matchingPrefs.map((pref) => pref.subscriber_id),
                  )

                  batchEmailsSent += sendResult.emailsSent
                  batchWhatsappSent += sendResult.whatsappSent
                }
              }
            }

            await supabase
              .from('flight_prices')
              .update({ checked: true })
              .eq('id', price.id)
          }
        }

        return {
          saved,
          deals,
          emailsSent: batchEmailsSent,
          whatsappSent: batchWhatsappSent,
        }
      }),
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]

      if (result.status === 'fulfilled') {
        pricesSaved += result.value.saved
        dealsFound += result.value.deals
        emailsSent += result.value.emailsSent
        whatsappSent += result.value.whatsappSent
      } else {
        const { origin, dest, cabinClass } = batch[j]
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
        errors.push(`${origin.code}-${dest.code}-${cabinClass}: ${reason}`)
      }
    }
  }

  return Response.json({
    dates,
    checked_at: new Date().toISOString(),
    prices_saved: pricesSaved,
    deals_found: dealsFound,
    emails_sent: emailsSent,
    whatsapp_sent: whatsappSent,
    errors,
  })
}
