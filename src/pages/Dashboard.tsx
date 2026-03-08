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
import BankDetailsTab from "@/components/dashboard/BankDetailsTab";
import CurrencyConverterTab from "@/components/dashboard/CurrencyConverterTab";
import ChatList from "@/pages/ChatList";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !user) return null;

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
        return <ListPropertyTab onPropertyCreated={fetchData} />;
      case "my-listings":
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
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
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
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
