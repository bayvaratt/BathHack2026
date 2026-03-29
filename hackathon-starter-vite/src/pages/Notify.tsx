import Navbar from "@/components/Navbar";
import FlightClassSelector, { type FlightClass } from "@/components/FlightClassSelector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveNotificationPreference } from "@/lib/notify";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AirportOption = {
  value: string;
  label: string;
};

const durationUnits = ["days", "weeks", "months"];

const destinations = [
  { label: "Amsterdam", x: 55, y: 22 },
  { label: "Paris", x: 42, y: 28 },
  { label: "Barcelona", x: 30, y: 38 },
  { label: "Rome", x: 58, y: 38 },
  { label: "Athens", x: 68, y: 44 },
  { label: "Lisbon", x: 18, y: 48 },
  { label: "Madrid", x: 24, y: 56 },
  { label: "Dubai", x: 78, y: 34 },
  { label: "Bangkok", x: 88, y: 52 },
  { label: "Singapore", x: 85, y: 68 },
  { label: "Tokyo", x: 92, y: 22 },
  { label: "Shanghai", x: 82, y: 14 },
  { label: "Sydney", x: 90, y: 80 },
  { label: "New York", x: 8, y: 32 },
];

const origin = { x: 50, y: 50 };

function arcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.3,
) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function FlightMapBackground() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          @keyframes dash {
            to { stroke-dashoffset: 0; }
          }
          .flight-path {
            fill: none;
            stroke: hsl(30 95% 55% / 0.25);
            stroke-width: 0.3;
            stroke-dasharray: 2 1;
            stroke-dashoffset: 60;
            animation: dash 4s linear infinite;
          }
          .flight-path:nth-child(2n)  { animation-duration: 5s; animation-delay: -1s; }
          .flight-path:nth-child(3n)  { animation-duration: 6s; animation-delay: -2s; }
          .flight-path:nth-child(4n)  { animation-duration: 4.5s; animation-delay: -0.5s; }
          .flight-path:nth-child(5n)  { animation-duration: 7s; animation-delay: -3s; }
        `}</style>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="hsl(30 95% 55%)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(30 95% 55%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100" height="100" fill="url(#bgGrad)" />

      {destinations.map((destination, index) => (
        <path
          key={destination.label}
          className="flight-path"
          d={arcPath(
            origin.x,
            origin.y,
            destination.x,
            destination.y,
            index % 2 === 0 ? 0.25 : -0.25,
          )}
        />
      ))}

      {destinations.map((destination) => (
        <g key={destination.label}>
          <circle
            cx={destination.x}
            cy={destination.y}
            r="0.6"
            fill="hsl(30 95% 55% / 0.5)"
          />
          <text
            x={destination.x + 1}
            y={destination.y + 0.5}
            fontSize="2.2"
            fill="hsl(30 95% 55% / 0.55)"
            fontFamily="sans-serif"
          >
            {destination.label}
          </text>
        </g>
      ))}

      <circle cx={origin.x} cy={origin.y} r="1.2" fill="hsl(30 95% 55% / 0.8)" />
      <circle
        cx={origin.x}
        cy={origin.y}
        r="2.5"
        fill="none"
        stroke="hsl(30 95% 55% / 0.3)"
        strokeWidth="0.4"
      />
      <text
        x={origin.x + 1.5}
        y={origin.y - 1.5}
        fontSize="2.4"
        fill="hsl(30 95% 55% / 0.8)"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        UK
      </text>
    </svg>
  );
}

const Notify = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [flightClass, setFlightClass] = useState<FlightClass>("Economy");
  const [originOptions, setOriginOptions] = useState<AirportOption[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<AirportOption[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAirportOptions() {
      const [{ data: origins, error: originsError }, { data: destinations, error: destinationsError }] =
        await Promise.all([
          supabase.from("origins").select("iata_code, city"),
          supabase.from("destinations").select("iata_code, city"),
        ]);

      if (originsError || destinationsError) {
        toast.error("Unable to load route options from Supabase.");
        return;
      }

      setOriginOptions(
        (origins ?? []).map((airport) => ({
          value: airport.iata_code,
          label: `${airport.city} (${airport.iata_code})`,
        })),
      );

      setDestinationOptions(
        (destinations ?? []).map((airport) => ({
          value: airport.iata_code,
          label: `${airport.city} (${airport.iata_code})`,
        })),
      );
    }

    loadAirportOptions();
  }, []);

  const handleWithinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue === "" || /^\d+$/.test(nextValue)) {
      setWithin(nextValue);
    }
  };

  const handleNotifyClick = () => {
    setShowSetup(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSubmit = async () => {
    if (!from || !to) {
      toast.error("Please choose both an origin and destination.");
      return;
    }

    if (!email && !phoneNumber) {
      toast.error("Please enter an email or WhatsApp phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await saveNotificationPreference({
        email,
        phoneNumber,
        origin: from,
        destination: to,
        cabinClass: flightClass,
      });

      toast.success("Preference saved. Matching deals can now be sent.");
      setEmail("");
      setPhoneNumber("");
      setConsent(false);
      setWithin("");
      setUnit("days");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save preference.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar hideCurrency />

      <div
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        <FlightMapBackground />

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 50% 50%, hsl(var(--background)) 30%, transparent 80%)",
          }}
        />

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 text-center max-w-2xl px-6 py-20">
          <div className="inline-block mb-6 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-heading tracking-widest text-primary uppercase">
            Flight Deal Monitor
          </div>
          <h1 className="font-body text-6xl font-normal leading-tight text-foreground mb-4">
            Track prices.
            <br />
            Catch deals.
            <br />
            <span className="font-semibold text-primary">Get notified.</span>
          </h1>
          <p className="font-body text-lg text-muted-foreground mb-10">
            Our agent monitors 14 destinations 24/7 and alerts you the moment prices drop.
          </p>

          <Button
            className="rounded-full bg-primary px-10 py-5 text-sm font-heading tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
            onClick={handleNotifyClick}
          >
            NOTIFY ME
          </Button>
        </div>
      </div>

      <div
        ref={formRef}
        className={`w-full px-4 pb-16 transition-all duration-500 ease-in-out ${
          showSetup
            ? "pointer-events-auto max-h-[1000px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-4 overflow-hidden opacity-0"
        } flex justify-center`}
      >
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="h-10 w-px bg-gradient-to-b from-primary/40 to-transparent" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-5 text-sm font-heading tracking-widest text-muted-foreground uppercase">
              Set up your alert
            </h2>

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
                    {originOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-body text-muted-foreground">To</label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-body text-muted-foreground">Within</label>
                <div className="mt-1 flex gap-2">
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
                      {durationUnits.map((durationUnit) => (
                        <SelectItem key={durationUnit} value={durationUnit}>
                          {durationUnit}
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                  className="mt-1 placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-body text-muted-foreground">
                  WhatsApp phone number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(event.target.value)}
                  className="mt-1 placeholder:text-muted-foreground"
                  placeholder="+447700900123"
                />
              </div>

              <label className="flex items-start gap-2 text-xs font-body">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked: boolean) => setConsent(checked === true)}
                  className="mt-0.5"
                />
                I agree to receive deal notifications for this route.
              </label>

              <Button
                disabled={!consent || isSubmitting}
                onClick={handleSubmit}
                className="w-full border border-primary/30 bg-primary/20 font-body text-primary hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Saving..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notify;
