import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import testimonialBg from "@/assets/testimonial-bg.jpg";

const testimonials = [
  {
    initials: "AO",
    name: "Ahmed O.",
    role: "Property Investor",
    quote: "RialEstate made buying my first overseas property seamless. The escrow protection gave me total peace of mind — I knew my funds were safe until the deal was done.",
  },
  {
    initials: "SK",
    name: "Sarah K.",
    role: "Landlord",
    quote: "Listing my properties was incredibly easy. The dashboard lets me track everything in real time, and payments arrive instantly through smart contracts.",
  },
  {
    initials: "JM",
    name: "James M.",
    role: "First-time Buyer",
    quote: "I was skeptical about crypto real estate, but RialEstate's verified sellers and transparent process won me over. Bought my dream house in under a week!",
  },
];

const Testimonial = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          What Our Users Are Saying
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center max-w-xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Join thousands who trust RialEstate for secure, blockchain-powered property transactions.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -6 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={16} className="fill-teal text-teal" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-cta flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-xl border border-border"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-64 md:h-auto">
            <img src={testimonialBg} alt="Real estate community" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card p-8 md:p-12 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Buy, rent, or list properties securely. Sign up now and experience hassle-free transactions with Rialo smart contracts.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/signup"
                className="inline-block px-6 py-3 rounded-lg gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-teal/20"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonial;
