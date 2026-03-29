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
import { useNavigate } from "react-router-dom";


const fromOptions = [
  { value: "anywhere", label: "Any Airport" },
  { value: "lhr", label: "London Heathrow (LHR)" },
  { value: "jfk", label: "New York JFK (JFK)" },
  { value: "bkk", label: "Bangkok (BKK)" },
  { value: "nrt", label: "Tokyo Narita (NRT)" },
];

const toOptions = [
  { value: "everywhere", label: "Everywhere" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "americas", label: "Americas" },
  { value: "africa", label: "Africa" },
  { value: "oceania", label: "Oceania" },
];

const durationUnits = ["days", "weeks", "months", "years"];

const SearchForm = () => {
  const navigate = useNavigate();
  const [flightClass, setFlightClass] = useState<FlightClass>("Economy");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("everywhere");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");

  const handleWithinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setWithin(val);
    }
  };

  const handleSearch = () => {
    navigate(`/search?class=${flightClass}&from=${from}&to=${to}&within=${within}&unit=${unit}`);
  };

  return (
    <div className="bg-popover rounded-lg p-5 shadow-md max-w-3xl mx-auto">
      {/* Flight class checkboxes - compact, not full width */}
      <div className="mb-4">
        <FlightClassSelector selected={flightClass} onChange={setFlightClass} />
      </div>

      {/* Labels */}
      <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-3 mb-1">
        <span className="text-xs font-body text-muted-foreground">From<span className="text-accent">*</span></span>
        <span className="text-xs font-body text-muted-foreground">To</span>
        <span className="text-xs font-body text-muted-foreground">Within</span>
        <span className="w-[100px]" />
      </div>

      {/* Inputs row - separate boxes, only Within is connected */}
      <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-3">
        {/* From */}
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="Enter location" />
          </SelectTrigger>
          <SelectContent>
            {fromOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* To */}
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger className="h-10 text-xs">
              <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {toOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Within - connected number + unit */}
        <div className="flex h-10 rounded-md border border-input overflow-hidden">
          <Input
            className="h-full text-xs flex-1 min-w-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Enter number"
            value={within}
            onChange={handleWithinChange}
            inputMode="numeric"
          />
          <div className="w-px bg-border" />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-full text-xs w-20 border-0 rounded-none focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search button */}
        <Button
          className="h-10 bg-foreground text-background hover:bg-foreground/90 font-body text-xs px-6"
          onClick={handleSearch}
        >
          SEARCH
        </Button>
      </div>
    </div>
  );
};

export default SearchForm;
