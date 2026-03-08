import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Star, Bed, Bath, Maximize, MessageCircle, Check, ChevronRight, Wallet, RefreshCw, CreditCard, Building2, ArrowRightLeft, Settings, FileText, Download, ImageIcon } from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USDTIcon, ETHIcon, USDCIcon } from "@/components/CryptoIcons";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionService } from "@/services/TransactionService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PROPERTIES } from "@/data/properties";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import nairaLogo from "@/assets/naira-logo.jpg";

type PaymentMethod = "ETH" | "USDT" | "USDC" | "BANK_TRANSFER";

const CURRENCIES: { key: PaymentMethod; label: string; sub: string; logo?: string; icon?: React.ReactNode; isCrypto: boolean }[] = [
  { key: "ETH", label: "ETH", sub: "Ethereum", logo: ethLogo, icon: <ETHIcon size={18} />, isCrypto: true },
  { key: "USDT", label: "USDT", sub: "Tether USD", logo: usdtLogo, icon: <USDTIcon size={18} />, isCrypto: true },
  { key: "USDC", label: "USDC", sub: "USD Coin", logo: usdcLogo, icon: <USDCIcon size={18} />, isCrypto: true },
  { key: "BANK_TRANSFER", label: "Bank Transfer", sub: "NGN Direct Transfer", logo: nairaLogo, isCrypto: false },
];

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initiating, setInitiating] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<PaymentMethod>("USDT");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, { eth: string; usdt: string; usdc: string }> | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const { rates, loading: ratesLoading, convert } = useExchangeRates();
  const [dbProperty, setDbProperty] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // Try static lookup first
  const staticProperty = PROPERTIES.find((p) => p.id === Number(id));

  // Fetch from DB if not a static property (UUID id)
  useEffect(() => {
    if (staticProperty || !id) return;
    setDbLoading(true);
    const fetchProperty = async () => {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        // Also fetch seller profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", data.user_id)
          .maybeSingle();

        const price = Number(data.price) || 0;
        const formattedNGN = price.toLocaleString("en-NG");
        const estimatedUSD = Math.round(price / 1600).toLocaleString("en-US");
        const name = profile?.full_name || "Seller";
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        const locationStr = [data.city, data.state].filter(Boolean).join(", ") || data.address || "Nigeria";
        const firstImage = data.images && data.images.length > 0 ? data.images[0] : "/placeholder.svg";
        const typeMap: Record<string, string> = {
          house: "House", apartment: "Apartment", villa: "Villa",
          townhouse: "Townhouse", land: "Land", hotel: "Hotel",
        };

        setDbProperty({
          id: data.id,
          image: firstImage,
          images: data.images || [],
          title: data.title,
          location: locationStr,
          priceNGN: formattedNGN,
          priceUSD: estimatedUSD,
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          sqft: data.area_sqft || 0,
          type: typeMap[data.property_type?.toLowerCase()] || data.property_type || "House",
          seller: { name, initials, rating: 5, transactions: 0, verified: false },
          description: data.description || "No description provided.",
          features: [],
          sellerId: data.user_id,
        });
      }
      setDbLoading(false);
    };
    fetchProperty();
  }, [id, staticProperty]);

  const property = staticProperty || dbProperty;

  // Get the NGN price as a number for conversion
  const priceNgn = property ? Number(property.priceNGN.replace(/,/g, "")) : 0;

  const fetchWalletAndBalances = useCallback(async () => {
    if (!user) return;
    const { data: wallet } = await supabase
      .from("wallets")
      .select("address")
      .eq("user_id", user.id)
      .maybeSingle();
    if (wallet) {
      setWalletAddress(wallet.address);
      setBalancesLoading(true);
      try {
        const { data } = await supabase.functions.invoke("get-wallet-balances", {
          body: { address: wallet.address },
        });
        if (data) setBalances(data);
      } catch {}
      setBalancesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletAndBalances();
  }, [fetchWalletAndBalances]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading property...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist.</p>
          <Link to="/properties">
            <Button>Back to Properties</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isLand = property.type === "Land";
  const isHotel = property.type === "Hotel";
  const isOwner = !!(user && property.sellerId && user.id === property.sellerId);

  // Get balance for selected currency on ethereum network
  const getSelectedBalance = () => {
    if (!balances) return null;
    const ethNet = balances.ethereum;
    if (!ethNet) return null;
    const key = selectedCurrency.toLowerCase() as "eth" | "usdt" | "usdc";
    return ethNet[key];
  };

  const selectedBalance = getSelectedBalance();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero image */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute top-6 left-4 md:left-8 z-10">
            <nav className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border text-sm font-medium">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <ChevronRight size={14} className="text-muted-foreground" />
              <Link to="/properties" className="text-muted-foreground hover:text-foreground transition-colors">Properties</Link>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="text-foreground truncate max-w-[150px]">{property.title}</span>
            </nav>
          </div>
          <Badge className="absolute top-6 right-4 md:right-8 z-10 bg-primary/90 text-primary-foreground">
            {property.type}
          </Badge>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 -mt-20 relative z-10 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main info */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">{property.title}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <MapPin size={16} />
                  <span>{property.location}</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-4 mb-4">
                  <span className="text-2xl font-display font-bold text-foreground">₦{property.priceNGN}</span>
                  <span className="text-muted-foreground">≈ ${property.priceUSD}</span>
                </div>

                {/* All currency conversions */}
                {rates && (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {(["ETH", "USDT", "USDC"] as const).map((cur) => {
                      const converted = convert(priceNgn, "NGN", cur);
                      return (
                        <div key={cur} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border">
                          <img
                            src={cur === "ETH" ? ethLogo : cur === "USDT" ? usdtLogo : usdcLogo}
                            alt={cur}
                            className="w-5 h-5 rounded-full shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{cur}</p>
                            <p className="text-sm font-mono font-bold text-foreground truncate">
                              {converted != null
                                ? converted.toLocaleString(undefined, {
                                    minimumFractionDigits: cur === "ETH" ? 4 : 2,
                                    maximumFractionDigits: cur === "ETH" ? 4 : 2,
                                  })
                                : "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Specs bar */}
                <div className="flex flex-wrap gap-6 py-4 border-t border-b border-border text-sm text-muted-foreground">
                  {!isLand && property.bedrooms > 0 && (
                    <span className="flex items-center gap-2"><Bed size={18} /> {property.bedrooms} {isHotel ? "Rooms" : "Bedrooms"}</span>
                  )}
                  {!isLand && property.bathrooms > 0 && (
                    <span className="flex items-center gap-2"><Bath size={18} /> {property.bathrooms} Bathrooms</span>
                  )}
                  <span className="flex items-center gap-2"><Maximize size={18} /> {property.sqft.toLocaleString()} sqft</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-lg font-display font-bold text-foreground mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">Features & Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check size={16} className="text-accent shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Documents */}
              {property.documents && property.documents.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">Property Documents</h2>
                  <div className="space-y-2">
                    {property.documents.map((doc: string, idx: number) => {
                      const fileName = doc.split("/").pop() || `Document ${idx + 1}`;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc);
                      return (
                        <a
                          key={idx}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {isImage ? <ImageIcon size={18} className="text-primary" /> : <FileText size={18} className="text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{isImage ? `Photo ${idx + 1}` : fileName}</p>
                            <p className="text-xs text-muted-foreground">{isImage ? "Image" : "Document"}</p>
                          </div>
                          <Download size={16} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Property Images Gallery */}
              {property.images && property.images.length > 1 && (
                <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">More Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.images.map((img: string, idx: number) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                        <img src={img} alt={`Property photo ${idx + 1}`} className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Escrow */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="text-lg font-display font-bold text-foreground mb-3">Escrow Protection</h2>
                <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-4">
                  <ShieldCheck size={24} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium mb-1">Rialo Smart Contract Escrow</p>
                    <p className="text-sm text-muted-foreground">Funds are locked in a Rialo reactive smart contract until all conditions are verified and met by both parties. No intermediaries, no disputes — just secure, trustless settlement.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Seller card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Seller</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-cta flex items-center justify-center text-primary-foreground font-bold">
                    {property.seller.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{property.seller.name}</span>
                      {property.seller.verified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < property.seller.rating ? "fill-accent text-accent" : "text-muted-foreground"} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{property.seller.transactions} txns</span>
                    </div>
                  </div>
                </div>
                {isOwner ? (
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-center">
                    <p className="text-sm font-medium text-foreground mb-2">This is your listing</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/dashboard")}
                    >
                      <Settings size={16} /> Manage in Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full gradient-cta text-primary-foreground font-semibold hover:opacity-90"
                    onClick={() => {
                      if (!user) { navigate("/login"); return; }
                      const sId = property.sellerId || `seller_${property.id}`;
                      navigate(`/chat?propertyId=${property.id}&sellerId=${sId}`);
                    }}
                  >
                    <MessageCircle size={16} /> Contact Seller
                  </Button>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select Payment Method</h3>
                <div className="space-y-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedCurrency(c.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedCurrency === c.key
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {c.logo ? (
                        <img src={c.logo} alt={c.key} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-amber-500" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.sub}</p>
                      </div>
                      {selectedCurrency === c.key && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={12} className="text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Live Conversion Display */}
                {selectedCurrency !== "BANK_TRANSFER" && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-foreground">Live Conversion</span>
                      {ratesLoading && <span className="inline-block w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">₦{priceNgn.toLocaleString()}</span>
                        <span className="text-sm font-mono font-bold text-foreground">
                          {rates ? (
                            `≈ ${convert(priceNgn, "NGN", selectedCurrency)?.toLocaleString(undefined, {
                              minimumFractionDigits: selectedCurrency === "ETH" ? 6 : 2,
                              maximumFractionDigits: selectedCurrency === "ETH" ? 6 : 2,
                            })} ${selectedCurrency}`
                          ) : (
                            "..."
                          )}
                        </span>
                      </div>
                      {rates && (
                        <p className="text-[10px] text-muted-foreground">
                          1 {selectedCurrency} ≈ ₦{(rates as any)[selectedCurrency]?.ngn?.toLocaleString() || "—"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Wallet Balance - only for crypto */}
                {user && selectedCurrency !== "BANK_TRANSFER" && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Your {selectedCurrency} Balance</span>
                      </div>
                      <button
                        onClick={fetchWalletAndBalances}
                        disabled={balancesLoading}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw size={12} className={balancesLoading ? "animate-spin" : ""} />
                      </button>
                    </div>
                    <p className="text-lg font-mono font-bold text-foreground">
                      {balancesLoading ? (
                        <span className="inline-block w-20 h-5 bg-muted rounded animate-pulse" />
                      ) : walletAddress ? (
                        `${selectedBalance ?? "0.00"} ${selectedCurrency}`
                      ) : (
                        <span className="text-sm text-muted-foreground font-normal">No wallet found</span>
                      )}
                    </p>
                  </div>
                )}

                {selectedCurrency === "BANK_TRANSFER" && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Pay securely via Paystack. You'll be redirected to complete payment after initiating the transaction.</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                {isOwner ? (
                  <>
                    <div className="text-center p-4 rounded-xl bg-muted/50 border border-border mb-2">
                      <p className="text-sm text-muted-foreground">You are the owner of this property. Buyers will be able to purchase and contact you from this page.</p>
                    </div>
                    <Button
                      className="w-full h-12 text-base"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                    >
                      <Settings size={16} /> Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full gradient-cta text-primary-foreground font-semibold hover:opacity-90 h-12 text-base"
                      disabled={initiating}
                      onClick={async () => {
                        if (!user) {
                          navigate("/login");
                          return;
                        }

                        // For crypto payments, check wallet balance first
                        if (selectedCurrency !== "BANK_TRANSFER") {
                          const balance = parseFloat(selectedBalance || "0");
                          const cryptoAmount = convert(priceNgn, "NGN", selectedCurrency);
                          if (!cryptoAmount || balance < cryptoAmount) {
                            toast.error(`Insufficient ${selectedCurrency} balance. You need ≈ ${cryptoAmount?.toFixed(selectedCurrency === "ETH" ? 6 : 2) || "?"} ${selectedCurrency} but have ${balance.toFixed(selectedCurrency === "ETH" ? 6 : 2)}.`, {
                              description: "Please fund your wallet before proceeding.",
                              duration: 5000,
                            });
                            return;
                          }
                        }

                        setInitiating(true);
                        try {
                          const amount = Number(property.priceNGN.replace(/,/g, ""));
                          const sellerId = property.sellerId || "00000000-0000-0000-0000-000000000000";
                          const tx = await TransactionService.create({
                            property_id: property.id.toString(),
                            seller_id: sellerId,
                            amount,
                            currency: selectedCurrency,
                          });
                          toast.success("Transaction initiated!");
                          navigate(`/transaction/${tx.id}`);
                        } catch (err: any) {
                          const msg = err.message || "";
                          if (msg.includes("Active transaction exists") || err.transaction_id) {
                            toast.info("You already have an active transaction for this property. Redirecting...");
                            if (err.transaction_id) {
                              navigate(`/transaction/${err.transaction_id}`);
                            } else {
                              navigate("/dashboard");
                            }
                          } else {
                            toast.error(msg || "Failed to initiate purchase");
                          }
                        } finally {
                          setInitiating(false);
                        }
                      }}
                    >
                      {initiating ? "Initiating..." : selectedCurrency === "BANK_TRANSFER" ? "Pay via Paystack — Initiate Purchase" : `Pay with ${selectedCurrency} — Initiate Purchase`}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base"
                      onClick={() => {
                        if (!user) { navigate("/login"); return; }
                        navigate(`/schedule-inspection?propertyId=${property.id}`);
                      }}
                    >
                      Schedule Inspection
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
