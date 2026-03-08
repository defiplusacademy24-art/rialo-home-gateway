import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExchangeRates {
  ETH: { ngn: number; usd: number };
  USDT: { ngn: number; usd: number };
  USDC: { ngn: number; usd: number };
  NGN_USD: number;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-exchange-rates");
      if (error) throw error;
      if (data && !data.error) setRates(data);
    } catch (err) {
      console.error("Failed to fetch exchange rates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh every 60 seconds
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number | null => {
      if (!rates || !amount) return null;

      // Convert everything to NGN first, then to target
      let amountInNgn: number;

      switch (fromCurrency) {
        case "NGN":
          amountInNgn = amount;
          break;
        case "ETH":
          amountInNgn = amount * rates.ETH.ngn;
          break;
        case "USDT":
          amountInNgn = amount * rates.USDT.ngn;
          break;
        case "USDC":
          amountInNgn = amount * rates.USDC.ngn;
          break;
        default:
          return null;
      }

      switch (toCurrency) {
        case "NGN":
          return amountInNgn;
        case "ETH":
          return rates.ETH.ngn > 0 ? amountInNgn / rates.ETH.ngn : null;
        case "USDT":
          return rates.USDT.ngn > 0 ? amountInNgn / rates.USDT.ngn : null;
        case "USDC":
          return rates.USDC.ngn > 0 ? amountInNgn / rates.USDC.ngn : null;
        case "USD":
          return rates.NGN_USD > 0 ? amountInNgn * rates.NGN_USD : null;
        default:
          return null;
      }
    },
    [rates]
  );

  return { rates, loading, convert, refresh: fetchRates };
}
