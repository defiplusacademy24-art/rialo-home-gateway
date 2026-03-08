import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionService, PropertyTransaction, TRANSACTION_STATUSES } from "@/services/TransactionService";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTIES } from "@/data/properties";
import { motion } from "framer-motion";
import {
  ShieldCheck, Clock, CheckCircle2, Copy, ChevronRight, ArrowLeft, Circle,
  FileText, Home as HomeIcon, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { USDTIcon, USDCIcon, ETHIcon } from "@/components/CryptoIcons";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const ReactiveTransaction = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tx, setTx] = useState<PropertyTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

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

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

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
      // Refetch after a short delay to catch auto-complete
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
        <div className="container mx-auto px-4 pt-6 mb-6">
          <nav className="flex items-center gap-1.5 text-sm mb-6">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-foreground font-medium">Reactive Transaction</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">REACTIVE TRANSACTION</h1>
        </div>

        {/* Top progress bar */}
        <div className="container mx-auto px-4 mb-8">
          <div className="gradient-hero rounded-2xl p-4 md:p-5 overflow-x-auto">
            <div className="flex items-center min-w-[600px]">
              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      isCurrent ? "bg-white/20 text-primary-foreground" : isActive ? "text-primary-foreground" : "text-white/40"
                    }`}>
                      <span>{step.label}</span>
                      {isActive && i < currentStepIndex && (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded ${
                        i < currentStepIndex ? "bg-accent" : "bg-white/20"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Smart Contract ID bar */}
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-cta flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Smart Contract ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-display font-bold text-foreground">{tx.contract_id}</span>
                  <button onClick={copyContractId} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Contract expires in</span>
              <span className="font-mono font-bold text-foreground bg-muted px-3 py-1 rounded-lg">{countdown}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property card */}
              <motion.div
                className="bg-card border border-border rounded-2xl p-5 md:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {property?.images?.[0] && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full md:w-48 h-36 object-cover rounded-xl"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-xl font-display font-bold text-foreground">{property?.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          {currencyIcons[tx.currency]} {tx.currency}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {property?.city}{property?.state ? `, ${property.state}` : ""}
                    </p>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-xl font-display font-bold text-foreground">
                        ₦{Number(tx.amount).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {tx.currency} ${(Number(tx.amount) / 80).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Status flow */}
                    <div className="flex items-center gap-1.5">
                      <Badge className="gradient-cta text-primary-foreground text-xs">
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

              {/* Progress tracker */}
              <motion.div
                className="bg-card border border-border rounded-2xl p-5 md:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Horizontal progress */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                          <span className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${
                            isCurrent ? "text-accent font-semibold" : isActive ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 rounded ${
                            i < currentStepIndex ? "bg-accent" : "bg-border"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Conditions timeline */}
                <div className="space-y-4">
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
                      <div key={item.key} className="flex items-center gap-3 group">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          checked ? "bg-accent/15" : "bg-muted"
                        }`}>
                          {checked ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}>
                            {item.label}
                          </span>
                          {item.detail && (
                            <span className="text-xs text-muted-foreground ml-2">{item.detail}</span>
                          )}
                        </div>
                        {canUpdate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={updating === item.key}
                            onClick={() => handleUpdateCondition(item.key)}
                          >
                            {updating === item.key ? "..." : "Confirm"}
                          </Button>
                        )}
                        <div className="flex-1 h-px bg-border hidden md:block" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right sidebar */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Smart Contract Card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-4">Rialo Smart Contract</h3>
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 mb-5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono font-medium text-foreground">{tx.contract_id}</span>
                  <button onClick={copyContractId} className="ml-auto text-muted-foreground hover:text-foreground">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
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
                </div>
              </div>

              {/* Countdown card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-sm font-semibold text-foreground mb-3">Contract expires in</p>
                <div className="gradient-hero rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-white/70">Contract expires in</span>
                  </div>
                  <p className="text-4xl font-mono font-bold text-primary-foreground tracking-wider">
                    {countdown}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Transactions: On-chain</span>
                </div>
              </div>

              {/* Actions */}
              {tx.status !== "COMPLETED" && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                  {isBuyer && !conditions.buyer_signed && (
                    <Button
                      className="w-full gradient-cta text-primary-foreground font-semibold"
                      disabled={updating === "buyer_signed"}
                      onClick={() => handleUpdateCondition("buyer_signed")}
                    >
                      Sign Agreement as Buyer
                    </Button>
                  )}
                  {!isBuyer && !conditions.seller_signed && (
                    <Button
                      className="w-full gradient-cta text-primary-foreground font-semibold"
                      disabled={updating === "seller_signed"}
                      onClick={() => handleUpdateCondition("seller_signed")}
                    >
                      Sign Agreement as Seller
                    </Button>
                  )}
                  {conditions.buyer_signed && conditions.seller_signed && !conditions.title_verified && (
                    <Button
                      className="w-full gradient-cta text-primary-foreground font-semibold"
                      disabled={updating === "title_verified"}
                      onClick={() => handleUpdateCondition("title_verified")}
                    >
                      Verify Title Transfer
                    </Button>
                  )}
                </div>
              )}

              {tx.status === "COMPLETED" && (
                <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h3 className="font-display font-bold text-foreground mb-1">Transaction Complete</h3>
                  <p className="text-sm text-muted-foreground">All conditions met. Funds released to seller.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReactiveTransaction;
