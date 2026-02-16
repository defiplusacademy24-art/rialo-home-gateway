import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

interface KycTabProps {
  kycStatus: string | null;
  onKycUpdate: () => void;
}

const KycTab = ({ kycStatus, onKycUpdate }: KycTabProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_legal_name: "",
    date_of_birth: "",
    id_type: "",
    id_number: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const { full_legal_name, date_of_birth, id_type, id_number, address, city, state, country } = form;

    if (!full_legal_name || !date_of_birth || !id_type || !id_number || !address || !city || !state || !country) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("kyc_submissions").upsert(
        {
          user_id: user.id,
          full_legal_name,
          date_of_birth,
          id_type,
          id_number,
          address,
          city,
          state,
          country,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      toast({ title: "KYC submitted!", description: "Your verification is being reviewed." });
      onKycUpdate();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", label: "Pending Review" },
    approved: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", label: "Verified" },
    rejected: { icon: XCircle, color: "text-destructive", bg: "bg-red-50 dark:bg-red-900/20", label: "Rejected" },
  };

  if (kycStatus && kycStatus !== "rejected") {
    const config = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">KYC Verification</h1>
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-4 p-6 rounded-lg ${config.bg}`}>
              <StatusIcon className={`w-10 h-10 ${config.color}`} />
              <div>
                <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
                <p className="text-sm text-muted-foreground">
                  {kycStatus === "approved"
                    ? "Your identity has been verified. You can now transact as a verified buyer/seller."
                    : "Your KYC submission is being reviewed. This usually takes 1-3 business days."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">KYC Verification</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Verify Your Identity</CardTitle>
              <CardDescription>
                Complete KYC to become a verified buyer or seller on the platform.
              </CardDescription>
            </div>
          </div>
          {kycStatus === "rejected" && (
            <Badge variant="destructive" className="w-fit mt-2">Previously rejected — please resubmit</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Legal Name</Label>
              <Input
                value={form.full_legal_name}
                onChange={(e) => handleChange("full_legal_name", e.target.value)}
                placeholder="As it appears on your ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select value={form.id_type} onValueChange={(v) => handleChange("id_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={form.id_number}
                onChange={(e) => handleChange("id_number", e.target.value)}
                placeholder="ID number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="State" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => handleChange("country", e.target.value)} placeholder="Country" />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full md:w-auto">
            {submitting ? "Submitting..." : "Submit KYC"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycTab;
