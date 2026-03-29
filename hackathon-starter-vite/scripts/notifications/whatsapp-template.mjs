function formatDepartureDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function buildWhatsAppMessage(deals) {
  const lines = ["WanderDrop deals", ""];

  for (const deal of deals.slice(0, 3)) {
    lines.push(`${deal.destination_city}, ${deal.destination_country}`);
    lines.push(
      `From ${deal.origin_iata} | ${deal.currency} ${deal.new_price} | ${deal.discount_percent}% below average`,
    );
    lines.push(`Flies ${formatDepartureDate(deal.departure_date)}`);
    lines.push("");
  }

  lines.push("Manage preferences: https://example.com/preferences");
  lines.push("Cancel subscription: https://example.com/unsubscribe");

  return lines.join("\n");
}
