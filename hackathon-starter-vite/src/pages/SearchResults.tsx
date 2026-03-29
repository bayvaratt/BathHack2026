import Navbar from "@/components/Navbar";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";

const durationUnits = ["days", "weeks", "months", "years"];

const SearchResults = () => {
  const [params] = useSearchParams();
  const within = params.get("within") || "0";
  const unit = params.get("unit") || "days";
  const fromParam = params.get("from") || "";
  const toParam = params.get("to") || "everywhere";
  const classParam = params.get("class") || "Economy";

  const { convert } = useCurrency();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cabinMap: Record<string, string> = {
      Economy: "economy",
      "Premium Economy": "premium_economy",
      Business: "business",
      First: "first",
    };

    let query = supabase
      .from("flight_prices")
      .select("*, destinations(city, country, region)")
      .eq("cabin_class", cabinMap[classParam] ?? "economy")
      .order("price_amount", { ascending: true })
      .limit(50);

    if (fromParam && fromParam !== "anywhere") {
      query = query.eq("origin", fromParam.toUpperCase());
    }
    if (toParam !== "everywhere") {
      query = query.eq("destinations.region", toParam);
    }

    query.then(({ data }) => {
      setFlights(data ?? []);
      setLoading(false);
    });
  }, [fromParam, toParam, classParam]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10" placeholder="Search destinations..." readOnly value={toParam} />
          </div>
          <Input className="h-10 w-20" value={within} readOnly />
          <Select defaultValue={unit}>
            <SelectTrigger className="h-10 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="font-body text-sm mb-6">
          within <span className="text-primary font-bold">{within}</span> {unit}, there are{" "}
          <span className="text-primary font-bold">{loading ? "..." : flights.length}</span> available options
        </p>

        {loading ? (
          <p className="font-body text-muted-foreground">Loading flights...</p>
        ) : flights.length === 0 ? (
          <p className="font-body text-muted-foreground">No flights found for this search.</p>
        ) : (
          <div className="space-y-3">
            {flights.map((f) => (
              <div key={f.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-body font-bold text-foreground">{f.origin} → {f.destination}</p>
                  <p className="font-body text-sm text-muted-foreground">{f.airline} · {f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`} · {f.cabin_class}</p>
                  <p className="font-body text-xs text-muted-foreground">{f.destinations?.city}, {f.destinations?.country}</p>
                </div>
                <p className="font-body font-bold text-primary text-xl">{convert(f.price_amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
