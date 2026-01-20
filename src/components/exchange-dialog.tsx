"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ExchangeRate {
  [key: string]: number;
}

interface ExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExchangeDialog({ open, onOpenChange }: ExchangeDialogProps) {
  const [mode, setMode] = useState<"manual" | "auto">("auto");
  const [rates, setRates] = useState<ExchangeRate>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [manualRates, setManualRates] = useState({
    EURBRL: "",
    USDBRL: "",
    EURUSD: "",
    USDEUR: "",
  });

  const fetchExchangeRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/EUR",
      );
      if (!response.ok) {
        throw new Error("Erro ao buscar taxas de câmbio");
      }
      const data = await response.json();
      if (data.rates) {
        setRates(data.rates);
        setLastUpdate(new Date());
      } else {
        throw new Error("Formato de dados inválido");
      }
    } catch (err) {
      setError("Não foi possível carregar as taxas de câmbio");
      console.error("Erro ao buscar câmbio:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && mode === "auto") {
      fetchExchangeRates();
    }
  }, [open, mode, fetchExchangeRates]);

  const handleManualRateChange = (currency: string, value: string) => {
    setManualRates((prev) => ({
      ...prev,
      [currency]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Câmbio de Moedas</DialogTitle>
          <DialogDescription>
            Visualize as taxas de câmbio atuais ou configure manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
              className="flex-1"
            >
              Câmbio Manual
            </Button>
            <Button
              variant={mode === "auto" ? "default" : "outline"}
              onClick={() => {
                setMode("auto");
                if (open) {
                  fetchExchangeRates();
                }
              }}
              className="flex-1"
            >
              Câmbio Automático
            </Button>
          </div>

          <Separator />

          {mode === "auto" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Taxas baseadas em EUR (Euro)
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchExchangeRates}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!loading && !error && Object.keys(rates).length > 0 && (
                <div className="space-y-3">
                  {[
                    {
                      from: "EUR",
                      to: "BRL",
                      fromLabel: "Euro",
                      toLabel: "Real Brasileiro",
                      rate: rates.BRL,
                      calculation: (rates.BRL || 0),
                    },
                    {
                      from: "USD",
                      to: "BRL",
                      fromLabel: "Dólar Americano",
                      toLabel: "Real Brasileiro",
                      rate: rates.BRL && rates.USD ? rates.BRL / rates.USD : undefined,
                      calculation: rates.BRL && rates.USD ? rates.BRL / rates.USD : 0,
                    },
                    {
                      from: "EUR",
                      to: "USD",
                      fromLabel: "Euro",
                      toLabel: "Dólar Americano",
                      rate: rates.USD,
                      calculation: (rates.USD || 0),
                    },
                    {
                      from: "USD",
                      to: "EUR",
                      fromLabel: "Dólar Americano",
                      toLabel: "Euro",
                      rate: rates.USD ? 1 / rates.USD : undefined,
                      calculation: rates.USD ? 1 / rates.USD : 0,
                    },
                  ].map((conversion, index) => {
                    return (
                      <motion.div
                        key={`${conversion.from}-${conversion.to}`}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: 0.1 * index,
                          type: "spring",
                          stiffness: 200,
                        }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {conversion.from} → {conversion.to}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            1 {conversion.fromLabel} = ? {conversion.toLabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {conversion.rate !== undefined && conversion.rate !== null
                              ? Number(conversion.rate).toFixed(4)
                              : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conversion.to}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && Object.keys(rates).length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma taxa de câmbio disponível
                </div>
              )}

              {lastUpdate && (
                <p className="text-xs text-center text-muted-foreground">
                  Última atualização: {lastUpdate.toLocaleTimeString("pt-PT")}
                </p>
              )}
            </motion.div>
          )}

          {mode === "manual" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Configure manualmente as taxas de câmbio
              </p>
              <div className="space-y-3">
                {[
                  { from: "EUR", to: "BRL", fromLabel: "Euro", toLabel: "Real Brasileiro" },
                  { from: "USD", to: "BRL", fromLabel: "Dólar Americano", toLabel: "Real Brasileiro" },
                  { from: "EUR", to: "USD", fromLabel: "Euro", toLabel: "Dólar Americano" },
                  { from: "USD", to: "EUR", fromLabel: "Dólar Americano", toLabel: "Euro" },
                ].map((conversion) => (
                  <div key={`${conversion.from}-${conversion.to}`} className="space-y-2">
                    <label className="text-sm font-medium">
                      {conversion.from} → {conversion.to}{" "}
                      <span className="text-muted-foreground">
                        (1 {conversion.fromLabel} = ? {conversion.toLabel})
                      </span>
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={
                        manualRates[
                          `${conversion.from}${conversion.to}` as keyof typeof manualRates
                        ] || ""
                      }
                      onChange={(e) =>
                        handleManualRateChange(
                          `${conversion.from}${conversion.to}`,
                          e.target.value,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
