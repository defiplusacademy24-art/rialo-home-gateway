import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Rial<span className="text-primary">Estate</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Explore</a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            Login
          </button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground hover:opacity-90 transition-opacity">
            Get Started
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3 animate-fade-in">
          <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground">Explore</a>
          <a href="#features" className="block text-sm font-medium text-muted-foreground">Dashboard</a>
          <button className="w-full px-4 py-2 text-sm font-semibold rounded-lg border border-primary text-primary">Login</button>
          <button className="w-full px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground">Get Started</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
