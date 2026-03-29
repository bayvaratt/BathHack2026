import Navbar from "@/components/Navbar";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const durationUnits = ["days", "weeks", "months", "years"];

const SearchResults = () => {
  const [params] = useSearchParams();
  const within = params.get("within") || "0";
  const unit = params.get("unit") || "days";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10" placeholder="Search destinations..." />
          </div>
          <Input className="h-10 w-20" value={within} readOnly />
          <Select defaultValue={unit}>
            <SelectTrigger className="h-10 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="font-body text-sm">
          within <span className="text-primary font-bold">{within}</span> {unit}, there is{" "}
          <span className="text-primary font-bold">000</span> available options
        </p>
      </div>
    </div>
  );
};

export default SearchResults;
