function formatDepartureDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getDealSummary(deal) {
  return `${deal.destination_city} is currently ${deal.discount_percent}% below its usual fare from ${deal.origin_iata}.`;
}

export function buildEmailHTML(deals) {
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
            From ${deal.origin_iata} | ${deal.currency_symbol}${deal.new_price} one way | Flies ${formatDepartureDate(deal.departure_date)}
          </div>
          <div style="font-size:14px; color:#059669; margin-bottom:12px;">
            ${deal.discount_percent}% below average | Usually ${deal.currency_symbol}${deal.average_price}
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
    .join("");

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
  `;
}
