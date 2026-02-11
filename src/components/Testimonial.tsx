import testimonialBg from "@/assets/testimonial-bg.jpg";

const Testimonial = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-xl border border-border">
          {/* Image side */}
          <div className="h-64 md:h-auto">
            <img src={testimonialBg} alt="Real estate community" className="w-full h-full object-cover" />
          </div>

          {/* Content side */}
          <div className="bg-card p-8 md:p-12 flex flex-col justify-center">
            <div className="text-5xl text-teal font-display mb-4">"</div>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              What Our Users Are Saying
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Ready to buy, rent, or list properties securely? Sign up now and experience hassle-free transactions with Rialo smart contracts.
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full gradient-cta flex items-center justify-center text-primary-foreground font-bold text-sm">
                AO
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Ahmed O.</p>
                <p className="text-xs text-teal flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal" />
                  Verified User
                </p>
              </div>
            </div>

            <button className="self-start px-6 py-3 rounded-lg gradient-cta text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-teal/20">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
