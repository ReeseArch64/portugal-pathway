"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Currency {
  code: "BRL" | "USD" | "EUR";
  label: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: "BRL", label: "Real Brasileiro", symbol: "R$" },
  { code: "USD", label: "Dólar Americano", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies[0],
  );

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
