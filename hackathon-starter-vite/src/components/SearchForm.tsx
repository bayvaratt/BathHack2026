import { useState } from "react";
import FlightClassSelector, { type FlightClass } from "./FlightClassSelector";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrigins } from "@/hooks/useOrigins";

const toOptions = [
  { value: "everywhere", label: "Everywhere" },
  { value: "Europe", label: "Europe" },
  { value: "Asia Pacific", label: "Asia Pacific" },
  { value: "Americas", label: "Americas" },
  { value: "Middle East", label: "Middle East" },
];

const durationUnits = ["days", "weeks", "months", "years"];

const fieldLabel = "text-[11px] font-semibold font-body text-muted-foreground uppercase tracking-wide mb-0.5";
const selectTriggerClass = "border-0 shadow-none h-auto p-0 text-sm font-body font-medium text-muted-foreground placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0";

const SearchForm = () => {
  const navigate = useNavigate();
  const { origins } = useOrigins();
  const [flightClass, setFlightClass] = useState<FlightClass>("Economy");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("everywhere");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");

  const handleWithinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) setWithin(val);
  };

  const handleSearch = () => {
    navigate(`/search?class=${flightClass}&from=${from}&to=${to}&within=${within}&unit=${unit}`);
  };

  return (
    <div className="w-full mx-auto">
      {/* Cabin class tabs */}
      <div className="mb-4">
        <FlightClassSelector selected={flightClass} onChange={setFlightClass} />
      </div>

      {/* Skyscanner-style unified search bar */}
      <div className="flex items-stretch bg-white rounded-2xl shadow-xl overflow-hidden border border-white/20">

        {/* FROM */}
        <div className="flex-1 px-5 py-3.5 min-w-0">
          <p className={fieldLabel}>From <span className="text-accent normal-case tracking-normal">*</span></p>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Country, city or airport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anywhere">Any Airport</SelectItem>
              {origins.map((o) => (
                <SelectItem key={o.iata_code} value={o.iata_code}>
                  {o.city} ({o.iata_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="w-px bg-border self-stretch my-3" />

        {/* TO */}
        <div className="flex-1 px-5 py-3.5 min-w-0">
          <p className={fieldLabel}>To</p>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Everywhere" />
            </SelectTrigger>
            <SelectContent>
              {toOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="w-px bg-border self-stretch my-3" />

        {/* WITHIN */}
        <div className="flex-[1.2] px-5 py-3.5 min-w-0">
          <p className={fieldLabel}>Within</p>
          <div className="flex items-center gap-2">
            <Input
              className="border-0 shadow-none p-0 h-auto text-sm font-body font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0 w-20 min-w-0"
              placeholder="e.g. 30"
              value={within}
              onChange={handleWithinChange}
              inputMode="numeric"
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className={selectTriggerClass + " w-24"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationUnits.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SEARCH BUTTON */}
        <div className="flex items-center px-3 py-3">
          <Button
            onClick={handleSearch}
            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold text-sm gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
