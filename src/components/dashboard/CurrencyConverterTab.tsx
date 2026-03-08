import { useState } from "react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ArrowDownUp } from "lucide-react";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import nairaLogo from "@/assets/naira-logo.jpg";

const TOKENS = [
  { key: "NGN", label: "NGN", sub: "Nigerian Naira", logo: nairaLogo },
  { key: "USDT", label: "USDT", sub: "Tether", logo: usdtLogo },
  { key: "USDC", label: "USDC", sub: "USD Coin", logo: usdcLogo },
  { key: "ETH", label: "ETH", sub: "Ethereum", logo: ethLogo },
];

const CurrencyConverterTab = () => {
  const { rates, loading, convert, refresh } = useExchangeRates();
  const [amount, setAmount] = useState("1000000");
  const [from, setFrom] = useState("NGN");

  const numAmount = Number(amount) || 0;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Currency Converter</h2>
          <p className="text-sm text-muted-foreground">Live rates · auto-refreshes every 60s</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Input */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Amount</Label>
        <Input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-xl font-mono font-bold h-14"
          placeholder="Enter amount"
        />

        {/* From selector */}
        <div className="grid grid-cols-4 gap-2">
          {TOKENS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFrom(t.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                from === t.key
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <img src={t.logo} alt={t.key} className="w-7 h-7 rounded-full" />
              <span className="text-xs font-semibold text-foreground">{t.key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
          <ArrowDownUp size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* Results */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Converted To</Label>
        {TOKENS.filter((t) => t.key !== from).map((t) => {
          const converted = convert(numAmount, from, t.key);
          const decimals = t.key === "ETH" ? 6 : t.key === "NGN" ? 0 : 2;
          return (
            <div
              key={t.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border"
            >
              <img src={t.logo} alt={t.key} className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t.sub}</p>
                <p className="text-lg font-mono font-bold text-foreground truncate">
                  {loading ? (
                    <span className="inline-block w-24 h-5 bg-muted rounded animate-pulse" />
                  ) : converted != null ? (
                    converted.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <span className="text-sm font-semibold text-muted-foreground shrink-0">{t.key}</span>
            </div>
          );
        })}

        {/* Rate info */}
        {rates && from !== "NGN" && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            1 {from} ≈ ₦{(rates as any)[from]?.ngn?.toLocaleString() || "—"}
          </p>
        )}
        {rates && from === "NGN" && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            1 USDT ≈ ₦{rates.USDT.ngn.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverterTab;
