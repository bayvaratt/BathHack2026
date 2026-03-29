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
    <div className="mb-8">
      <h2 className="font-body text-2xl font-normal mb-4">
        <span className="text-accent font-bold">HOT</span> deal for {region} 🔥
      </h2>
      <div className="grid grid-cols-3 gap-4">
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
