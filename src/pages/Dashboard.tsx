import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import SettingsTab from "@/components/dashboard/SettingsTab";
import KycTab from "@/components/dashboard/KycTab";
import PlaceholderTab from "@/components/dashboard/PlaceholderTab";
import MyTransactionsTab from "@/components/dashboard/MyTransactionsTab";
import ListPropertyTab from "@/components/dashboard/ListPropertyTab";
import MyListingsTab from "@/components/dashboard/MyListingsTab";
import WalletTab from "@/components/dashboard/WalletTab";
import MyAssetsTab from "@/components/dashboard/MyAssetsTab";
import MyInspectionsTab from "@/components/dashboard/MyInspectionsTab";
import BankDetailsTab from "@/components/dashboard/BankDetailsTab";
import CurrencyConverterTab from "@/components/dashboard/CurrencyConverterTab";
import ChatList from "@/pages/ChatList";
import { motion } from "framer-motion";
import { ShieldX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Seller-role gate screen ────────────────────────────────────────────────
const SellerRoleRequired = ({ onGoToSettings }: { onGoToSettings: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
  >
    <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
      <ShieldX className="w-10 h-10 text-destructive" />
    </div>
    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
      Seller Role Required
    </h2>
    <p className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed">
      You're currently registered as a <strong>Buyer</strong>. To list or manage properties, you need to upgrade your account to include the <strong>Seller</strong> role.
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button onClick={onGoToSettings} className="gradient-cta text-primary-foreground font-semibold">
        Update Role in Settings <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
      <Button variant="outline" onClick={onGoToSettings}>
        Go to Settings
      </Button>
    </div>
    <p className="text-xs text-muted-foreground mt-4">
      You can change your role anytime from the <strong>Settings</strong> tab.
    </p>
  </motion.div>
);

// ── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [profileRes, roleRes, kycRes] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("kyc_submissions").select("status").eq("user_id", user.id).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (roleRes.data) setRole(roleRes.data.role);
    if (kycRes.data) setKycStatus(kycRes.data.status);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !user) return null;

  // A user is a seller if their role is "seller" or "both"
  const isSeller = role === "seller" || role === "both";

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            fullName={profile?.full_name || null}
            email={user.email || ""}
            avatarUrl={profile?.avatar_url || null}
            role={role}
            createdAt={user.created_at}
            kycStatus={kycStatus}
          />
        );
      case "list-property":
        if (!isSeller) return <SellerRoleRequired onGoToSettings={() => setActiveTab("settings")} />;
        return <ListPropertyTab onPropertyCreated={fetchData} />;
      case "my-listings":
        if (!isSeller) return <SellerRoleRequired onGoToSettings={() => setActiveTab("settings")} />;
        return <MyListingsTab />;
      case "wallet":
        return <WalletTab />;
      case "transactions":
        return <MyTransactionsTab />;
      case "my-assets":
        return <MyAssetsTab />;
      case "bank-details":
        return <BankDetailsTab />;
      case "converter":
        return <CurrencyConverterTab />;
      case "messages":
        return <ChatList />;
      case "inspections":
        return <MyInspectionsTab />;
      case "saved":
        return <PlaceholderTab title="Saved Properties" description="Properties you've bookmarked will appear here." />;
      case "kyc":
        return <KycTab kycStatus={kycStatus} onKycUpdate={fetchData} />;
      case "settings":
        return (
          <SettingsTab
            fullName={profile?.full_name || null}
            avatarUrl={profile?.avatar_url || null}
            onProfileUpdate={fetchData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} isSeller={isSeller} />
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader
          fullName={profile?.full_name || null}
          avatarUrl={profile?.avatar_url || null}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
