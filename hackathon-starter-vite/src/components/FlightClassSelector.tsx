const flightClasses = ["Economy", "Premium Economy", "Business", "First"] as const;
type FlightClass = (typeof flightClasses)[number];

interface FlightClassSelectorProps {
  selected: FlightClass;
  onChange: (cls: FlightClass) => void;
}

const FlightClassSelector = ({ selected, onChange }: FlightClassSelectorProps) => {
  return (
    <div className="inline-flex items-center gap-1 bg-black/10 rounded-full p-1">
      {flightClasses.map((cls) => (
        <button
          key={cls}
          onClick={() => onChange(cls)}
          className={`px-4 py-1.5 rounded-full text-sm font-body font-semibold transition-all duration-200 ${
            selected === cls
              ? "bg-white text-foreground shadow-sm"
              : "text-primary-foreground/80 hover:text-primary-foreground"
          }`}
        >
          {cls}
        </button>
      ))}
    </div>
  );
};

export default FlightClassSelector;
export type { FlightClass };
