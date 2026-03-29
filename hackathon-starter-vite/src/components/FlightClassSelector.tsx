import { Checkbox } from "@/components/ui/checkbox";

const flightClasses = ["Economy", "Premium Economy", "Business", "First"] as const;
type FlightClass = (typeof flightClasses)[number];

interface FlightClassSelectorProps {
  selected: FlightClass;
  onChange: (cls: FlightClass) => void;
}

const FlightClassSelector = ({ selected, onChange }: FlightClassSelectorProps) => {
  return (
    <div className="inline-flex items-center gap-10">
      {flightClasses.map((cls) => (
        <label key={cls} className="flex items-center gap-2.5 text-base font-body cursor-pointer">
          <Checkbox className="h-5 w-5"
            checked={selected === cls}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange(cls);
              }
              // Prevent unchecking - always need one selected
            }}
          />
          {cls}
        </label>
      ))}
    </div>
  );
};

export default FlightClassSelector;
export type { FlightClass };
