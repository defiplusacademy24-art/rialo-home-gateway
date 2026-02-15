import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, ArrowLeft } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { PROPERTIES } from "@/data/properties";

const LOCATIONS = ["All Locations", "Lagos", "Abuja", "Ibadan"];
const TYPES = ["All Types", "House", "Apartment", "Villa", "Townhouse", "Land", "Hotel"];
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under ₦100M", min: 0, max: 100_000_000 },
  { label: "₦100M – ₦300M", min: 100_000_000, max: 300_000_000 },
  { label: "₦300M – ₦500M", min: 300_000_000, max: 500_000_000 },
  { label: "Above ₦500M", min: 500_000_000, max: Infinity },
];

const parsePrice = (p: string) => Number(p.replace(/,/g, ""));

const Properties = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [type, setType] = useState("All Types");
  const [priceIdx, setPriceIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && TYPES.includes(typeParam)) {
      setType(typeParam);
      setShowFilters(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceIdx];
    return PROPERTIES.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
      const matchLocation = location === "All Locations" || p.location.includes(location);
      const matchType = type === "All Types" || p.type === type;
      const price = parsePrice(p.priceNGN);
      const matchPrice = price >= range.min && price <= range.max;
      return matchSearch && matchLocation && matchType && matchPrice;
    });
  }, [search, location, type, priceIdx]);

  const activeFilters = (location !== "All Locations" ? 1 : 0) + (type !== "All Types" ? 1 : 0) + (priceIdx !== 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm font-medium mb-4 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <motion.h1
              className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Property Listings
            </motion.h1>
            <motion.p
              className="text-primary-foreground/70 mb-6 max-w-lg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Browse verified properties with secure escrow-protected transactions.
            </motion.p>

            {/* Search bar */}
            <motion.div
              className="flex items-center gap-3 max-w-2xl"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or location..."
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative p-3 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors"
              >
                <SlidersHorizontal size={18} />
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-cta text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        {showFilters && (
          <motion.div
            className="border-b border-border bg-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="container mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Property Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Price Range</label>
                <select
                  value={priceIdx}
                  onChange={(e) => setPriceIdx(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {PRICE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setLocation("All Locations"); setType("All Types"); setPriceIdx(0); }}
                  className="self-end flex items-center gap-1 text-xs text-destructive hover:underline py-2"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results */}
        <section className="container mx-auto px-4 py-10">
          <p className="text-sm text-muted-foreground mb-6">{filtered.length} propert{filtered.length === 1 ? "y" : "ies"} found</p>
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <PropertyCard key={p.id} {...p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No properties match your filters.</p>
              <button
                onClick={() => { setSearch(""); setLocation("All Locations"); setType("All Types"); setPriceIdx(0); }}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Properties;
