import Navbar from "@/components/Navbar";
import DealCard from "@/components/DealCard";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.js";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getDestinationImage } from "@/lib/destinationImages";

const cabinMap: Record<string, string> = {
  Economy: "economy",
  "Premium Economy": "premium_economy",
  Business: "business",
  First: "first",
};

const unitToDays: Record<string, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

const SearchResults = () => {
  const [params] = useSearchParams();
  const withinParam = params.get("within") || "";
  const unit = params.get("unit") || "days";
  const fromParam = params.get("from") || "";
  const toParam = params.get("to") || "everywhere";
  const classParam = params.get("class") || "All";

  const { convert } = useCurrency();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from("deals")
      .select("*, destinations(city, country, region)")
      .order("discount_percent", { ascending: false })
      .limit(48);

    if (fromParam && fromParam !== "anywhere") {
      query = query.eq("origin", fromParam.toUpperCase());
    }

    if (classParam !== "All" && cabinMap[classParam]) {
      query = query.eq("cabin_class", cabinMap[classParam]);
    }

    if (withinParam && parseInt(withinParam) > 0) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + parseInt(withinParam) * (unitToDays[unit] ?? 1));
      query = query.lte("departure_date", maxDate.toISOString().split("T")[0]);
    }

    query.then(async ({ data }) => {
      if (!data || data.length === 0) {
        setDeals([]);
        setLoading(false);
        return;
      }

      // Filter by region client-side (Supabase foreign table filters aren't always reliable)
      const filtered = toParam === "everywhere"
        ? data
        : data.filter((d) => d.destinations?.region === toParam);

      // Fetch durations
      const { data: prices } = await supabase
        .from("flight_prices")
        .select("origin, destination, cabin_class, departure_date, duration")
        .in("origin", [...new Set(filtered.map((d) => d.origin))])
        .in("destination", [...new Set(filtered.map((d) => d.destination))]);

      const durMap: Record<string, string> = {};
      prices?.forEach((p) => {
        const key = `${p.origin}-${p.destination}-${p.cabin_class}-${p.departure_date}`;
        if (p.duration) durMap[key] = p.duration;
      });

      filtered.forEach((d) => {
        const key = `${d.origin}-${d.destination}-${d.cabin_class}-${d.departure_date}`;
        d.duration = durMap[key];
      });

      setDeals(filtered);
      setLoading(false);
    });
  }, [fromParam, toParam, classParam, withinParam, unit]);

  const mapped = deals.map((d) => {
    const rawAvgPrice = Math.round(d.new_price / (1 - d.discount_percent / 100));
    return {
      name: d.destinations?.city ?? d.destination,
      country: d.destinations?.country ?? "",
      price: convert(d.new_price),
      originalPrice: convert(rawAvgPrice),
      discount: `${Math.round(d.discount_percent)}% off!`,
      image: getDestinationImage(d.destination),
      cabinClass: d.cabin_class,
      origin: d.origin,
      airline: d.airline,
      departureDate: d.departure_date,
      originCode: d.origin,
      destinationCode: d.destination,
      duration: d.duration,
      rawPrice: d.new_price,
      rawAvgPrice,
      discountPct: Math.round(d.discount_percent),
    };
  });

  const fromLabel = fromParam && fromParam !== "anywhere" ? fromParam.toUpperCase() : "Any airport";
  const toLabel = toParam === "everywhere" ? "Everywhere" : toParam;
  const withinLabel = withinParam ? `within ${withinParam} ${unit}` : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="w-[95%] max-w-[1500px] mx-auto py-[2vw]">
        <div className="mb-6">
          <h1 className="font-poppins font-bold text-2xl text-foreground">
            {fromLabel} → {toLabel}
            {withinLabel && <span className="text-muted-foreground font-normal text-lg ml-2">{withinLabel}</span>}
          </h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {mapped.length} deal{mapped.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {loading ? (
          <p className="font-body text-muted-foreground">Loading deals...</p>
        ) : mapped.length === 0 ? (
          <p className="font-body text-muted-foreground">No deals found for this search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[clamp(0.8rem,1.5vw,1.5rem)]">
            {mapped.map((deal, i) => (
              <DealCard key={i} {...deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
