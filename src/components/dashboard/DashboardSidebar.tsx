import {
  LayoutDashboard, Home, Receipt, Bookmark, Settings, ShieldCheck,
  ArrowLeft, Building2, Wallet, Landmark, ArrowRightLeft,
  MessageCircle, Coins, CalendarDays, Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSeller: boolean;
}

const menuGroups = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, sellerOnly: false },
    ],
  },
  {
    label: "Property",
    items: [
      { id: "list-property", label: "List Property", icon: Home, sellerOnly: true },
      { id: "my-listings", label: "My Listings", icon: Building2, sellerOnly: true },
      { id: "inspections", label: "Inspections", icon: CalendarDays, sellerOnly: false },
      { id: "saved", label: "Saved", icon: Bookmark, sellerOnly: false },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "wallet", label: "Wallet", icon: Wallet, sellerOnly: false },
      { id: "transactions", label: "Transactions", icon: Receipt, sellerOnly: false },
      { id: "my-assets", label: "My Assets", icon: Coins, sellerOnly: false },
      { id: "bank-details", label: "Bank Details", icon: Landmark, sellerOnly: false },
      { id: "converter", label: "Converter", icon: ArrowRightLeft, sellerOnly: false },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "messages", label: "Messages", icon: MessageCircle, sellerOnly: false },
      { id: "kyc", label: "KYC", icon: ShieldCheck, sellerOnly: false },
      { id: "settings", label: "Settings", icon: Settings, sellerOnly: false },
    ],
  },
];

// Flat list for mobile nav (first 8 most important)
const mobileItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, sellerOnly: false },
  { id: "list-property", label: "List", icon: Home, sellerOnly: true },
  { id: "my-listings", label: "Listings", icon: Building2, sellerOnly: true },
  { id: "wallet", label: "Wallet", icon: Wallet, sellerOnly: false },
  { id: "transactions", label: "Txns", icon: Receipt, sellerOnly: false },
  { id: "messages", label: "Messages", icon: MessageCircle, sellerOnly: false },
  { id: "kyc", label: "KYC", icon: ShieldCheck, sellerOnly: false },
  { id: "settings", label: "Settings", icon: Settings, sellerOnly: false },
];

const DashboardSidebar = ({ activeTab, onTabChange, isSeller }: DashboardSidebarProps) => {
  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen gradient-hero text-primary-foreground shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <img src={logo} alt="RialEstate" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight">
            Rial<span className="text-accent">Estate</span>
          </span>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const locked = item.sellerOnly && !isSeller;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-white/20 text-white shadow-sm"
                          : "text-white/65 hover:bg-white/10 hover:text-white",
                        locked && "opacity-60"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {locked && <Lock className="w-3 h-3 text-white/40 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer links */}
        <div className="px-3 pb-5 mt-auto border-t border-white/10 pt-4 space-y-0.5">
          <Link
            to="/properties"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all"
          >
            <Building2 className="w-4 h-4" />
            Browse Properties
          </Link>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border overflow-x-auto">
        <div className="flex min-w-max px-1 py-1.5">
          {mobileItems.map((item) => {
            const locked = item.sellerOnly && !isSeller;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-1.5 text-[10px] font-medium transition-colors shrink-0 rounded-xl",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
                <item.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{item.label}</span>
                {locked && <Lock className="absolute top-1 right-1.5 w-2.5 h-2.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default DashboardSidebar;
