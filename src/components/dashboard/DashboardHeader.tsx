import { LogOut, Moon, Sun, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";

interface DashboardHeaderProps {
  fullName: string | null;
  avatarUrl: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "list-property": "List Property",
  "my-listings": "My Listings",
  wallet: "Wallet",
  transactions: "My Transactions",
  "my-assets": "My Assets",
  "bank-details": "Bank Details",
  converter: "Converter",
  messages: "Messages",
  inspections: "Inspections",
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

  const currentLabel = tabLabels[activeTab] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">

        {/* Breadcrumb / page title */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile logo */}
          <span className="lg:hidden text-base font-display font-bold text-foreground shrink-0">
            Rial<span className="text-primary">Estate</span>
          </span>

          {/* Desktop breadcrumb */}
          <div className="hidden lg:flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Dashboard</span>
            {activeTab !== "dashboard" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="font-semibold text-foreground">{currentLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <NotificationBell />

          {/* Theme toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Logout"
          >
            <LogOut size={17} />
          </button>

          {/* Avatar → settings */}
          <button
            onClick={() => onTabChange("settings")}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl hover:bg-muted transition-all group"
          >
            <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-primary/40 transition-all">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {fullName || "Account"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
