"use client";

import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/contexts/currency-context";
import { useAuthInterceptor } from "@/hooks/use-auth-interceptor";

function AuthInterceptor() {
  useAuthInterceptor();
  return null;
}

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <AuthInterceptor />
        <>{children}</>
      </CurrencyProvider>
    </SessionProvider>
  );
}
