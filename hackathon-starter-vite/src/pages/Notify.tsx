import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
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

const fromOptions = [
  { value: "EDI", label: "Edinburgh (EDI)" },
  { value: "LHR", label: "London Heathrow (LHR)" },
  { value: "MAN", label: "Manchester (MAN)" },
];

const toOptions = [
  { value: "everywhere", label: "Everywhere" },
  { value: "europe", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "americas", label: "Americas" },
];

const durationUnits = ["days", "weeks", "months"];

// Destinations spread around center (50,50) of the SVG canvas
const destinations = [
  { label: "Amsterdam",  x: 55, y: 22 },
  { label: "Paris",      x: 42, y: 28 },
  { label: "Barcelona",  x: 30, y: 38 },
  { label: "Rome",       x: 58, y: 38 },
  { label: "Athens",     x: 68, y: 44 },
  { label: "Lisbon",     x: 18, y: 48 },
  { label: "Madrid",     x: 24, y: 56 },
  { label: "Dubai",      x: 78, y: 34 },
  { label: "Bangkok",    x: 88, y: 52 },
  { label: "Singapore",  x: 85, y: 68 },
  { label: "Tokyo",      x: 92, y: 22 },
  { label: "Shanghai",   x: 82, y: 14 },
  { label: "Sydney",     x: 90, y: 80 },
  { label: "New York",   x: 8,  y: 32 },
];

// Origin hub — dead centre
const origin = { x: 50, y: 50 };

// Build curved arc path between two points
function arcPath(
  x1: number, y1: number,
  x2: number, y2: number,
  curvature = 0.3
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
      className="absolute inset-0 w-full h-full"
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
          <stop offset="0%"   stopColor="hsl(30 95% 55%)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(30 95% 55%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft radial glow from origin */}
      <rect width="100" height="100" fill="url(#bgGrad)" />

      {/* Flight arcs */}
      {destinations.map((d, i) => (
        <path
          key={i}
          className="flight-path"
          d={arcPath(origin.x, origin.y, d.x, d.y, i % 2 === 0 ? 0.25 : -0.25)}
        />
      ))}

      {/* Destination dots + labels */}
      {destinations.map((d, i) => (
        <g key={i}>
          <circle
            cx={d.x} cy={d.y} r="0.6"
            fill="hsl(30 95% 55% / 0.5)"
          />
          <text
            x={d.x + 1} y={d.y + 0.5}
            fontSize="2.2"
            fill="hsl(30 95% 55% / 0.55)"
            fontFamily="sans-serif"
          >
            {d.label}
          </text>
        </g>
      ))}

      {/* Origin hub */}
      <circle cx={origin.x} cy={origin.y} r="1.2" fill="hsl(30 95% 55% / 0.8)" />
      <circle cx={origin.x} cy={origin.y} r="2.5" fill="none" stroke="hsl(30 95% 55% / 0.3)" strokeWidth="0.4" />
      <text
        x={origin.x + 1.5} y={origin.y - 1.5}
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("everywhere");
  const [within, setWithin] = useState("");
  const [unit, setUnit] = useState("days");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleWithinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) setWithin(val);
  };

  const handleNotifyClick = () => {
    setShowSetup(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar hideCurrency />

      {/* Hero section with map background */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "80vh" }}>
        <FlightMapBackground />

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-2xl px-6 py-20">
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading tracking-widest uppercase">
            Flight Deal Monitor
          </div>
          <h1 className="font-body text-6xl font-normal text-foreground leading-tight mb-4">
            Track prices.<br />Catch deals.<br />
            <span className="text-primary font-semibold">Get notified.</span>
          </h1>
          <p className="font-body text-lg text-muted-foreground mb-10">
            Our agent monitors 14 destinations 24/7 and alerts you the moment prices drop.
          </p>

          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading tracking-wider text-sm px-10 py-5 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-105"
            onClick={handleNotifyClick}
          >
            NOTIFY ME
          </Button>
        </div>
      </div>

      {/* Drop-down form */}
      <div
        ref={formRef}
        className={`w-full flex justify-center px-4 pb-16 transition-all duration-500 ease-in-out ${
          showSetup
            ? "opacity-100 max-h-[1000px] translate-y-0"
            : "opacity-0 max-h-0 -translate-y-4 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl">
          {/* Connecting line from hero */}
          <div className="flex justify-center mb-6">
            <div className="w-px h-10 bg-gradient-to-b from-primary/40 to-transparent" />
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <h2 className="font-heading text-sm tracking-widest text-muted-foreground uppercase mb-5">
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
                    <SelectValue placeholder="Select airport" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
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
                <label className="text-xs font-body text-muted-foreground">
                  Depart within
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="e.g. 3"
                    value={within}
                    onChange={handleWithinChange}
                    inputMode="numeric"
                    className="flex-1"
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
                <label className="text-xs font-body text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="you@example.com"
                />
              </div>

              <label className="flex items-start gap-2 text-xs font-body text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(c: boolean) => setConsent(c === true)}
                  className="mt-0.5"
                />
                I agree to receive flight deal alerts by email. I can unsubscribe anytime.
              </label>

              <Button
                disabled={!consent || !from || !email}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading tracking-wider disabled:opacity-40 disabled:cursor-not-allowed rounded-full py-5"
              >
                Set Alert
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notify;
