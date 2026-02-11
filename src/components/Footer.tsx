import { Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const columns = [
    { title: "Company", links: ["About Us", "Careers", "Blog"] },
    { title: "Support", links: ["FAQs", "Help Center", "Contact"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Disclaimer"] },
  ];

  return (
    <footer className="gradient-footer text-white/80 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-white">
                Rial<span className="text-teal">Estate</span>
              </span>
            </div>
            <p className="text-sm text-white/60 max-w-xs leading-relaxed">
              Empowering trustless real estate transactions on the Rialo blockchain. Modern. Premium. Secure. Global-ready.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-teal transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2026 RialEstate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-teal transition-colors"><Twitter size={18} /></a>
            <a href="#" className="text-white/40 hover:text-teal transition-colors"><Linkedin size={18} /></a>
            <a href="#" className="text-white/40 hover:text-teal transition-colors"><Instagram size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
