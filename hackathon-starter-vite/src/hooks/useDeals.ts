import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.js";

export interface Deal {
  id: string;
  origin: string;
  destination: string;
  cabin_class: string;
  airline: string;
  departure_date: string;
  new_price: number;
  currency: string;
  discount_percent: number;
  detected_at: string;
  duration?: string;
  destinations: {
    city: string;
    country: string;
    region: string;
  };
}

export interface DealsByRegion {
  [region: string]: Deal[];
}

const cabinClassMap: Record<string, string> = {
  Economy: "economy",
  "Premium Economy": "premium_economy",
  Business: "business",
  First: "first",
};

export const useDeals = (cabinClass: string = "All") => {
  const [dealsByRegion, setDealsByRegion] = useState<DealsByRegion>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("deals")
      .select(`*, destinations(city, country, region)`)
      .order("discount_percent", { ascending: false })
      .limit(24);

    if (cabinClass !== "All" && cabinClassMap[cabinClass]) {
      query = query.eq("cabin_class", cabinClassMap[cabinClass]);
    }

    query.then(async ({ data }) => {
      if (data && data.length > 0) {
        // Fetch durations from flight_prices for matching routes
        const { data: prices } = await supabase
          .from("flight_prices")
          .select("origin, destination, cabin_class, departure_date, duration")
          .in("origin", [...new Set(data.map((d) => d.origin))])
          .in("destination", [...new Set(data.map((d) => d.destination))]);

        const durMap: Record<string, string> = {};
        prices?.forEach((p) => {
          const key = `${p.origin}-${p.destination}-${p.cabin_class}-${p.departure_date}`;
          if (p.duration) durMap[key] = p.duration;
        });

        const grouped: DealsByRegion = {};
        data.forEach((deal) => {
          const key = `${deal.origin}-${deal.destination}-${deal.cabin_class}-${deal.departure_date}`;
          deal.duration = durMap[key];
          const region = deal.destinations?.region || "Other";
          if (!grouped[region]) grouped[region] = [];
          if (grouped[region].length < 6) grouped[region].push(deal);
        });
        setDealsByRegion(grouped);
      }
      setLoading(false);
    });
  }, [cabinClass]);

  return { dealsByRegion, loading };
};
