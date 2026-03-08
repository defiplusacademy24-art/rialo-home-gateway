import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  network: "ethereum" | "base";
}

const ReceiveModal = ({ open, onClose, address, network }: ReceiveModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
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
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md text-center"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Receive Crypto</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-muted rounded-2xl p-6 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Your Wallet Address</p>
              <p className="text-xs font-mono text-foreground break-all leading-relaxed">{address}</p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Send tokens on <span className="font-medium text-foreground">{network === "ethereum" ? "Ethereum Mainnet" : "Base Network"}</span> to this address. Only send ETH, USDT, or USDC.
            </p>

            <button
              onClick={copy}
              className="w-full py-3 rounded-xl gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Address
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReceiveModal;
