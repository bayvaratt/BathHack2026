const cabinLabels: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

const cabinColors: Record<string, string> = {
  economy: "bg-blue-500/90 text-white",
  premium_economy: "bg-purple-500/90 text-white",
  business: "bg-amber-500/90 text-white",
  first: "bg-rose-600/90 text-white",
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
}

const DealCard = ({ name, country, price, originalPrice, discount, image, cabinClass, origin, airline }: DealCardProps) => {
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer group bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
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
        {/* Cabin class badge - top right */}
        <span className={`absolute top-2 right-2 text-xs font-bold font-body px-2 py-1 rounded-md ${cabinColors[cabinClass] ?? "bg-gray-500/90 text-white"}`}>
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

        {/* Flights from + airline */}
        <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-3">
          <span>Flights from <span className="font-semibold text-foreground">{origin}</span></span>
          <span className="text-foreground/60">{airline}</span>
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
  );
};

export default DealCard;
