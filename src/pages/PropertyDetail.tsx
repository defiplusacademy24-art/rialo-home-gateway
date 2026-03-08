import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Star, Bed, Bath, Maximize, MessageCircle, ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USDTIcon, ETHIcon, USDCIcon } from "@/components/CryptoIcons";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionService } from "@/services/TransactionService";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PROPERTIES } from "@/data/properties";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initiating, setInitiating] = useState(false);
  const property = PROPERTIES.find((p) => p.id === Number(id));

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

                <div className="flex flex-wrap items-baseline gap-4 mb-6">
                  <span className="text-2xl font-display font-bold text-foreground">₦{property.priceNGN}</span>
                  <span className="text-muted-foreground">USDT ${property.priceUSD}</span>
                </div>

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
                <Button className="w-full gradient-cta text-primary-foreground font-semibold hover:opacity-90">
                  <MessageCircle size={16} /> Contact Seller
                </Button>
              </div>

              {/* Payment methods */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Accepted Payment</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground flex items-center gap-1.5"><USDTIcon size={18} /> USDT</span>
                  <span className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground flex items-center gap-1.5"><USDCIcon size={18} /> USDC</span>
                  <span className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground flex items-center gap-1.5"><ETHIcon size={18} /> ETH</span>
                  <span className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground">🏦 Bank Transfer</span>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <Button
                  className="w-full gradient-cta text-primary-foreground font-semibold hover:opacity-90 h-12 text-base"
                  disabled={initiating}
                  onClick={async () => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    setInitiating(true);
                    try {
                      // Parse price as number
                      const amount = Number(property.priceNGN.replace(/,/g, ""));
                      const tx = await TransactionService.create({
                        property_id: property.id.toString(),
                        seller_id: "00000000-0000-0000-0000-000000000000", // mock seller
                        amount,
                        currency: "USDT",
                      });
                      toast.success("Transaction initiated!");
                      navigate(`/transaction/${tx.id}`);
                    } catch (err: any) {
                      if (err.message?.includes("Active transaction exists")) {
                        toast.info("You already have an active transaction for this property");
                      } else {
                        toast.error(err.message || "Failed to initiate purchase");
                      }
                    } finally {
                      setInitiating(false);
                    }
                  }}
                >
                  {initiating ? "Initiating..." : "Initiate Purchase"}
                </Button>
                <Button variant="outline" className="w-full h-12 text-base">
                  Schedule Inspection
                </Button>
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
