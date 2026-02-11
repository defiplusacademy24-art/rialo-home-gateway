import { motion } from "framer-motion";
import heroImage from "@/assets/hero-house.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 gradient-hero opacity-80" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-teal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              Powered by Rialo Blockchain
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-tight">
              Buy, Rent & Book Properties —{" "}
              <span className="text-gradient">Securely Settled</span> with Smart Contracts
            </h1>

            <p className="text-lg text-white/70 max-w-lg">
              Trustless real estate transactions powered by Rialo reactive contracts. No agents. No disputes.
            </p>

            <motion.div
              className="flex flex-wrap gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button className="px-6 py-3 rounded-lg gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-teal/25 hover:scale-105 transition-transform duration-200">
                Explore Properties
              </button>
              <button className="px-6 py-3 rounded-lg border border-white/30 text-primary-foreground font-semibold hover:bg-white/10 transition-colors hover:scale-105 transition-transform duration-200">
                Get Started
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-center relative"
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              <img
                src={heroImage}
                alt="Modern luxury property"
                className="w-full max-w-lg rounded-2xl shadow-2xl shadow-black/40 border border-white/10"
              />
              <motion.div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-xl gradient-cta flex items-center justify-center shadow-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4, type: "spring" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.4, type: "spring" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(172,66%,50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
