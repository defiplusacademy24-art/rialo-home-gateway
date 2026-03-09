import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User, Mail, Calendar, Shield, ArrowRight, Clock,
  CheckCircle2, RefreshCw, Receipt, Building2, TrendingUp, Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransactionService, PropertyTransaction, TRANSACTION_STATUSES } from "@/services/TransactionService";
import { PROPERTIES } from "@/data/properties";
import { motion } from "framer-motion";

interface DashboardOverviewProps {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  roles: string[];
  createdAt: string;
  kycStatus: string | null;
}

const statusColors: Record<string, string> = {
  PAYMENT_INITIATED: "bg-amber-500/10 text-amber-600 border-amber-200",
  FUNDS_LOCKED: "bg-blue-500/10 text-blue-600 border-blue-200",
  CONTRACT_ACTIVE: "bg-primary/10 text-primary border-primary/20",
  TITLE_VERIFICATION: "bg-purple-500/10 text-purple-600 border-purple-200",
  SETTLEMENT_EXECUTION: "bg-accent/10 text-accent border-accent/20",
  FUNDS_RELEASED: "bg-teal/10 text-teal border-teal/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

const kycBadgeStyle: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const DashboardOverview = ({ fullName, email, avatarUrl, roles, createdAt, kycStatus }: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const initials = (fullName || email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await TransactionService.list();
        setTransactions(data);
      } catch { /* silent */ }
      setTxLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeTransactions = transactions.filter(
    (tx) => !["COMPLETED", "CANCELLED"].includes(tx.status)
  );
  const completedCount = transactions.filter((tx) => tx.status === "COMPLETED").length;
  const memberSince = new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Hero banner ─────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl gradient-hero px-6 py-8 text-primary-foreground"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar className="h-16 w-16 ring-4 ring-white/20 shrink-0">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xl font-bold bg-white/20 text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-display font-bold truncate">
                Welcome back, {fullName || "User"} 👋
              </h1>
              {roles.map((r) => (
                <Badge key={r} className="bg-white/15 text-primary-foreground border-white/20 capitalize text-xs">
                  {r}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-white/70">Member since {memberSince}</p>
          </div>

          <Button
            onClick={() => navigate("/properties")}
            className="shrink-0 bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/20 backdrop-blur-sm font-semibold transition-all"
          >
            <Sparkles className="w-4 h-4 mr-1.5" /> Explore Properties
          </Button>
        </div>

        {/* KYC status strip */}
        {kycStatus && (
          <div className="relative mt-5 pt-5 border-t border-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/70">KYC Status:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
              kycStatus === "approved"
                ? "bg-emerald-400/20 text-emerald-300"
                : kycStatus === "pending"
                ? "bg-amber-400/20 text-amber-300"
                : "bg-destructive/20 text-red-300"
            }`}>
              {kycStatus}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Your Role",
            value: roles.length > 0 ? roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(" & ") : "Not set",
            icon: Shield,
            iconClass: "text-primary",
            bgClass: "bg-primary/10",
          },
          {
            label: "Active Transactions",
            value: txLoading ? "—" : String(activeTransactions.length),
            icon: TrendingUp,
            iconClass: "text-accent",
            bgClass: "bg-accent/10",
          },
          {
            label: "Completed Deals",
            value: txLoading ? "—" : String(completedCount),
            icon: CheckCircle2,
            iconClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgClass} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.iconClass}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.label}</p>
                <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Ongoing Transactions ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5">
            <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              Ongoing Transactions
            </CardTitle>
            {transactions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/dashboard", { state: { tab: "transactions" } })}
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="pb-5">
            {txLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeTransactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No ongoing transactions</p>
                <p className="text-xs text-muted-foreground mb-4">Start exploring properties to initiate a deal.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/properties")}>
                  Browse Properties
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTransactions.slice(0, 5).map((tx, i) => {
                  const stepIndex = TRANSACTION_STATUSES.indexOf(tx.status as any);
                  const progress = Math.max(((stepIndex + 1) / TRANSACTION_STATUSES.length) * 100, 8);
                  const property = PROPERTIES.find((p) => p.id === Number(tx.property_id));

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all cursor-pointer"
                      onClick={() => navigate(`/transaction/${tx.id}`)}
                    >
                      {property?.image && (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full sm:w-16 h-12 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {property?.title || "Property"}
                          </span>
                          <Badge
                            className={`text-[10px] shrink-0 px-1.5 py-0 border ${statusColors[tx.status] || ""}`}
                          >
                            {tx.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {tx.contract_id} · {tx.currency === "BANK_TRANSFER" ? "₦" : tx.currency + " "}
                          {Number(tx.amount).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Profile Info ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-border shrink-0">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 flex-1">
                {[
                  { icon: User, label: "Name", value: fullName || "Not set" },
                  { icon: Mail, label: "Email", value: email },
                  { icon: Calendar, label: "Member Since", value: memberSince },
                  {
                    icon: Shield, label: "KYC Status",
                    value: kycStatus || "Not submitted",
                    badge: true,
                  },
                ].map(({ icon: Icon, label, value, badge }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center mt-0.5 shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                      {badge ? (
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border capitalize mt-0.5 ${kycBadgeStyle[kycStatus || ""] || "bg-muted text-muted-foreground border-border"}`}>
                          {value}
                        </span>
                      ) : (
                        <p className="text-sm font-medium text-foreground truncate">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardOverview;
