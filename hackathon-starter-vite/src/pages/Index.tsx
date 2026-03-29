import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import DealSection from "@/components/DealSection";
import { useDeals } from "@/hooks/useDeals";
import { getDestinationImage } from "@/lib/destinationImages";
import { useCurrency } from "@/contexts/CurrencyContext";

const Index = () => {
  const { dealsByRegion, loading } = useDeals();
  const { convert } = useCurrency();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero search area */}
      <div className="bg-gradient-to-b from-primary to-background pt-[2.5vw] pb-[5vw] px-[2.5%]">
        <SearchForm />
      </div>

      {/* Deal sections */}
      <div className="w-[95%] max-w-[1500px] mx-auto py-[2vw]">
        {loading ? (
          <p className="font-body text-muted-foreground">Loading deals...</p>
        ) : Object.keys(dealsByRegion).length === 0 ? (
          <p className="font-body text-muted-foreground">No deals found right now. Check back soon!</p>
        ) : (
          Object.entries(dealsByRegion).map(([region, deals]) => {
            const mapped = deals.map((d) => {
              const originalPrice = Math.round(d.new_price / (1 - d.discount_percent / 100));
              return {
                name: d.destinations?.city ?? d.destination,
                priceGbp: d.new_price,
                originalPriceGbp: originalPrice,
                discount: `${Math.round(d.discount_percent)}% cheaper!`,
                image: getDestinationImage(d.destination),
                price: convert(d.new_price),
                originalPrice: convert(originalPrice),
              };
            });
            return <DealSection key={region} region={region} deals={mapped} />;
          })
        )}
      </div>
    </div>
  );
};

export default Index;
