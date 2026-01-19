"use client";

import { CurrencyProvider } from "@/contexts/currency-context";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CurrencyProvider>
      <>{children}</>
    </CurrencyProvider>
  );
}
