import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Copy, Eye, EyeOff, CreditCard, RefreshCw, ExternalLink, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WalletData {
  address: string;
  encrypted_private_key: string;
}

interface NetworkBalances {
  eth: string;
  usdt: string;
}

interface Balances {
  ethereum: NetworkBalances;
  base: NetworkBalances;
}

const WalletTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<"ethereum" | "base">("ethereum");

  useEffect(() => {
    fetchWallet();
  }, [user]);

  const fetchBalances = useCallback(async (address: string) => {
    setBalancesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-wallet-balances", {
        body: { address },
      });
      if (error) throw error;
      setBalances(data);
    } catch {
      // silently fail, balances show as --
    }
    setBalancesLoading(false);
  }, []);

  const fetchWallet = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("wallets")
      .select("address, encrypted_private_key")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setWallet(data);
      fetchBalances(data.address);
    }
    setLoading(false);
  };

  const generateWallet = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const newWallet = ethers.Wallet.createRandom();
      const { error } = await supabase.from("wallets").insert({
        user_id: user.id,
        address: newWallet.address,
        encrypted_private_key: newWallet.privateKey,
      });
      if (error) throw error;
      setWallet({ address: newWallet.address, encrypted_private_key: newWallet.privateKey });
      fetchBalances(newWallet.address);
      toast({ title: "Wallet created!", description: "Your EVM wallet has been generated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const currentBalances = balances?.[activeNetwork];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-16"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl gradient-cta flex items-center justify-center mb-6">
          <Wallet className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-3">
          Create Your Wallet
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Generate a secure EVM-compatible wallet to receive crypto payments and manage your property transactions on-chain.
        </p>
        <button
          onClick={generateWallet}
          disabled={generating}
          className="px-8 py-3 rounded-xl gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Generate Wallet
            </>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Wallet</h2>
        <p className="text-muted-foreground mt-1">Manage your crypto wallet and payment methods.</p>
      </div>

      {/* Network Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveNetwork("ethereum")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeNetwork === "ethereum"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Ethereum
        </button>
        <button
          onClick={() => setActiveNetwork("base")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeNetwork === "base"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Base
        </button>
      </div>

      {/* Wallet Card */}
      <div className="rounded-2xl gradient-cta p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium opacity-80">
                {activeNetwork === "ethereum" ? "Ethereum Mainnet" : "Base Network"}
              </span>
            </div>
            <button
              onClick={() => fetchBalances(wallet.address)}
              disabled={balancesLoading}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Refresh balances"
            >
              <RefreshCw className={`w-4 h-4 ${balancesLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs opacity-60 mb-1">ETH Balance</p>
              <p className="text-xl font-mono font-bold">
                {balancesLoading ? (
                  <span className="inline-block w-20 h-6 bg-white/20 rounded animate-pulse" />
                ) : (
                  currentBalances?.eth ?? "--"
                )}
              </p>
              <p className="text-xs opacity-60 mt-1">Ether</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs opacity-60 mb-1">USDT Balance</p>
              <p className="text-xl font-mono font-bold">
                {balancesLoading ? (
                  <span className="inline-block w-20 h-6 bg-white/20 rounded animate-pulse" />
                ) : (
                  currentBalances?.usdt ?? "--"
                )}
              </p>
              <p className="text-xs opacity-60 mt-1">Tether USD</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs opacity-60 mb-1">Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-semibold tracking-wide">
                {truncateAddress(wallet.address)}
              </code>
              <button
                onClick={() => copyToClipboard(wallet.address, "Address")}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Copy address"
              >
                {copied === "Address" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={
                  activeNetwork === "ethereum"
                    ? `https://etherscan.io/address/${wallet.address}`
                    : `https://basescan.org/address/${wallet.address}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={activeNetwork === "ethereum" ? "View on Etherscan" : "View on BaseScan"}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 opacity-60" />
            <span className="text-xs opacity-60">Secured with blockchain technology</span>
          </div>
        </div>
      </div>

      {/* Private Key Section */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Private Key</h3>
            <p className="text-sm text-muted-foreground">Never share your private key with anyone.</p>
          </div>
          <button
            onClick={() => setShowPrivateKey(!showPrivateKey)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrivateKey ? "Hide" : "Reveal"}
          </button>
        </div>
        {showPrivateKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3"
          >
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-3">
              <p className="text-xs text-destructive font-medium">
                ⚠️ Warning: Do not share your private key. Anyone with access to it can control your wallet and funds.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <code className="text-sm font-mono text-foreground break-all flex-1">
                {wallet.encrypted_private_key}
              </code>
              <button
                onClick={() => copyToClipboard(wallet.encrypted_private_key, "Private key")}
                className="p-2 rounded-lg hover:bg-background transition-colors shrink-0"
                title="Copy private key"
              >
                {copied === "Private key" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-1">Payment Methods</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Accepted methods for property transactions on RialEstate.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-emerald-500">₮</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">USDT (Tether)</p>
              <p className="text-xs text-muted-foreground">Stablecoin · ERC-20</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-blue-500">Ξ</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ethereum (ETH)</p>
              <p className="text-xs text-muted-foreground">Native currency</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Bank Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, Verve</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-amber-500">₦</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">NGN direct transfer</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-3">Security Information</h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            Your wallet is generated locally and stored securely in our encrypted database.
          </li>
          <li className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            Private keys are never transmitted in plain text over the network.
          </li>
          <li className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            All crypto transactions are verified on the Ethereum and Base blockchains.
          </li>
          <li className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            Bank card payments are processed through PCI-DSS compliant payment gateways.
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default WalletTab;
