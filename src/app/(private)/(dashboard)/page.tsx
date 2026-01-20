"use client";

import { MainLayout } from "../components/main-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/currency-context";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface ExchangeRates {
  EUR?: number;
  USD?: number;
  BRL?: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCurrency } = useCurrency();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [loadingRates, setLoadingRates] = useState(false);

  const valuesInBRL = {
    totalPaid: 15000,
    total: 50000,
    remaining: 35000,
  };

  const fetchExchangeRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/BRL",
      );
      if (!response.ok) {
        throw new Error("Erro ao buscar taxas de câmbio");
      }
      const data = await response.json();
      if (data.rates) {
        setExchangeRates({
          EUR: data.rates.EUR,
          USD: data.rates.USD,
          BRL: 1,
        });
      }
    } catch (err) {
      console.error("Erro ao buscar câmbio:", err);

      setExchangeRates({
        EUR: 0.18,
        USD: 0.2,
        BRL: 1,
      });
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    fetchExchangeRates();
    return () => clearTimeout(timer);
  }, [fetchExchangeRates]);

  const convertValue = (valueInBRL: number): number => {
    if (selectedCurrency.code === "BRL") {
      return valueInBRL;
    }
    const rate = exchangeRates[selectedCurrency.code];
    if (!rate) return valueInBRL;
    return valueInBRL * rate;
  };

  const formatCurrency = (value: number) => {
    let locale = "pt-PT";
    if (selectedCurrency.code === "USD") {
      locale = "en-US";
    } else if (selectedCurrency.code === "EUR") {
      locale = "pt-PT";
    } else if (selectedCurrency.code === "BRL") {
      locale = "pt-BR";
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const cards = [
    {
      id: 1,
      title: "Valor Total Pago",
      value: convertValue(valuesInBRL.totalPaid),
      description: "Total já pago até o momento",
    },
    {
      id: 2,
      title: "Valor Total",
      value: convertValue(valuesInBRL.total),
      description: "Valor total do projeto",
    },
    {
      id: 3,
      title: "Valor Total Restante",
      value: convertValue(valuesInBRL.remaining),
      description: "Valor que ainda falta pagar",
    },
  ];

  return (
    <MainLayout
      headerTitle="Bem-vindo ao Projeto Rumo - Portugal"
      headerDescription="Uma plataforma moderna para se organizar e planejar sua imigração para Portugal"
    >
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="space-y-4"
        >
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="text-2xl font-bold"
          >
            Conteúdo Principal
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Este é o conteúdo principal da página. Aqui você pode adicionar
            qualquer conteúdo que desejar.
          </motion.p>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? cards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: card.id * 0.1 }}
                  className="rounded-lg border bg-card p-6 shadow-sm"
                >
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </motion.div>
              ))
            : cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.4 + index * 0.1,
                    type: "spring",
                    stiffness: 200,
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="mb-2 text-lg font-semibold"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + index * 0.1, type: "spring" }}
                    key={`${selectedCurrency.code}-${card.id}`}
                    className="mb-3"
                  >
                    {loadingRates ? (
                      <Skeleton className="h-9 w-32" />
                    ) : (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="text-3xl font-bold text-primary"
                      >
                        {formatCurrency(card.value)}
                      </motion.p>
                    )}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-sm text-muted-foreground"
                  >
                    {card.description}
                  </motion.p>
                </motion.div>
              ))}
        </section>
      </div>
    </MainLayout>
  );
}
