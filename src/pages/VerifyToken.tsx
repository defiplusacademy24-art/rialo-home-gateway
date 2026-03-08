import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, MapPin, Copy, CheckCircle2, Home, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface TokenData {
  id: string;
  token_id: string;
  property_id: string;
  owner_wallet: string;
  owner_user_id: string;
  minted_by: string;
  metadata: any;
  minted_at: string;
  transferred_at: string | null;
  created_at: string;
}

const VerifyToken = () => {
  const { tokenId } = useParams();
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [minterName, setMinterName] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (!tokenId) return;
      const { data, error } = await supabase
        .from("property_tokens")
        .select("*")
        .eq("token_id", tokenId)
        .maybeSingle();

      if (!error && data) {
        setToken(data as TokenData);

        // Fetch owner and minter names in parallel
        const [ownerRes, minterRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", data.owner_user_id).maybeSingle(),
          data.minted_by !== data.owner_user_id
            ? supabase.from("profiles").select("full_name").eq("user_id", data.minted_by).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (ownerRes.data?.full_name) setOwnerName(ownerRes.data.full_name);
        if (minterRes.data?.full_name) setMinterName(minterRes.data.full_name);
      }
      setLoading(false);
    };
    fetchToken();
  }, [tokenId]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 container mx-auto px-4 text-center">
          <ShieldCheck className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Token Not Found</h1>
          <p className="text-muted-foreground mb-6">
            No property token with ID <span className="font-mono font-bold">{tokenId}</span> exists on the Rialo blockchain.
          </p>
          <Link to="/"><Button>Go Home</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = token.metadata || {};
  const wasTransferred = !!token.transferred_at;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 container mx-auto px-4 max-w-2xl">
        {/* Verification header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Verified on Rialo Blockchain</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            On-Chain Ownership Record
          </h1>
          <p className="text-muted-foreground mt-2">
            This is the immutable digital deed for the property below.
          </p>
        </div>

        <Card className="border-primary/20 overflow-hidden">
          {/* Property image */}
          {meta.images?.[0] && (
            <div className="h-48 md:h-56 overflow-hidden">
              <img src={meta.images[0]} alt={meta.title} className="w-full h-full object-cover" />
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{meta.title || "Property Token"}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[meta.city, meta.state, meta.country].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
              <Badge variant={wasTransferred ? "default" : "secondary"}>
                {wasTransferred ? "Transferred" : "Original Mint"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Token ID */}
            <InfoRow
              label="Token ID"
              value={token.token_id}
              mono bold primary
              onCopy={() => copyText(token.token_id)}
            />

            {/* Owner wallet */}
            <InfoRow
              label="Current Owner Wallet"
              value={token.owner_wallet}
              mono truncate
              onCopy={() => copyText(token.owner_wallet)}
            />

            {/* Owner name */}
            {ownerName && (
              <InfoRow label="Current Owner" value={ownerName} />
            )}

            {/* Minter */}
            {wasTransferred && minterName && (
              <InfoRow label="Originally Minted By" value={minterName} />
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailCell label="Property Type" value={meta.property_type} />
              <DetailCell label="Price" value={
                `${meta.currency === "NGN" ? "₦" : ""}${Number(meta.price || 0).toLocaleString()} ${meta.currency !== "NGN" ? meta.currency : ""}`
              } />
              <DetailCell label="Bedrooms" value={meta.bedrooms} />
              <DetailCell label="Bathrooms" value={meta.bathrooms} />
              <DetailCell label="Area (sqft)" value={meta.area_sqft?.toLocaleString()} />
              <DetailCell label="Minted" value={new Date(token.minted_at).toLocaleDateString()} />
              {wasTransferred && (
                <DetailCell label="Transferred" value={new Date(token.transferred_at!).toLocaleDateString()} />
              )}
            </div>

            {/* Documents */}
            {meta.documents?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Attached Documents</p>
                <div className="space-y-1">
                  {meta.documents.map((doc: string, i: number) => (
                    <a
                      key={i}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain stamp */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Immutable Record</p>
                <p className="text-xs text-muted-foreground">
                  This ownership record is permanently stored on the Rialo blockchain and cannot be altered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

/* Helper components */
function InfoRow({ label, value, mono, bold, primary, truncate: trunc, onCopy }: {
  label: string; value: string; mono?: boolean; bold?: boolean; primary?: boolean; truncate?: boolean; onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border gap-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-sm ${mono ? "font-mono" : ""} ${bold ? "font-bold" : ""} ${primary ? "text-primary" : "text-foreground"} ${trunc ? "truncate" : ""}`}>
          {value}
        </p>
      </div>
      {onCopy && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCopy}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value || "N/A"}</p>
    </div>
  );
}

export default VerifyToken;
