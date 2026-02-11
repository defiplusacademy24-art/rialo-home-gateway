import { Shield, UserCheck, Wallet, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Escrow Protected",
    desc: "Funds securely locked in smart contracts until all conditions are met.",
  },
  {
    icon: UserCheck,
    title: "Verified Sellers",
    desc: "Listings managed by reputable, authenticated property sellers.",
  },
  {
    icon: Wallet,
    title: "Pay with Crypto",
    desc: "Easily pay using USBT or Ethereum, straight to Rialo contracts.",
  },
  {
    icon: LayoutDashboard,
    title: "Detailed Dashboard",
    desc: "Track listings, transactions, and earnings with ease.",
  },
];

const WhyChoose = () => {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Why Choose RialEstate?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          We offer a host of powerful features designed to make real estate transactions seamless and secure.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-left group">
              <div className="w-12 h-12 rounded-xl gradient-cta flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon size={22} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
