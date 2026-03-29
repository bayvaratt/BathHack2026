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
  destinations: {
    city: string;
    country: string;
    region: string;
  };
}

export interface DealsByRegion {
  [region: string]: Deal[];
}

export const useDeals = () => {
  const [dealsByRegion, setDealsByRegion] = useState<DealsByRegion>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("deals")
      .select(`*, destinations(city, country, region)`)
      .order("discount_percent", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (data) {
          const grouped: DealsByRegion = {};
          data.forEach((deal) => {
            const region = deal.destinations?.region || "Other";
            if (!grouped[region]) grouped[region] = [];
            if (grouped[region].length < 6) grouped[region].push(deal);
          });
          setDealsByRegion(grouped);
        }
        setLoading(false);
      });
  }, []);

  return { dealsByRegion, loading };
};
