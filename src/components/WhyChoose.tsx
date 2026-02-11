import { Shield, UserCheck, Wallet, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

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
    title: "Pay with Crypto & Cards",
    desc: "Easily pay using USDT, Ethereum, or bank cards — straight to Rialo contracts.",
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
        <motion.h2
          className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          Why Choose RialEstate?
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          We offer a host of powerful features designed to make real estate transactions seamless and secure.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-left group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <motion.div
                className="w-12 h-12 rounded-xl gradient-cta flex items-center justify-center mb-4"
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <f.icon size={22} className="text-primary-foreground" />
              </motion.div>
              <h3 className="font-display font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
