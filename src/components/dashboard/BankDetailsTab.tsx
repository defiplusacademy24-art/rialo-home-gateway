import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaystackBank {
  id: number;
  name: string;
  code: string;
  type: string;
  currency: string;
}

const BankDetailsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);

  // Fetch Paystack bank list
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-banks");
        if (error) throw error;
        if (Array.isArray(data)) {
          setBanks(data.sort((a: PaystackBank, b: PaystackBank) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Failed to fetch banks:", err);
        toast.error("Could not load bank list");
      } finally {
        setBanksLoading(false);
      }
    };
    fetchBanks();
  }, []);

  // Fetch existing bank details
  useEffect(() => {
    if (!user) return;
    const fetchDetails = async () => {
      const { data } = await supabase
        .from("bank_details")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setBankCode(data.bank_name); // bank_name column stores bank code
        setAccountName(data.account_name);
        setAccountNumber(data.account_number);
        setHasExisting(true);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [user]);

  const selectedBankName = banks.find((b) => b.code === bankCode)?.name || bankCode;

  const handleSave = async () => {
    if (!user) return;
    if (!bankCode.trim() || !accountName.trim() || !accountNumber.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      if (hasExisting) {
        const { error } = await supabase
          .from("bank_details")
          .update({ bank_name: bankCode, account_name: accountName, account_number: accountNumber })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_details")
          .insert({ user_id: user.id, bank_name: bankCode, account_name: accountName, account_number: accountNumber });
        if (error) throw error;
        setHasExisting(true);
      }
      toast.success("Bank details saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Bank Details</h2>
        <p className="text-sm text-muted-foreground">
          Add your bank account details so buyers can make payments when you list properties.
        </p>
      </div>

      {hasExisting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent"
        >
          <CheckCircle2 size={16} />
          <span>Bank details saved ({selectedBankName}). Buyers will see these when paying via bank transfer.</span>
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">NGN Bank Account</p>
            <p className="text-xs text-muted-foreground">Select your bank and enter account details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank</Label>
            {banksLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground border border-input rounded-md">
                <RefreshCw size={14} className="animate-spin" />
                Loading banks...
              </div>
            ) : (
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {bankCode && (
              <p className="text-xs text-muted-foreground">Bank code: <span className="font-mono text-foreground">{bankCode}</span></p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              placeholder="e.g. John Doe"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="e.g. 0123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              maxLength={10}
            />
          </div>
        </div>

        <Button
          className="w-full gradient-cta text-primary-foreground font-semibold"
          onClick={handleSave}
          disabled={saving || banksLoading}
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {hasExisting ? "Update Bank Details" : "Save Bank Details"}
        </Button>
      </div>
    </div>
  );
};

export default BankDetailsTab;
