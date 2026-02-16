import { LayoutDashboard, Home, Receipt, Bookmark, Settings, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "My Properties", icon: Home },
  { id: "transactions", label: "My Transactions", icon: Receipt },
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
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
              activeTab === item.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-[60px]">{item.label.split(" ").pop()}</span>
          </button>
        ))}
        <button
          onClick={() => onTabChange("settings")}
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
            activeTab === "settings" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
};

export default DashboardSidebar;
