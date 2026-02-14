import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import landImg from "@/assets/land.jpg";
import houseImg from "@/assets/house.jpg";
import hotelImg from "@/assets/hotel.jpg";

const categories = [
  { title: "Lands", image: landImg, type: "Land" },
  { title: "Houses", image: houseImg, type: "House" },
  { title: "Hotels", image: hotelImg, type: "Hotel" },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          How It Works
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Seamless & trustless real estate transactions powered by Rialo reactive contracts
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              className="group rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <div className="h-52 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-display font-bold text-foreground">{cat.title}</h3>
                <Link to={`/properties?type=${cat.type}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
