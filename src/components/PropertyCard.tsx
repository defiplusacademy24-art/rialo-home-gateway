import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Star, Bed, Bath, Maximize, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  id: number;
  image: string;
  title: string;
  location: string;
  priceNGN: string;
  priceUSD: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  seller: { name: string; initials: string; rating: number; transactions: number; verified: boolean };
  type: string;
}

const PropertyCard = ({ id, image, title, location, priceNGN, priceUSD, bedrooms, bathrooms, sqft, seller, type }: PropertyCardProps) => {
  return (
    <motion.div
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs">
          {type}
        </Badge>
        <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border">
          <Maximize size={14} className="text-foreground" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-foreground text-lg mb-1">{title}</h3>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <MapPin size={14} />
          <span>{location}</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-display font-bold text-foreground text-lg">₦{priceNGN}</span>
          <span className="text-muted-foreground text-sm">USDT ${priceUSD}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-muted-foreground text-xs mb-4">
          {bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={14} /> {bedrooms} {type === "Hotel" ? "Rooms" : "Beds"}</span>}
          {bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={14} /> {bathrooms} Baths</span>}
          <span className="flex items-center gap-1"><Maximize size={14} /> {sqft.toLocaleString()} sqft</span>
        </div>

        {/* Payment badges & CTA */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full border border-border text-xs font-medium text-foreground flex items-center gap-1.5">
            💰 USDT
          </span>
          <span className="px-3 py-1 rounded-full border border-border text-xs font-medium text-foreground flex items-center gap-1.5">
            🔷 ETH
          </span>
          <Link to={`/property/${id}`} className="ml-auto px-4 py-1.5 rounded-lg gradient-cta text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            View Details
          </Link>
        </div>

        {/* Escrow note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4">
          <ShieldCheck size={16} className="text-accent shrink-0" />
          <span>Funds locked in Rialo smart contract until all conditions are met.</span>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full gradient-cta flex items-center justify-center text-primary-foreground font-bold text-xs">
              {seller.initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{seller.name}</span>
                {seller.verified && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Verified Seller</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className={i < seller.rating ? "fill-accent text-accent" : "text-muted-foreground"} />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">• {seller.transactions} transactions</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <MessageCircle size={12} /> Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
