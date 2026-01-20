"use client";

import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/contexts/currency-context";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <>{children}</>
      </CurrencyProvider>
    </SessionProvider>
  );
}
