import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransactionService, PropertyTransaction, TRANSACTION_STATUSES } from "@/services/TransactionService";
import { PROPERTIES } from "@/data/properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  PAYMENT_INITIATED: "bg-amber-500/10 text-amber-600 border-amber-200",
  FUNDS_LOCKED: "bg-blue-500/10 text-blue-600 border-blue-200",
  CONTRACT_ACTIVE: "bg-primary/10 text-primary border-primary/20",
  TITLE_VERIFICATION: "bg-purple-500/10 text-purple-600 border-purple-200",
  SETTLEMENT_EXECUTION: "bg-accent/10 text-accent border-accent/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const MyTransactionsTab = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const data = await TransactionService.list();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">My Transactions</h2>
          <p className="text-sm text-muted-foreground">Track your property purchase transactions.</p>
        </div>
        <Badge variant="secondary">{transactions.length} total</Badge>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground mb-2">No Transactions Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Initiate a purchase from any property listing to start a reactive transaction.
          </p>
          <Button variant="outline" onClick={() => navigate("/properties")}>
            Browse Properties
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx, i) => {
            const stepIndex = TRANSACTION_STATUSES.indexOf(tx.status as any);
            const progress = ((stepIndex + 1) / TRANSACTION_STATUSES.length) * 100;
            const property = PROPERTIES.find((p) => p.id === Number(tx.property_id));

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/transaction/${tx.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {property?.image && (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full md:w-24 h-20 object-cover rounded-xl"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-foreground truncate">
                        {property?.title || "Property"}
                      </h3>
                      <Badge className={`text-[10px] ${statusColors[tx.status] || ""}`}>
                        {tx.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Contract: {tx.contract_id} · {tx.currency} {Number(tx.amount).toLocaleString()}
                    </p>
                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-cta rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {tx.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTransactionsTab;
