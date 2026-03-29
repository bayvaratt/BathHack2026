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
    <nav className="bg-gradient-to-r from-[hsl(var(--header-gradient-from))] to-[hsl(var(--header-gradient-to))] px-6 py-4 flex items-center">
      <Link to="/" className="font-heading text-xl tracking-wider text-primary-foreground uppercase flex-shrink-0 w-[120px]">
        Bestination
      </Link>

      {/* Nav links centered */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <Link
          to="/"
          className={`text-sm font-body transition-colors ${
            isActive("/") ? "text-primary-foreground underline underline-offset-4" : "text-primary-foreground/80 hover:text-primary-foreground"
          }`}
        >
          Home
        </Link>
        <Link
          to="/notify"
          className={`text-sm font-body transition-colors ${
            isActive("/notify") ? "text-primary-foreground underline underline-offset-4" : "text-primary-foreground/80 hover:text-primary-foreground"
          }`}
        >
          Notify
        </Link>
      </div>

      {/* Currency selector - same width as logo to balance centering */}
      <div className="flex-shrink-0 w-[120px] flex justify-end">
      {!hideCurrency && (
      <DropdownMenu>
        <DropdownMenuTrigger className="text-sm text-primary-foreground/90 hover:text-primary-foreground flex items-center gap-1 font-body">
          {symbol} <span className="text-xs">▼</span>
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
