import type { Deal } from "@/lib/mock-deals";

function formatDepartureDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function buildWhatsAppMessage(deal: Deal) {
  return [
    "WanderDrop deal",
    "",
    `${deal.destination_city}, ${deal.destination_country}`,
    `From ${deal.origin_iata}`,
    `GBP ${deal.current_price} one way`,
    `Flies ${formatDepartureDate(deal.departure_date)}`,
    `${deal.discountPercent}% below average`,
    "",
    `Usually around GBP ${deal.historicalAverage}.`,
    "",
    "Manage preferences: https://example.com/preferences",
    "Cancel subscription: https://example.com/unsubscribe",
  ].join("\n");
}
