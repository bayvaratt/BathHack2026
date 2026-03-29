import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from "recharts";
import { ExternalLink, Plane, Calendar, Clock, Tag } from "lucide-react";

const cabinLabels: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

const originCities: Record<string, string> = {
  EDI: "Edinburgh",
  LHR: "London",
  MAN: "Manchester",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

const formatDuration = (iso: string) => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? `${match[2]}m` : "";
  return [h, m].filter(Boolean).join(" ");
};

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  country: string;
  image: string;
  originCode: string;
  destinationCode: string;
  airline: string;
  cabinClass: string;
  departureDate: string;
  duration?: string;
  rawPrice: number;
  rawAvgPrice: number;
  formattedPrice: string;
  formattedAvgPrice: string;
  discountPct: number;
  googleFlightsUrl: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">{payload[0].name}</p>
      <p className="text-primary font-bold">£{payload[0].value.toFixed(0)}</p>
    </div>
  );
};

export default function DealModal({
  open, onClose,
  name, country, image,
  originCode, destinationCode,
  airline, cabinClass, departureDate, duration,
  rawPrice, rawAvgPrice,
  formattedPrice, formattedAvgPrice,
  discountPct, googleFlightsUrl,
}: DealModalProps) {
  const chartData = [
    { label: "Avg Price", value: rawAvgPrice, fill: "hsl(var(--muted-foreground))" },
    { label: "Deal Price", value: rawPrice,   fill: "hsl(var(--primary))" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[72rem] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col sm:flex-row" style={{ minHeight: "540px" }}>

          {/* LEFT — chart panel */}
          <div className="sm:w-[45%] bg-muted/40 p-6 flex flex-col justify-between border-r-2 border-border">
            <div>
              <p className="text-xs font-heading tracking-widest text-muted-foreground uppercase mb-1">Price comparison</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-primary">{discountPct}% off</span>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, rawAvgPrice * 1.2]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v: number) => `£${v.toFixed(0)}`}
                      style={{ fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                  <ReferenceLine y={rawPrice} stroke="hsl(var(--primary))" strokeDasharray="4 3" strokeWidth={1.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Average price</span>
                <span className="font-semibold line-through text-muted-foreground">{formattedAvgPrice}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">Deal price</span>
                <span className="font-bold text-primary text-base">{formattedPrice}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-muted-foreground">You save</span>
                <span className="font-semibold text-green-600">
                  £{(rawAvgPrice - rawPrice).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — flight detail panel */}
          <div className="sm:w-[55%] flex flex-col">
            {/* Destination image */}
            <div className="relative h-44 overflow-hidden">
              <img src={image} alt={name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h2 className="text-white text-xl font-bold font-body leading-tight">{name}</h2>
                <p className="text-white/80 text-sm font-body">{country}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2 text-sm font-body">
                <Plane className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground">
                  {originCode} ({originCities[originCode] ?? originCode})
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground">
                  {destinationCode} ({name})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{formatDate(departureDate)}</span>
              </div>

              {duration && (
                <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                <Plane className="h-4 w-4 flex-shrink-0" />
                <span>{airline}</span>
              </div>

              <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>{cabinLabels[cabinClass] ?? cabinClass}</span>
              </div>

              <div className="mt-auto pt-3">
                <a href={googleFlightsUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading tracking-wider gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Book on Google Flights
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
