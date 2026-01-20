"use client";

import { ExchangeDialog } from "@/components/exchange-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { currencies, useCurrency } from "@/contexts/currency-context";
import { motion } from "framer-motion";
import { Coins, Globe, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const languages = [
  { code: "pt-PT", label: "Português Portugal", flag: "🇵🇹" },
  { code: "pt-BR", label: "Português Brasileiro", flag: "🇧🇷" },
  { code: "es", label: "Espanhol", flag: "🇪🇸" },
  { code: "en", label: "Inglês", flag: "🇺🇸" },
];

interface ExchangeRates {
  USD?: number;
  BRL?: number;
}

export function NavBar() {
  const { theme, setTheme } = useTheme();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});

  const user = {
    name: "Visitante",
    image: undefined as string | undefined,
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/EUR",
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.rates) {
          setExchangeRates({
            USD: data.rates.USD,
            BRL: data.rates.BRL,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar câmbio:", error);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchExchangeRates();
      // Atualizar a cada 5 minutos
      const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchExchangeRates]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
    >
      <div className="container flex h-16 items-center gap-4 px-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4">
                <span className="text-sm font-medium">Início</span>
                <button
                  onClick={() => setExchangeDialogOpen(true)}
                  className="text-sm font-medium text-left"
                >
                  Câmbio
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <Image
            src="https://cdn.pixabay.com/animation/2022/09/06/03/13/03-13-38-693_512.gif"
            alt="Logo"
            width={40}
            height={40}
          />
          <span className="font-bold text-xl">Rumo Portugal</span>
        </div>

        {mounted && (
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setExchangeDialogOpen(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <Coins className="h-4 w-4" />
              <span className="text-xs">
                EUR→BRL:{" "}
                {exchangeRates.BRL ? exchangeRates.BRL.toFixed(2) : "--"}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs">
                USD→BRL:{" "}
                {exchangeRates.USD && exchangeRates.BRL
                  ? (exchangeRates.BRL / exchangeRates.USD).toFixed(2)
                  : "--"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExchangeDialogOpen(true)}
              className="sm:hidden"
            >
              <Coins className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang.flag} {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Coins className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency)}
                  >
                    {currency.symbol} {currency.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="dark:hidden" />
              <Moon className="hidden dark:block" />
            </Button>

            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <ExchangeDialog
        open={exchangeDialogOpen}
        onOpenChange={setExchangeDialogOpen}
      />
    </motion.nav>
  );
}
