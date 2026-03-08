import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, Shield, ArrowRight, Clock, CheckCircle2, RefreshCw, Receipt } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransactionService, PropertyTransaction, TRANSACTION_STATUSES } from "@/services/TransactionService";
import { PROPERTIES } from "@/data/properties";
import { motion } from "framer-motion";

interface DashboardOverviewProps {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string | null;
  createdAt: string;
  kycStatus: string | null;
}

const statusColors: Record<string, string> = {
  PAYMENT_INITIATED: "bg-amber-500/10 text-amber-600 border-amber-200",
  FUNDS_LOCKED: "bg-blue-500/10 text-blue-600 border-blue-200",
  CONTRACT_ACTIVE: "bg-primary/10 text-primary border-primary/20",
  TITLE_VERIFICATION: "bg-purple-500/10 text-purple-600 border-purple-200",
  SETTLEMENT_EXECUTION: "bg-accent/10 text-accent border-accent/20",
  FUNDS_RELEASED: "bg-teal-500/10 text-teal-600 border-teal-200",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

const DashboardOverview = ({ fullName, email, avatarUrl, role, createdAt, kycStatus }: DashboardOverviewProps) => {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
        Welcome Back, {fullName || "User"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold capitalize text-foreground">{role || "Not set"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-accent/10">
              <Receipt className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Transactions</p>
              <p className="font-semibold text-foreground text-lg">{txLoading ? "—" : activeTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-semibold text-foreground text-lg">{txLoading ? "—" : completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active/Ongoing Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Ongoing Transactions</CardTitle>
          {transactions.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard", { state: { tab: "transactions" } })}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No ongoing transactions</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/properties")}>
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTransactions.slice(0, 5).map((tx, i) => {
                const stepIndex = TRANSACTION_STATUSES.indexOf(tx.status as any);
                const progress = Math.max(((stepIndex + 1) / TRANSACTION_STATUSES.length) * 100, 10);
                const property = PROPERTIES.find((p) => p.id === Number(tx.property_id));

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                  >
                    {property?.image && (
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full sm:w-16 h-14 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {property?.title || "Property"}
                        </span>
                        <Badge className={`text-[10px] shrink-0 ${statusColors[tx.status] || ""}`}>
                          {tx.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {tx.contract_id} · {tx.currency === "BANK_TRANSFER" ? "₦" : tx.currency + " "}{Number(tx.amount).toLocaleString()}
                      </p>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-cta rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">{fullName || "Not set"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Member since {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <Badge
                variant={kycStatus === "approved" ? "default" : kycStatus === "pending" ? "secondary" : "outline"}
                className="capitalize"
              >
                KYC: {kycStatus || "Not submitted"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
