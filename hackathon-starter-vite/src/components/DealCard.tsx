interface DealCardProps {
  name: string;
  price: string;
  image: string;
  originalPrice?: string;
  discount?: string;
}

const DealCard = ({ name, price, image, originalPrice, discount }: DealCardProps) => {
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer group bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="aspect-[16/9] w-full overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {discount && (
          <span className="absolute top-[0.5vw] left-[0.5vw] bg-accent text-accent-foreground text-[clamp(0.65rem,0.8vw,0.9rem)] font-bold font-body px-[0.6vw] py-[0.3vw] rounded-md">
            {discount}
          </span>
        )}
      </div>
      <div className="p-[clamp(0.6rem,1vw,1.2rem)] flex items-center justify-between">
        <h3 className="font-body text-[clamp(1rem,1.2vw,1.4rem)] font-bold text-foreground">{name}</h3>
        <div className="flex items-center gap-[0.5vw]">
          {originalPrice && (
            <span className="text-[clamp(0.75rem,0.9vw,1rem)] font-body text-muted-foreground line-through">{originalPrice}</span>
          )}
          <span className="text-[clamp(1.1rem,1.4vw,1.6rem)] font-bold font-body text-primary">{price}</span>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
