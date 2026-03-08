import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

const tokenLogos: Record<string, string> = { ETH: ethLogo, USDT: usdtLogo, USDC: usdcLogo };

interface Transaction {
  id: string;
  type: string;
  token: string;
  amount: number;
  to_address: string | null;
  from_address: string | null;
  network: string;
  status: string;
  created_at: string;
  tx_hash: string | null;
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
};

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setTransactions((data as Transaction[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const truncate = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "--";

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Transaction History</h3>
        <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Your transaction history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                tx.type === "send" ? "bg-destructive/10" : "bg-emerald-500/10"
              }`}>
                {tx.type === "send" ? (
                  <ArrowUpRight className="w-4 h-4 text-destructive" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <img src={tokenLogos[tx.token]} alt={tx.token} className="w-4 h-4 rounded-full" />
                  <span className="text-sm font-medium text-foreground capitalize">{tx.type}</span>
                  <span className="text-xs text-muted-foreground">{tx.token}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {tx.type === "send" ? `To: ${truncate(tx.to_address)}` : `From: ${truncate(tx.from_address)}`}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-sm font-mono font-medium ${
                  tx.type === "send" ? "text-destructive" : "text-emerald-500"
                }`}>
                  {tx.type === "send" ? "-" : "+"}{tx.amount} {tx.token}
                </p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  {statusIcons[tx.status]}
                  <span className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
