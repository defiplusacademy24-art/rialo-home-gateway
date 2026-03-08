import { LayoutDashboard, Home, Receipt, Bookmark, Settings, ShieldCheck, ArrowLeft, Building2, Wallet, Landmark, ArrowRightLeft, MessageCircle, Coins, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "list-property", label: "List Property", icon: Home },
  { id: "my-listings", label: "My Listings", icon: Building2 },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "transactions", label: "My Transactions", icon: Receipt },
  { id: "my-assets", label: "My Assets", icon: Coins },
  { id: "bank-details", label: "Bank Details", icon: Landmark },
  { id: "converter", label: "Converter", icon: ArrowRightLeft },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "inspections", label: "Inspections", icon: CalendarDays },
  { id: "saved", label: "Saved Properties", icon: Bookmark },
  { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Settings },
];

const DashboardSidebar = ({ activeTab, onTabChange }: DashboardSidebarProps) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen gradient-hero text-primary-foreground">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <img src={logo} alt="RialEstate" className="w-8 h-8 object-contain" />
          <span className="text-lg font-display font-bold">
            Rial<span className="text-accent">Estate</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-white/15 text-primary-foreground"
                  : "text-white/70 hover:bg-white/10 hover:text-primary-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4 mt-auto space-y-1">
          <Link
            to="/properties"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-primary-foreground transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Properties
          </Link>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border overflow-x-auto">
        <div className="flex min-w-max px-1 py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors shrink-0",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="whitespace-nowrap">{item.label.split(" ").pop()}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default DashboardSidebar;
