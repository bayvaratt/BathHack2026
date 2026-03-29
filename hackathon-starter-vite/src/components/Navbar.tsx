import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";

const currencies = ["USD", "EUR", "GBP", "JPY", "THB"];

const Navbar = ({ hideCurrency = false }: { hideCurrency?: boolean }) => {
  const location = useLocation();
  const { currency, setCurrency, symbol } = useCurrency();

  const isActive = (path: string) => location.pathname === path || (path === "/notify" && location.pathname.startsWith("/notify"));

  return (
    <nav className="bg-gradient-to-r from-[hsl(var(--header-gradient-from))] to-[hsl(var(--header-gradient-to))] px-[4vw] py-[1.8vw] flex items-center">
      <Link to="/" className="font-poppins font-extrabold text-[clamp(1.4rem,2.2vw,2.4rem)] tracking-tight text-primary-foreground flex-shrink-0">
        <span className="text-white">B</span>estination
      </Link>

      {/* Nav links centered */}
      <div className="flex-1 flex items-center justify-center gap-[4vw]">
        <Link
          to="/"
          className={`text-[clamp(1rem,1.4vw,1.5rem)] font-body transition-colors ${
            isActive("/") ? "text-primary-foreground underline underline-offset-4" : "text-primary-foreground/80 hover:text-primary-foreground"
          }`}
        >
          Home
        </Link>
        <Link
          to="/notify"
          className={`text-[clamp(1rem,1.4vw,1.5rem)] font-body transition-colors ${
            isActive("/notify") ? "text-primary-foreground underline underline-offset-4" : "text-primary-foreground/80 hover:text-primary-foreground"
          }`}
        >
          Notify
        </Link>
      </div>

      {/* Currency selector */}
      <div className="flex-shrink-0 flex justify-end">
      {!hideCurrency && (
      <DropdownMenu>
        <DropdownMenuTrigger className="text-[clamp(1rem,1.4vw,1.5rem)] text-primary-foreground/90 hover:text-primary-foreground flex items-center gap-2 font-body">
          {symbol} <span className="text-[clamp(0.7rem,0.9vw,1rem)]">▼</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {currencies.map((c) => (
            <DropdownMenuItem key={c} onClick={() => setCurrency(c)}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      )}
      </div>
    </nav>
  );
};

export default Navbar;
