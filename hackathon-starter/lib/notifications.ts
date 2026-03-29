import { supabase } from '@/lib/supabase'

type DealRecord = {
  id: string
  origin: string
  destination: string
  cabin_class: string
  airline: string
  departure_date: string
  new_price: number | string
  currency: string
  discount_percent: number | string
}

type EnrichedDeal = DealRecord & {
  origin_city: string
  destination_city: string
  destination_country: string
  average_price: number | string | null
  currency_symbol: string
  badge: string
}

type SubscriberRecord = {
  id: string
  email: string | null
  phone_number: string | null
}

function formatDepartureDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getCurrencySymbol(currency: string) {
  if (currency === 'GBP') {
    return 'GBP '
  }

  return `${currency} `
}

function getBadge(discountPercent: number) {
  if (discountPercent >= 40) {
    return 'Massively Discounted'
  }

  if (discountPercent >= 30) {
    return 'Strong Deal'
  }

  return 'Below Average'
}

function getDealSummary(deal: EnrichedDeal) {
  return `${deal.destination_city} is currently ${deal.discount_percent}% below its usual fare from ${deal.origin}.`
}

function buildEmailHTML(deals: EnrichedDeal[]) {
  const dealBlocks = deals
    .map(
      (deal) => `
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin-bottom:16px;">
          <div style="font-size:13px; font-weight:600; color:#ef4444; margin-bottom:4px;">
            ${deal.badge}
          </div>
          <div style="font-size:22px; font-weight:700; color:#111827;">
            ${deal.destination_city}, ${deal.destination_country}
          </div>
          <div style="font-size:15px; color:#6b7280; margin:4px 0;">
            From ${deal.origin} | ${deal.currency_symbol}${deal.new_price} one way | Flies ${formatDepartureDate(deal.departure_date)}
          </div>
          <div style="font-size:14px; color:#059669; margin-bottom:12px;">
            ${deal.discount_percent}% below average | Usually ${deal.currency_symbol}${deal.average_price ?? deal.new_price}
          </div>
          <div style="font-size:14px; color:#374151; margin-bottom:16px;">
            ${getDealSummary(deal)}
          </div>
          <a href="https://www.google.com/flights"
             style="background:#1d4ed8; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-size:14px; display:inline-block;">
            Search this flight
          </a>
        </div>
      `,
    )
    .join('')

  return `
    <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto; padding:24px;">
      <h1 style="font-size:24px; color:#111827;">WanderDrop</h1>
      <p style="color:#6b7280;">
        Matching deals from your saved flight alerts
      </p>
      ${dealBlocks}
      <div style="margin-top:24px; padding-top:20px; border-top:1px solid #e5e7eb;">
        <div style="margin-bottom:12px; font-size:13px; color:#6b7280;">
          Manage your email preferences
        </div>
        <a href="https://example.com/preferences"
           style="display:inline-block; margin-right:10px; margin-bottom:10px; background:#f3f4f6; color:#111827; padding:10px 16px; border-radius:999px; text-decoration:none; font-size:14px; border:1px solid #d1d5db;">
          Change preferences
        </a>
        <a href="https://example.com/unsubscribe"
           style="display:inline-block; margin-bottom:10px; background:#fff1f2; color:#be123c; padding:10px 16px; border-radius:999px; text-decoration:none; font-size:14px; border:1px solid #fecdd3;">
          Cancel subscription
        </a>
      </div>
      <p style="font-size:12px; color:#9ca3af; margin-top:24px;">
        Prices change fast. Check before you book. Averages are based on recent route pricing data.
      </p>
    </div>
  `
}

function buildWhatsAppMessage(deals: EnrichedDeal[]) {
  const lines = ['WanderDrop deals', '']

  for (const deal of deals.slice(0, 3)) {
    lines.push(`${deal.destination_city}, ${deal.destination_country}`)
    lines.push(
      `From ${deal.origin} | ${deal.currency} ${deal.new_price} | ${deal.discount_percent}% below average`,
    )
    lines.push(`Flies ${formatDepartureDate(deal.departure_date)}`)
    lines.push('')
  }

  lines.push('Manage preferences: https://example.com/preferences')
  lines.push('Cancel subscription: https://example.com/unsubscribe')

  return lines.join('\n')
}

async function sendRecommendationEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Failed to send email with Resend')
  }
}

function normalizeWhatsAppNumber(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    throw new Error('Phone number is required.')
  }

  if (trimmedValue.startsWith('whatsapp:')) {
    return trimmedValue
  }

  const normalizedNumber = trimmedValue.replace(/[\s()-]/g, '')

  if (!normalizedNumber.startsWith('+')) {
    throw new Error(
      'Phone number must be in international format, for example +447700900123.',
    )
  }

  return `whatsapp:${normalizedNumber}`
}

async function sendWhatsAppMessage({
  to,
  body,
}: {
  to: string
  body: string
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    throw new Error(
      'Missing Twilio config. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.',
    )
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: normalizeWhatsAppNumber(from),
        To: normalizeWhatsAppNumber(to),
        Body: body,
      }).toString(),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message ?? 'Failed to send WhatsApp message.')
  }
}

async function enrichDeal(deal: DealRecord): Promise<EnrichedDeal> {
  const [{ data: origin }, { data: destination }, { data: average }] =
    await Promise.all([
      supabase
        .from('origins')
        .select('city')
        .eq('iata_code', deal.origin)
        .single(),
      supabase
        .from('destinations')
        .select('city, country')
        .eq('iata_code', deal.destination)
        .single(),
      supabase
        .from('price_averages')
        .select('average_price')
        .eq('origin', deal.origin)
        .eq('destination', deal.destination)
        .eq('cabin_class', deal.cabin_class)
        .maybeSingle(),
    ])

  const discountPercent = Number(deal.discount_percent)

  return {
    ...deal,
    origin_city: origin?.city ?? deal.origin,
    destination_city: destination?.city ?? deal.destination,
    destination_country: destination?.country ?? '',
    average_price: average?.average_price ?? null,
    currency_symbol: getCurrencySymbol(deal.currency),
    badge: getBadge(discountPercent),
  }
}

export async function sendNotificationsForDeal(
  deal: DealRecord,
  subscriberIds: string[],
) {
  if (subscriberIds.length === 0) {
    return { emailsSent: 0, whatsappSent: 0 }
  }

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('id, email, phone_number')
    .in('id', subscriberIds)

  if (error) {
    throw new Error(`Failed to load subscribers: ${error.message}`)
  }

  const enrichedDeal = await enrichDeal(deal)

  let emailsSent = 0
  let whatsappSent = 0

  for (const subscriber of (subscribers ?? []) as SubscriberRecord[]) {
    if (subscriber.email) {
      await sendRecommendationEmail({
        to: subscriber.email,
        subject: `Flight deal: ${enrichedDeal.destination_city} is ${enrichedDeal.discount_percent}% cheaper than usual`,
        html: buildEmailHTML([enrichedDeal]),
      })
      emailsSent++
    }

    if (subscriber.phone_number) {
      await sendWhatsAppMessage({
        to: subscriber.phone_number,
        body: buildWhatsAppMessage([enrichedDeal]),
      })
      whatsappSent++
    }
  }

  return { emailsSent, whatsappSent }
}
