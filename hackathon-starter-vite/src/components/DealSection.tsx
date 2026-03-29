import DealCard from "./DealCard";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Deal {
  name: string;
  priceUsd: number;
  originalPriceUsd: number;
  discount: string;
  image: string;
}

interface DealSectionProps {
  region: string;
  deals: Deal[];
}

const DealSection = ({ region, deals }: DealSectionProps) => {
  const { convert } = useCurrency();
  return (
    <div className="mb-[3vw]">
      <h2 className="font-body text-[clamp(1.5rem,2.2vw,2.5rem)] font-normal mb-[1.5vw]">
        <span className="text-accent font-bold">HOT</span> deal for {region} 🔥
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[clamp(0.8rem,1.5vw,1.5rem)]">
        {deals.map((deal, i) => (
          <DealCard
            key={i}
            name={deal.name}
            price={convert(deal.priceUsd)}
            originalPrice={convert(deal.originalPriceUsd)}
            discount={deal.discount}
            image={deal.image}
          />
        ))}
      </div>
    </div>
  );
};

export default DealSection;
