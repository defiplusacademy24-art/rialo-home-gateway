import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  network: "ethereum" | "base";
  walletAddress: string;
}

const tokenOptions = [
  { value: "ETH", label: "ETH", logo: ethLogo },
  { value: "USDT", label: "USDT", logo: usdtLogo },
  { value: "USDC", label: "USDC", logo: usdcLogo },
];

const SendModal = ({ open, onClose, network, walletAddress }: SendModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !amount || !toAddress) return;
    setSending(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "send",
        token,
        amount: parseFloat(amount),
        to_address: toAddress,
        from_address: walletAddress,
        network,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Transaction submitted", description: `Sending ${amount} ${token} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}` });
      onClose();
      setAmount("");
      setToAddress("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Send Crypto</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Token</label>
                <div className="flex gap-2">
                  {tokenOptions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setToken(t.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        token === t.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <img src={t.logo} alt={t.label} className="w-5 h-5 rounded-full" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Recipient Address</label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                Network: <span className="font-medium text-foreground">{network === "ethereum" ? "Ethereum Mainnet" : "Base Network"}</span>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !amount || !toAddress}
                className="w-full py-3 rounded-xl gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Send {token}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SendModal;
