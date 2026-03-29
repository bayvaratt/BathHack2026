import { useState } from "react";
import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import DealSection from "@/components/DealSection";
import { useDeals } from "@/hooks/useDeals";
import { getDestinationImage } from "@/lib/destinationImages";
import { useCurrency } from "@/contexts/CurrencyContext";
import { type FlightClass } from "@/components/FlightClassSelector";

const Index = () => {
  const [flightClass, setFlightClass] = useState<FlightClass>("All");
  const { dealsByRegion, loading } = useDeals(flightClass);
  const { convert } = useCurrency();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero search area */}
      <div className="bg-gradient-to-b from-primary via-primary/80 to-background pt-[3vw] pb-[6vw] px-[2.5%]">
        {/* Tagline */}
        <div className="text-center mb-6">
          <h1 className="font-poppins font-extrabold text-white text-[clamp(1.8rem,3.5vw,3.2rem)] leading-tight mb-2">
            Find deals. Fly smarter.
          </h1>
          <p className="font-body text-white/80 text-[clamp(0.9rem,1.4vw,1.2rem)]">
            We track prices 24/7 and notify you when fares drop.
          </p>
        </div>
        <SearchForm flightClass={flightClass} setFlightClass={setFlightClass} />
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
                country: d.destinations?.country ?? "",
                price: convert(d.new_price),
                originalPrice: convert(originalPrice),
                discount: `${Math.round(d.discount_percent)}% off!`,
                image: getDestinationImage(d.destination),
                cabinClass: d.cabin_class,
                origin: d.origin,
                airline: d.airline,
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
