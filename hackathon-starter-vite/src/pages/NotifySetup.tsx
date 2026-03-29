import Navbar from "@/components/Navbar";
import FlightClassSelector, { type FlightClass } from "@/components/FlightClassSelector";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fromOptions = [
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
];

const durationUnits = ["days", "weeks", "months", "years"];

const NotifySetup = () => {
  const navigate = useNavigate();
  const [flightClass, setFlightClass] = useState<FlightClass>("Economy");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("everywhere");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const handleWithinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setWithin(val);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

        <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate("/notify")} className="mb-4 text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="bg-popover rounded-lg p-6 shadow-sm border border-border">
          <FlightClassSelector selected={flightClass} onChange={setFlightClass} />

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body text-muted-foreground">From<span className="text-accent">*</span></label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Enter location" />
                </SelectTrigger>
                <SelectContent>
                  {fromOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-body text-muted-foreground">To</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Everywhere" />
                </SelectTrigger>
                <SelectContent>
                  {toOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-body text-muted-foreground">Within</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Enter number"
                  value={within}
                  onChange={handleWithinChange}
                  inputMode="numeric"
                  className="flex-1 placeholder:text-muted-foreground"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-32">
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
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-body text-muted-foreground">Enter Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="mt-1 placeholder:text-muted-foreground"
                placeholder="you@example.com"
              />
            </div>

            <label className="flex items-start gap-2 text-xs font-body">
              <Checkbox checked={consent} onCheckedChange={(c: boolean) => setConsent(c === true)} className="mt-0.5" />
              consent..
            </label>

            <Button
              disabled={!consent}
              className="w-full bg-primary/20 text-primary hover:bg-primary/30 font-body border border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotifySetup;
