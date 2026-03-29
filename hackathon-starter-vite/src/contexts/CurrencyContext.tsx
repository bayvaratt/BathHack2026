import { createContext, useContext, useState, ReactNode } from "react";

// All prices in DB are GBP — rates convert GBP → target currency
const currencyData: Record<string, { symbol: string; rate: number }> = {
  GBP: { symbol: "£", rate: 1 },
  USD: { symbol: "$", rate: 1.27 },
  EUR: { symbol: "€", rate: 1.17 },
  JPY: { symbol: "¥", rate: 190 },
  THB: { symbol: "฿", rate: 44 },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  symbol: string;
  convert: (gbpPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState("GBP");
  const { symbol, rate } = currencyData[currency];

  const convert = (gbpPrice: number) => {
    const converted = Math.round(gbpPrice * rate);
    return `${symbol}${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
