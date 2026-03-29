import { useState } from "react";
import DealModal from "./DealModal";

const cabinLabels: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

const cabinDots: Record<string, string> = {
  economy: "bg-sky-400",
  premium_economy: "bg-violet-400",
  business: "bg-amber-400",
  first: "bg-rose-400",
};

interface DealCardProps {
  name: string;
  country: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  cabinClass: string;
  origin: string;
  airline: string;
  departureDate: string;
  originCode: string;
  destinationCode: string;
  duration?: string;
  rawPrice: number;
  rawAvgPrice: number;
  discountPct: number;
}

const originCities: Record<string, string> = {
  EDI: 'Edinburgh',
  LHR: 'London',
  MAN: 'Manchester',
};

const buildGoogleFlightsUrl = (originCode: string, destinationCode: string, departureDate: string) => {
  const q = `flights from ${originCode} to ${destinationCode} on ${departureDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
};

const formatDuration = (iso: string) => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? `${match[2]}m` : "";
  return [h, m].filter(Boolean).join(" ");
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const DealCard = ({ name, country, price, originalPrice, discount, image, cabinClass, origin, airline, departureDate, originCode, destinationCode, duration, rawPrice, rawAvgPrice, discountPct }: DealCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="rounded-xl overflow-hidden cursor-pointer group bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] block"
      >
        {/* Image */}
        <div className="aspect-[16/9] w-full overflow-hidden relative">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Discount badge - top left */}
          {discount && (
            <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold font-body px-2 py-1 rounded-md">
              {discount}
            </span>
          )}
          {/* Cabin class badge - top right (frosted glass style) */}
          <span className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold font-body px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cabinDots[cabinClass] ?? "bg-gray-400"}`} />
            {cabinLabels[cabinClass] ?? cabinClass}
          </span>
        </div>

        {/* Card body */}
        <div className="p-3">
          {/* Destination name + country */}
          <div className="mb-2">
            <h3 className="font-body text-base font-bold text-foreground leading-tight">{name}</h3>
            <p className="font-body text-xs text-muted-foreground">{country}</p>
          </div>

          {/* Route + duration */}
          <div className="flex items-center justify-between text-sm font-body mb-1">
            <span className="font-semibold text-foreground tracking-wide">
              {originCode} ({originCities[originCode] ?? originCode}) → {destinationCode} ({name})
            </span>
            {duration && (
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatDuration(duration)}</span>
            )}
          </div>

          {/* Departure date + airline */}
          <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-3">
            <span>{formatDate(departureDate)}</span>
            <span>{airline}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wide">From</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-body text-primary">{price}</span>
                {originalPrice && (
                  <span className="text-xs font-body text-muted-foreground line-through">{originalPrice}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        name={name}
        country={country}
        image={image}
        originCode={originCode}
        destinationCode={destinationCode}
        airline={airline}
        cabinClass={cabinClass}
        departureDate={departureDate}
        duration={duration}
        rawPrice={rawPrice}
        rawAvgPrice={rawAvgPrice}
        formattedPrice={price}
        formattedAvgPrice={originalPrice ?? ""}
        discountPct={discountPct}
        googleFlightsUrl={buildGoogleFlightsUrl(originCode, destinationCode, departureDate)}
      />
    </>
  );
};

export default DealCard;
