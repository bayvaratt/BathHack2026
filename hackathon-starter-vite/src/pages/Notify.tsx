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

const destinations = (() => {
  const names = [
    "Amsterdam", "Shanghai", "Tokyo", "Dubai",
    "Bangkok", "Singapore", "Sydney", "New York",
    "Madrid", "Lisbon", "Barcelona", "Athens",
    "Rome", "Paris",
  ];
  return names.map((label, index) => {
    const angleDeg = index * (360 / 14) - 90;
    const radians = (angleDeg * Math.PI) / 180;
    return {
      label,
      x: Math.round((50 + 42 * Math.cos(radians)) * 10) / 10,
      y: Math.round((50 + 42 * Math.sin(radians)) * 10) / 10,
    };
  });
})();

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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("all");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadOrigins() {
      const { data: origins, error } = await supabase.from("origins").select("iata_code, city");
      if (error) {
        toast.error("Unable to load origin options.");
        return;
      }
      setOriginOptions(
        (origins ?? []).map((airport) => ({
          value: airport.iata_code,
          label: `${airport.city} (${airport.iata_code})`,
        })),
      );
    }
    loadOrigins();
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

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v: string) => /^\+?[0-9\s\-()]{7,15}$/.test(v);
  const unitToDays: Record<string, number> = { days: 1, weeks: 7, months: 30 };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!from) nextErrors.from = "Required — please select a departure airport.";
    if (!within) nextErrors.within = "Required — enter how far ahead to search.";
    if (!email && !phoneNumber) {
      nextErrors.email = "Please enter an email address.";
      nextErrors.phone = "Or enter a WhatsApp number.";
    } else {
      if (email && !validateEmail(email)) nextErrors.email = "Enter a valid email address (e.g. you@example.com).";
      if (phoneNumber && !validatePhone(phoneNumber)) nextErrors.phone = "Enter a valid phone number with country code (e.g. +447700900123).";
    }
    if (!consent) nextErrors.consent = "Required — please agree to continue.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await saveNotificationPreference({
        email,
        phoneNumber,
        origin: from,
        region: to,
        cabinClass: flightClass,
        departWithinDays: parseInt(within) * unitToDays[unit],
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
        <div className="w-full max-w-4xl">
          <div className="flex justify-center mb-6">
            <div className="w-px h-10 bg-gradient-to-b from-primary/40 to-transparent" />
          </div>

          <div className="bg-card rounded-2xl p-12 shadow-lg border border-border">
            <h2 className="font-heading text-base tracking-widest text-muted-foreground uppercase mb-8">
              Set up your alert
            </h2>

            <FlightClassSelector selected={flightClass} onChange={setFlightClass} />

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
              {/* From */}
              <div className="flex flex-col">
                <label className={`text-sm font-body mb-1 ${errors.from ? "text-destructive" : "text-muted-foreground"}`}>
                  From<span className="text-accent ml-0.5">*</span>
                </label>
                <Select value={from} onValueChange={(v) => { setFrom(v); setErrors((e) => ({ ...e, from: "" })); }}>
                  <SelectTrigger className={errors.from ? "border-destructive focus:ring-destructive" : ""}>
                    <SelectValue placeholder="Select airport" />
                  </SelectTrigger>
                  <SelectContent>
                    {originOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-destructive mt-1 min-h-[1rem]">{errors.from ?? ""}</p>
              </div>

              {/* To */}
              <div className="flex flex-col">
                <label className="text-sm font-body text-muted-foreground mb-1">To</label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everywhere</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Americas">Americas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="min-h-[1rem]" />
              </div>

              {/* Depart within */}
              <div className="col-span-2 flex flex-col">
                <label className={`text-sm font-body mb-1 ${errors.within ? "text-destructive" : "text-muted-foreground"}`}>
                  Depart within<span className="text-accent ml-0.5">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. 3"
                    value={within}
                    onChange={(e) => { handleWithinChange(e); setErrors((err) => ({ ...err, within: "" })); }}
                    inputMode="numeric"
                    className={`flex-1 ${errors.within ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
                <p className="text-xs text-destructive mt-1 min-h-[1rem]">{errors.within ?? ""}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-0">
              {/* Email */}
              <div className="flex flex-col">
                <label className={`text-sm font-body mb-1 ${errors.email ? "text-destructive" : "text-muted-foreground"}`}>
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((err) => ({ ...err, email: "" })); }}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  placeholder="you@example.com"
                />
                <p className="text-xs text-destructive mt-1 min-h-[1rem]">{errors.email ?? ""}</p>
              </div>

              {/* Phone */}
              <div className="flex flex-col">
                <label className={`text-sm font-body mb-1 ${errors.phone ? "text-destructive" : "text-muted-foreground"}`}>
                  WhatsApp number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); setErrors((err) => ({ ...err, phone: "" })); }}
                  className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                  placeholder="+447700900123"
                />
                <p className="text-xs text-destructive mt-1 min-h-[1rem]">{errors.phone ?? ""}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* Consent */}
              <div>
                <label className={`flex items-start gap-2 text-sm font-body cursor-pointer ${errors.consent ? "text-destructive" : "text-muted-foreground"}`}>
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(checked: boolean) => { setConsent(checked === true); setErrors((e) => ({ ...e, consent: "" })); }}
                    className={`mt-0.5 ${errors.consent ? "border-destructive" : ""}`}
                  />
                  I agree to receive deal notifications for this route.
                </label>
                <p className="text-xs text-destructive mt-1 ml-6 min-h-[1rem]">{errors.consent ?? ""}</p>
              </div>

              <Button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full rounded-full bg-primary py-5 font-heading tracking-wider text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Saving..." : "Set Alert"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notify;
