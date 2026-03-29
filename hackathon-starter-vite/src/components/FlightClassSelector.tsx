const flightClasses = ["Economy", "Premium Economy", "Business", "First"] as const;
type FlightClass = (typeof flightClasses)[number];

interface FlightClassSelectorProps {
  selected: FlightClass;
  onChange: (cls: FlightClass) => void;
  variant?: "dark" | "light";
}

const FlightClassSelector = ({ selected, onChange, variant = "dark" }: FlightClassSelectorProps) => {
  const container = variant === "dark"
    ? "bg-black/10"
    : "bg-muted";

  const activeBtn = variant === "dark"
    ? "bg-white text-foreground shadow-sm"
    : "bg-background text-foreground shadow-sm border border-border";

  const inactiveBtn = variant === "dark"
    ? "text-primary-foreground/80 hover:text-primary-foreground"
    : "text-muted-foreground hover:text-foreground";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full p-1 ${container}`}>
      {flightClasses.map((cls) => (
        <button
          key={cls}
          onClick={() => onChange(cls)}
          className={`px-4 py-1.5 rounded-full text-sm font-body font-semibold transition-all duration-200 ${
            selected === cls ? activeBtn : inactiveBtn
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
