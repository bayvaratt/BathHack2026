interface DealCardProps {
  name: string;
  price: string;
  image: string;
  originalPrice?: string;
  discount?: string;
}

const DealCard = ({ name, price, image, originalPrice, discount }: DealCardProps) => {
  return (
    <div className="rounded-xl overflow-hidden cursor-pointer group bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="aspect-video w-full overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold font-body px-2 py-1 rounded-md">
            {discount}
          </span>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-body text-lg font-bold text-foreground">{name}</h3>
        <div className="flex items-center gap-2">
          {originalPrice && (
            <span className="text-sm font-body text-muted-foreground line-through">{originalPrice}</span>
          )}
          <span className="text-xl font-bold font-body text-primary">{price}</span>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
