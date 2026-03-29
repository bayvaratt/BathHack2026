import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import DealSection from "@/components/DealSection";

import parisImg from "@/assets/paris.jpg";
import londonImg from "@/assets/london.jpg";
import romeImg from "@/assets/rome.jpg";
import tokyoImg from "@/assets/tokyo.jpg";
import bangkokImg from "@/assets/bangkok.jpg";
import baliImg from "@/assets/bali.jpg";

const europeDeals = [
  { name: "Paris", priceUsd: 299, originalPriceUsd: 429, discount: "30% cheaper!", image: parisImg },
  { name: "London", priceUsd: 349, originalPriceUsd: 499, discount: "30% cheaper!", image: londonImg },
  { name: "Rome", priceUsd: 279, originalPriceUsd: 389, discount: "28% cheaper!", image: romeImg },
];

const asiaDeals = [
  { name: "Tokyo", priceUsd: 450, originalPriceUsd: 650, discount: "31% cheaper!", image: tokyoImg },
  { name: "Bangkok", priceUsd: 199, originalPriceUsd: 310, discount: "36% cheaper!", image: bangkokImg },
  { name: "Bali", priceUsd: 320, originalPriceUsd: 450, discount: "29% cheaper!", image: baliImg },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero search area */}
      <div className="bg-gradient-to-b from-primary to-background pt-[2.5vw] pb-[5vw] px-[2.5%]">
        <SearchForm />
      </div>

      {/* Deal sections */}
      <div className="w-[95%] max-w-[1500px] mx-auto py-[2vw]">
        <DealSection region="Europe" deals={europeDeals} />
        <DealSection region="Asia" deals={asiaDeals} />
      </div>
    </div>
  );
};

export default Index;
