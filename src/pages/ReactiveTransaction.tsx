import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionService, PropertyTransaction, TRANSACTION_STATUSES } from "@/services/TransactionService";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTIES } from "@/data/properties";
import { motion } from "framer-motion";
import {
  ShieldCheck, Clock, CheckCircle2, Copy, ChevronRight, Circle,
  FileText, Home as HomeIcon, AlertCircle, Wallet, RefreshCw, Building2,
  Upload, Image as ImageIcon, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { USDTIcon, USDCIcon, ETHIcon } from "@/components/CryptoIcons";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import nairaLogo from "@/assets/naira-logo.jpg";

const STATUS_STEPS = [
  { key: "PAYMENT_INITIATED", label: "Payment Initiated" },
  { key: "FUNDS_LOCKED", label: "Funds Locked" },
  { key: "CONTRACT_ACTIVE", label: "Contract Period" },
  { key: "TITLE_VERIFICATION", label: "Title Verification" },
  { key: "SETTLEMENT_EXECUTION", label: "Settlement" },
  { key: "COMPLETED", label: "Completed" },
];

const currencyIcons: Record<string, React.ReactNode> = {
  USDT: <USDTIcon size={16} />,
  USDC: <USDCIcon size={16} />,
  ETH: <ETHIcon size={16} />,
};

const currencyLogos: Record<string, string> = {
  ETH: ethLogo,
  USDT: usdtLogo,
  USDC: usdcLogo,
  BANK_TRANSFER: nairaLogo,
};

const ReactiveTransaction = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tx, setTx] = useState<PropertyTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sellerBank, setSellerBank] = useState<{ bank_name: string; account_name: string; account_number: string } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [sellerWalletAddress, setSellerWalletAddress] = useState<string | null>(null);
  const [cryptoProcessing, setCryptoProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchTransaction = useCallback(async () => {
    if (!id || !user) return;
    try {
      const data = await TransactionService.get(id);
      setTx(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transaction");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  // Fetch wallet balance for the transaction currency
  const fetchWalletBalance = useCallback(async (currency: string) => {
    if (!user) return;
    setBalanceLoading(true);
    try {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wallet) {
        const { data } = await supabase.functions.invoke("get-wallet-balances", {
          body: { address: wallet.address },
        });
        if (data?.ethereum) {
          const key = currency.toLowerCase() as "eth" | "usdt" | "usdc";
          setWalletBalance(data.ethereum[key] ?? "0.00");
        }
      }
    } catch {}
    setBalanceLoading(false);
  }, [user]);

  // Fetch seller bank details for bank transfer transactions
  const fetchSellerBank = useCallback(async (sellerId: string) => {
    const { data } = await supabase
      .from("bank_details")
      .select("bank_name, account_name, account_number")
      .eq("user_id", sellerId)
      .maybeSingle();
    if (data) setSellerBank(data);
  }, []);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  // Fetch seller wallet address for crypto payments
  const fetchSellerWallet = useCallback(async (sellerId: string) => {
    const { data } = await supabase
      .from("wallets")
      .select("address")
      .eq("user_id", sellerId)
      .maybeSingle();
    if (data) setSellerWalletAddress(data.address);
  }, []);

  useEffect(() => {
    if (tx?.currency === "BANK_TRANSFER" && tx?.seller_id) {
      fetchSellerBank(tx.seller_id);
    } else if (tx?.currency && tx?.seller_id) {
      fetchWalletBalance(tx.currency);
      fetchSellerWallet(tx.seller_id);
    }
  }, [tx?.currency, tx?.seller_id, fetchWalletBalance, fetchSellerBank, fetchSellerWallet]);

  // Set proof URL from transaction data
  useEffect(() => {
    if (tx && (tx as any).payment_proof_url) {
      setProofUrl((tx as any).payment_proof_url);
    }
  }, [tx]);

  // Upload payment proof for bank transfers
  const handleProofUpload = async () => {
    if (!proofFile || !tx || !user) return;
    setProofUploading(true);
    try {
      const fileExt = proofFile.name.split(".").pop();
      const filePath = `payment-proofs/${tx.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("property-files")
        .upload(filePath, proofFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-files")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update transaction with proof URL
      const { error: updateError } = await supabase
        .from("property_transactions")
        .update({ payment_proof_url: publicUrl } as any)
        .eq("id", tx.id);
      if (updateError) throw updateError;

      setProofUrl(publicUrl);
      setProofFile(null);
      toast.success("Payment proof uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload proof");
    }
    setProofUploading(false);
  };

  // Crypto payment: confirm and simulate deduction
  const handleCryptoConfirmPayment = async () => {
    if (!tx || !user) return;
    
    const balance = parseFloat(walletBalance || "0");
    // For simplicity, we use the NGN amount as-is (the actual conversion happens at initiation)
    // In production, you'd convert tx.amount from NGN to crypto
    if (balance <= 0) {
      toast.error(`Insufficient ${tx.currency} balance. Please fund your wallet first.`, {
        duration: 5000,
      });
      return;
    }

    setCryptoProcessing(true);
    try {
      // Record the crypto send transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "send",
        token: tx.currency,
        amount: tx.amount,
        to_address: sellerWalletAddress || "seller-wallet",
        from_address: (await supabase.from("wallets").select("address").eq("user_id", user.id).maybeSingle()).data?.address || "",
        network: "ethereum",
        status: "completed",
      });

      // Confirm payment condition
      const updated = await TransactionService.updateCondition(tx.id, "payment_confirmed");
      setTx(updated);
      toast.success(`${tx.currency} payment confirmed! Funds locked in smart contract.`);
      setTimeout(fetchTransaction, 1500);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    }
    setCryptoProcessing(false);
  };

  // Polling every 5 seconds
  useEffect(() => {
    if (!id || !user) return;
    const interval = setInterval(fetchTransaction, 5000);
    return () => clearInterval(interval);
  }, [fetchTransaction, id, user]);

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`tx-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "property_transactions",
        filter: `id=eq.${id}`,
      }, () => fetchTransaction())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchTransaction]);

  // Countdown timer
  useEffect(() => {
    if (!tx?.deadline) return;
    const update = () => {
      const diff = new Date(tx.deadline).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tx?.deadline]);

  const handleUpdateCondition = async (condition: string) => {
    if (!tx) return;
    setUpdating(condition);
    try {
      const updated = await TransactionService.updateCondition(tx.id, condition as any);
      setTx(updated);
      toast.success(`${condition.replace(/_/g, " ")} updated`);
      setTimeout(fetchTransaction, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to update condition");
    } finally {
      setUpdating(null);
    }
  };

  const copyContractId = () => {
    if (tx) {
      navigator.clipboard.writeText(tx.contract_id);
      toast.success("Contract ID copied");
    }
  };

  const currentStepIndex = tx ? TRANSACTION_STATUSES.indexOf(tx.status as any) : 0;
  const isBuyer = tx?.buyer_id === user?.id;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 container mx-auto px-4 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Transaction Not Found</h1>
          <p className="text-muted-foreground mb-6">This transaction doesn't exist or you don't have access.</p>
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const conditions = tx.conditions;
  const mockProperty = PROPERTIES.find((p) => p.id === Number(tx.property_id));
  const property = mockProperty ? {
    title: mockProperty.title,
    city: mockProperty.location.split(",")[0],
    state: mockProperty.location.split(",")[1]?.trim() || null,
    images: [mockProperty.image],
    price: Number(mockProperty.priceNGN.replace(/,/g, "")),
    property_type: mockProperty.type,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Header breadcrumb */}
        <div className="container mx-auto px-4 pt-6 mb-4 md:mb-6">
          <nav className="flex items-center gap-1.5 text-sm mb-4 md:mb-6">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-foreground font-medium">Reactive Transaction</span>
          </nav>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">REACTIVE TRANSACTION</h1>
        </div>

        {/* Property info card (mobile-first) */}
        <div className="container mx-auto px-4 mb-4 md:mb-8">
          <motion.div
            className="bg-card border border-border rounded-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {property?.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full sm:w-40 h-32 sm:h-28 object-cover rounded-xl"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-lg md:text-xl font-display font-bold text-foreground truncate">{property?.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {property?.city}{property?.state ? `, ${property.state}` : ""}
                </p>
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                  <span className="text-lg md:text-xl font-display font-bold text-foreground">
                    ₦{Number(tx.amount).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {tx.currency} ${(Number(tx.amount) / 80).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Status flow pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className="gradient-cta text-primary-foreground text-xs flex items-center gap-1">
                    {currencyIcons[tx.currency]} {tx.currency}
                  </Badge>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {tx.status === "COMPLETED" ? "Completed" : "Contract Active"}
                  </Badge>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">Settlement</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress stepper (horizontal, scrollable on mobile) */}
        <div className="container mx-auto px-4 mb-4 md:mb-8">
          <motion.div
            className="bg-card border border-border rounded-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="overflow-x-auto pb-2 -mx-1">
              <div className="flex items-start min-w-[520px] px-1">
                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {isActive && i < currentStepIndex ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <HomeIcon className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        <span className={`text-[9px] md:text-[11px] mt-1.5 text-center leading-tight max-w-[70px] ${
                          isCurrent ? "text-accent font-semibold" : isActive ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mt-4 md:mt-5 rounded ${
                          i < currentStepIndex ? "bg-accent" : "bg-border"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conditions timeline */}
            <div className="mt-6 space-y-3">
              {[
                { key: "payment_confirmed", label: "Payment Confirmed", detail: "1 Buyer deposited" },
                { key: "funds_locked", label: "Funds Locked in Smart Contract", detail: null, derived: conditions.payment_confirmed },
                { key: "buyer_signed", label: "Buyer Signed Agreement", detail: null },
                { key: "seller_signed", label: "Seller Signed Agreement", detail: null },
                { key: "title_verified", label: "Title Transfer Verification", detail: conditions.title_verified ? "Verified" : "Pending · Ownership Validation" },
                { key: "funds_released", label: "Funds Released", detail: null, derived: tx.status === "COMPLETED" },
              ].map((item) => {
                const isCondition = ["payment_confirmed", "buyer_signed", "seller_signed", "title_verified"].includes(item.key);
                const checked = isCondition
                  ? (conditions as any)[item.key]
                  : item.derived || false;

                const canUpdate = isCondition && !checked && tx.status !== "COMPLETED" && (
                  (item.key === "buyer_signed" && isBuyer) ||
                  (item.key === "seller_signed" && !isBuyer) ||
                  item.key === "title_verified"
                );

                return (
                  <div key={item.key} className="flex items-start sm:items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                      checked ? "bg-accent/15" : "bg-muted"
                    }`}>
                      {checked ? (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.label}
                      </span>
                      {item.detail && (
                        <span className="text-xs text-muted-foreground ml-1 sm:ml-2">{item.detail}</span>
                      )}
                    </div>
                    {canUpdate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 shrink-0"
                        disabled={updating === item.key}
                        onClick={() => handleUpdateCondition(item.key)}
                      >
                        {updating === item.key ? "..." : "Confirm"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom cards grid */}
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Smart Contract Card */}
            <motion.div
              className="bg-card border border-border rounded-2xl p-5 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-base font-display font-bold text-foreground mb-4">Rialo Smart Contract</h3>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 mb-4">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-mono font-medium text-foreground truncate">{tx.contract_id}</span>
                <button onClick={copyContractId} className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-semibold text-foreground mb-3">Conditions For Settlement:</p>
              <div className="space-y-2.5">
                {[
                  { key: "payment_confirmed", label: "Payment Confirmed" },
                  { key: "buyer_signed", label: "Buyer Signed Agreement" },
                  { key: "seller_signed", label: "Seller Signed Agreement" },
                  { key: "title_verified", label: "Title Transfer Verification" },
                ].map((c) => {
                  const checked = (conditions as any)[c.key];
                  return (
                    <div key={c.key} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        checked ? "bg-accent/15" : "bg-muted"
                      }`}>
                        {checked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {c.label}
                      </span>
                    </div>
                  );
                })}
                {!conditions.title_verified && (
                  <p className="text-xs text-muted-foreground ml-7">Pending · Ownership Validation</p>
                )}
              </div>
            </motion.div>

            {/* Payment Info Card */}
            <motion.div
              className="bg-card border border-border rounded-2xl p-5 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {tx.currency === "BANK_TRANSFER" ? (
                <>
                  <h3 className="text-base font-display font-bold text-foreground mb-4">Seller Bank Details</h3>
                  {sellerBank ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                        <img src={nairaLogo} alt="NGN" className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Bank Name</p>
                          <p className="text-sm font-semibold text-foreground">{sellerBank.bank_name}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Account Name</p>
                          <p className="text-sm font-semibold text-foreground">{sellerBank.account_name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Account Number</p>
                            <p className="text-lg font-mono font-bold text-foreground">{sellerBank.account_number}</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(sellerBank.account_number);
                              toast.success("Account number copied");
                            }}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 size={14} />
                        Transfer ₦{Number(tx.amount).toLocaleString()} to this account
                      </p>

                      {/* Payment Proof Upload */}
                      {isBuyer && tx.status !== "COMPLETED" && tx.status !== "CANCELLED" && (
                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Upload size={14} />
                            Upload Payment Proof
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            After making your bank transfer, upload a screenshot or receipt as proof of payment.
                          </p>

                          {proofUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
                                <CheckCircle2 size={16} className="text-accent shrink-0" />
                                <span className="text-sm text-foreground font-medium">Payment proof uploaded</span>
                              </div>
                              <a
                                href={proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-primary hover:underline"
                              >
                                <ImageIcon size={12} />
                                View uploaded proof
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                                <Upload size={20} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {proofFile ? proofFile.name : "Click to select receipt image"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                />
                              </label>
                              {proofFile && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 gradient-cta text-primary-foreground font-semibold"
                                    disabled={proofUploading}
                                    onClick={handleProofUpload}
                                  >
                                    {proofUploading ? (
                                      <>
                                        <RefreshCw size={14} className="animate-spin mr-1" />
                                        Uploading...
                                      </>
                                    ) : (
                                      "Upload Proof"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setProofFile(null)}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Seller can view proof */}
                      {!isBuyer && proofUrl && (
                        <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-2">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <ImageIcon size={14} />
                            Buyer's Payment Proof
                          </h4>
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={proofUrl}
                              alt="Payment proof"
                              className="w-full max-h-48 object-contain rounded-lg border border-border"
                            />
                          </a>
                          <p className="text-xs text-muted-foreground">Click image to view full size</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                      <Building2 size={24} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Seller has not added bank details yet.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-display font-bold text-foreground">Wallet & Payment</h3>
                    <button
                      onClick={() => tx?.currency && fetchWalletBalance(tx.currency)}
                      disabled={balanceLoading}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw size={14} className={balanceLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <img src={currencyLogos[tx.currency]} alt={tx.currency} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{tx.currency} Balance</p>
                      <p className="text-xl font-mono font-bold text-foreground">
                        {balanceLoading ? (
                          <span className="inline-block w-20 h-6 bg-muted rounded animate-pulse" />
                        ) : (
                          walletBalance ?? "--"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Crypto Confirm Payment Button */}
                  {isBuyer && !conditions.payment_confirmed && tx.status !== "COMPLETED" && tx.status !== "CANCELLED" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Amount to send</p>
                        <p className="text-lg font-mono font-bold text-foreground">
                          ₦{Number(tx.amount).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">in {tx.currency}</span>
                        </p>
                        {sellerWalletAddress && (
                          <p className="text-xs text-muted-foreground mt-1">
                            To: <span className="font-mono">{sellerWalletAddress.slice(0, 8)}...{sellerWalletAddress.slice(-6)}</span>
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full gradient-cta text-primary-foreground font-semibold"
                        disabled={cryptoProcessing || balanceLoading}
                        onClick={handleCryptoConfirmPayment}
                      >
                        {cryptoProcessing ? (
                          <>
                            <RefreshCw size={14} className="animate-spin mr-2" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <Wallet size={14} className="mr-2" />
                            Confirm & Pay with {tx.currency}
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {tx.currency} will be deducted from your wallet and locked in the smart contract
                      </p>
                    </div>
                  )}

                  {conditions.payment_confirmed && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30 mt-3">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span className="text-sm text-foreground font-medium">Payment confirmed & funds locked</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Wallet size={14} />
                    <span>Payment method: {tx.currency}</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Countdown card */}
            <motion.div
              className="bg-card border border-border rounded-2xl p-5 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-base font-display font-bold text-foreground mb-4">Contract Timer</p>
              <div className="gradient-hero rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-white/70">Contract expires in</span>
                </div>
                <p className="text-3xl md:text-4xl font-mono font-bold text-primary-foreground tracking-wider">
                  {countdown}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span>Transactions: On-chain</span>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          {tx.status !== "COMPLETED" && tx.status !== "CANCELLED" && (
            <motion.div
              className="mt-4 md:mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {isBuyer && !conditions.buyer_signed && (
                <Button
                  className="flex-1 gradient-cta text-primary-foreground font-semibold"
                  disabled={updating === "buyer_signed"}
                  onClick={() => handleUpdateCondition("buyer_signed")}
                >
                  Sign Agreement as Buyer
                </Button>
              )}
              {!isBuyer && !conditions.seller_signed && (
                <Button
                  className="flex-1 gradient-cta text-primary-foreground font-semibold"
                  disabled={updating === "seller_signed"}
                  onClick={() => handleUpdateCondition("seller_signed")}
                >
                  Sign Agreement as Seller
                </Button>
              )}
              {conditions.buyer_signed && conditions.seller_signed && !conditions.title_verified && (
                <Button
                  className="flex-1 gradient-cta text-primary-foreground font-semibold"
                  disabled={updating === "title_verified"}
                  onClick={() => handleUpdateCondition("title_verified")}
                >
                  Verify Title Transfer
                </Button>
              )}
              {isBuyer && (
                <Button
                  variant="destructive"
                  className="flex-1 font-semibold"
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    try {
                      await TransactionService.cancel(tx.id);
                      toast.success("Transaction cancelled");
                      navigate(`/property/${tx.property_id}`);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to cancel");
                    } finally {
                      setCancelling(false);
                    }
                  }}
                >
                  {cancelling ? "Cancelling..." : "Cancel Transaction"}
                </Button>
              )}
            </motion.div>
          )}

          {tx.status === "COMPLETED" && (
            <motion.div
              className="mt-4 md:mt-6 bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-1">Transaction Complete</h3>
              <p className="text-sm text-muted-foreground">All conditions met. Funds released to seller.</p>
            </motion.div>
          )}

          {tx.status === "CANCELLED" && (
            <motion.div
              className="mt-4 md:mt-6 bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-1">Transaction Cancelled</h3>
              <p className="text-sm text-muted-foreground mb-4">This transaction has been cancelled by the buyer.</p>
              <Button variant="outline" onClick={() => navigate(`/property/${tx.property_id}`)}>
                Back to Property
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReactiveTransaction;
