import { LogOut, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  fullName: string | null;
  avatarUrl: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabLabels: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "My Properties",
  transactions: "My Transactions",
  saved: "Saved Properties",
  kyc: "KYC Verification",
  settings: "Settings",
};

const DashboardHeader = ({ fullName, avatarUrl, activeTab, onTabChange }: DashboardHeaderProps) => {
  const { signOut } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const initials = (fullName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-card border-b border-border px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile logo */}
        <Link to="/" className="lg:hidden flex items-center gap-2">
          <span className="text-lg font-display font-bold text-foreground">
            Rial<span className="text-primary">Estate</span>
          </span>
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {Object.entries(tabLabels).map(([id, label]) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
          <Avatar className="h-9 w-9 cursor-pointer" onClick={() => onTabChange("settings")}>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
