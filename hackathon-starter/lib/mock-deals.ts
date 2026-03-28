export type Deal = {
  destination_city: string;
  destination_country: string;
  destination_iata: string;
  origin_iata: string;
  current_price: number;
  departure_date: string;
  discountPercent: number;
  historicalAverage: number;
  badge: string;
};

export const MOCK_DEAL: Deal = {
  destination_city: "Madrid",
  destination_country: "Spain",
  destination_iata: "MAD",
  origin_iata: "BRS",
  current_price: 38,
  departure_date: "2026-04-01",
  discountPercent: 46,
  historicalAverage: 71,
  badge: "Massively Discounted",
};

export const MOCK_DEALS: Deal[] = [MOCK_DEAL];
