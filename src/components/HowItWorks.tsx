import { ArrowRight } from "lucide-react";
import landImg from "@/assets/land.jpg";
import houseImg from "@/assets/house.jpg";
import hotelImg from "@/assets/hotel.jpg";

const categories = [
  { title: "Lands", image: landImg },
  { title: "Houses", image: houseImg },
  { title: "Hotels", image: hotelImg },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">How It Works</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-12">
          Seamless & trustless real estate transactions powered by Rialo reactive contracts
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div key={cat.title} className="group rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="h-52 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-display font-bold text-foreground">{cat.title}</h3>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-cta text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Explore <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
