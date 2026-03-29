import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import FlightClassSelector, { type FlightClass } from "@/components/FlightClassSelector";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrigins } from "@/hooks/useOrigins";
import { supabase } from "@/lib/supabase.js";

const toOptions = [
  { value: "everywhere", label: "Everywhere" },
  { value: "Europe", label: "Europe" },
  { value: "Asia Pacific", label: "Asia Pacific" },
  { value: "Americas", label: "Americas" },
  { value: "Middle East", label: "Middle East" },
];

const durationUnits = ["days", "weeks", "months", "years"];

const cabinClassMap: Record<FlightClass, string> = {
  Economy: "economy",
  "Premium Economy": "premium_economy",
  Business: "business",
  First: "first",
};

const Notify = () => {
  const { origins } = useOrigins();
  const [showSetup, setShowSetup] = useState(false);
  const [flightClass, setFlightClass] = useState<FlightClass>("Economy");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("everywhere");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleWithinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setWithin(val);
    }
  };

  const handleSubmit = async () => {
    if (!email || !from) return;
    setSubmitting(true);

    // 1. Insert subscriber
    const { data: sub, error: subErr } = await supabase
      .from("subscribers")
      .upsert({ email }, { onConflict: "email" })
      .select("id")
      .single();

    if (subErr || !sub) { setSubmitting(false); return; }

    // 2. Get destinations based on "To" selection
    let destQuery = supabase.from("destinations").select("iata_code");
    if (to !== "everywhere") destQuery = destQuery.eq("region", to);
    const { data: destinations } = await destQuery;

    // 3. Insert one user_preference per destination
    if (destinations && destinations.length > 0) {
      const prefs = destinations.map((d) => ({
        subscriber_id: sub.id,
        origin: from.toUpperCase(),
        destination: d.iata_code,
        cabin_class: cabinClassMap[flightClass],
      }));
      await supabase.from("user_preferences").upsert(prefs, {
        onConflict: "subscriber_id,origin,destination,cabin_class",
      });
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const introClass = `absolute inset-x-0 flex justify-center transition-all duration-500 ease-in-out ${
    showSetup ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
  }`;
  const setupClass = `w-full max-w-2xl transition-all duration-500 ease-in-out ${
    showSetup ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
  }`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar hideCurrency />

      <div className="flex-1 relative flex flex-col items-center px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-t from-[hsl(var(--header-gradient-from)/0.15)] to-transparent" />

        {/* Shared transition container */}
        <div className="relative z-10 w-full flex justify-center mt-24">
          {/* Intro view */}
          <div className={introClass}>
            <div className="text-center max-w-md">
              <h1 className="font-body text-3xl font-normal text-foreground leading-tight mb-2">
                Track prices. Catch deals. Get notified.
              </h1>
              <p className="font-body text-xl text-foreground mb-8">
                Our agent <em className="text-primary font-bold">works</em> 24/7
              </p>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading tracking-wider text-sm px-10 py-5 rounded-full"
                onClick={() => setShowSetup(true)}
              >
                NOTIFY ME
              </Button>
            </div>
          </div>

          {/* Setup form */}
          <div className={setupClass}>
            <button
              onClick={() => setShowSetup(false)}
              className="mb-4 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="bg-popover rounded-lg p-6 shadow-sm border border-border">
              <FlightClassSelector selected={flightClass} onChange={setFlightClass} />

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-body text-muted-foreground">
                    From<span className="text-accent">*</span>
                  </label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Enter location" />
                    </SelectTrigger>
                    <SelectContent>
                      {origins.map((o) => (
                        <SelectItem key={o.iata_code} value={o.iata_code}>
                          {o.city} ({o.iata_code})
                        </SelectItem>
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
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
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
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
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

                {submitted ? (
                  <p className="text-center text-primary font-body font-bold py-2">
                    ✅ You're all set! We'll notify you when deals drop.
                  </p>
                ) : (
                  <Button
                    disabled={!consent || !email || !from || submitting}
                    onClick={handleSubmit}
                    className="w-full bg-primary/20 text-primary hover:bg-primary/30 font-body border border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Saving..." : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notify;
