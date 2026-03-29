import DealCard from "./DealCard";

interface Deal {
  name: string;
  country: string;
  price: string;
  originalPrice: string;
  discount: string;
  image: string;
  cabinClass: string;
  origin: string;
  airline: string;
}

interface DealSectionProps {
  region: string;
  deals: Deal[];
}

const DealSection = ({ region, deals }: DealSectionProps) => {
  return (
    <div className="mb-[3vw]">
      <div className="flex items-baseline gap-3 mb-[1.5vw]">
        <h2 className="font-poppins font-bold text-[clamp(1.2rem,1.8vw,2rem)] text-foreground">
          {region}
        </h2>
        <span className="font-poppins font-semibold text-[clamp(0.75rem,1vw,1rem)] text-accent uppercase tracking-widest">
          🔥 Hot deals
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[clamp(0.8rem,1.5vw,1.5rem)]">
        {deals.map((deal, i) => (
          <DealCard
            key={i}
            name={deal.name}
            country={deal.country}
            price={deal.price}
            originalPrice={deal.originalPrice}
            discount={deal.discount}
            image={deal.image}
            cabinClass={deal.cabinClass}
            origin={deal.origin}
            airline={deal.airline}
          />
        ))}
      </div>
    </div>
  );
};

export default DealSection;
