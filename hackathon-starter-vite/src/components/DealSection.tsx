import DealCard from "./DealCard";

interface Deal {
  name: string;
  price: string;
  originalPrice: string;
  discount: string;
  image: string;
}

interface DealSectionProps {
  region: string;
  deals: Deal[];
}

const DealSection = ({ region, deals }: DealSectionProps) => {
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
            price={deal.price}
            originalPrice={deal.originalPrice}
            discount={deal.discount}
            image={deal.image}
          />
        ))}
      </div>
    </div>
  );
};

export default DealSection;
