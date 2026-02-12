import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

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
          <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Rial<span className="text-primary">Estate</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Explore</a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
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
            <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground">Explore</a>
            <a href="#features" className="block text-sm font-medium text-muted-foreground">Dashboard</a>
            {user ? (
              <button onClick={signOut} className="w-full px-4 py-2 text-sm font-semibold rounded-lg border border-destructive text-destructive">
                Logout
              </button>
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
