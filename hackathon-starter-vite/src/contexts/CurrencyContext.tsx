import { createContext, useContext, useState, ReactNode } from "react";

const currencyData: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.79 },
  JPY: { symbol: "¥", rate: 149.5 },
  THB: { symbol: "฿", rate: 34.5 },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  symbol: string;
  convert: (usdPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState("USD");
  const { symbol, rate } = currencyData[currency];

  const convert = (usdPrice: number) => {
    const converted = Math.round(usdPrice * rate);
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
