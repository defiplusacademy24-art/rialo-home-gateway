import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, LogOut, LayoutDashboard, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Helper to build links to homepage sections from any page
  const sectionLink = (hash: string) => (isHome ? hash : `/${hash}`);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="RialEstate Logo" className="w-9 h-9 object-contain" />
          <span className="text-xl font-display font-bold text-foreground">
            Rial<span className="text-primary">Estate</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!isHome && (
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Home size={15} /> Home
            </Link>
          )}
          <Link to="/properties" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Properties</Link>
          <Link to={sectionLink("#how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          <Link to={sectionLink("#features")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <>
              <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {!isHome && (
              <Link to="/" onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Home size={15} /> Home
              </Link>
            )}
            <Link to="/properties" onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground">Properties</Link>
            <Link to={sectionLink("#how-it-works")} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground">How it Works</Link>
            <Link to={sectionLink("#features")} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground">Features</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 w-full px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground text-center">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={signOut} className="w-full px-4 py-2 text-sm font-semibold rounded-lg border border-destructive text-destructive">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block w-full px-4 py-2 text-sm font-semibold rounded-lg border border-primary text-primary text-center">Login</Link>
                <Link to="/signup" className="block w-full px-4 py-2 text-sm font-semibold rounded-lg gradient-cta text-primary-foreground text-center">Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
