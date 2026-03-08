import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

interface NetworkBalances {
  eth: string;
  usdt: string;
  usdc: string;
}

interface WalletBalanceCardsProps {
  balances: NetworkBalances | undefined;
  loading: boolean;
}

const tokens = [
  { key: "eth" as const, label: "ETH Balance", sub: "Ether", logo: ethLogo },
  { key: "usdt" as const, label: "USDT Balance", sub: "Tether USD", logo: usdtLogo },
  { key: "usdc" as const, label: "USDC Balance", sub: "USD Coin", logo: usdcLogo },
];

const WalletBalanceCards = ({ balances, loading }: WalletBalanceCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {tokens.map((token) => (
        <div key={token.key} className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={token.logo} alt={token.key.toUpperCase()} className="w-6 h-6 rounded-full" />
            <p className="text-xs opacity-60">{token.label}</p>
          </div>
          <p className="text-lg font-mono font-bold truncate">
            {loading ? (
              <span className="inline-block w-16 h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              balances?.[token.key] ?? "--"
            )}
          </p>
          <p className="text-xs opacity-60 mt-1">{token.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default WalletBalanceCards;
