import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Copy, CheckCircle2, Shield, MapPin, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PropertyToken {
  id: string;
  token_id: string;
  property_id: string;
  owner_wallet: string;
  owner_user_id: string;
  minted_by: string;
  metadata: any;
  minted_at: string;
  transferred_at: string | null;
}

const MyAssetsTab = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<PropertyToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTokens = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_tokens")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setTokens(data as PropertyToken[]);
      setLoading(false);
    };
    fetchTokens();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Assets</h1>
        <p className="text-muted-foreground mt-1">
          Property tokens (NFTs) you own on the Rialo blockchain.
        </p>
      </div>

      {tokens.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Coins className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-foreground">No tokens yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When you purchase a property, the digital deed (NFT) will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tokens.map((token) => {
            const meta = token.metadata || {};
            const isMinter = token.minted_by === user?.id;
            const wasTransferred = !!token.transferred_at;

            return (
              <Card key={token.id} className="overflow-hidden border-primary/20">
                {/* Token image */}
                {meta.images?.[0] && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={meta.images[0]}
                      alt={meta.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{meta.title || "Property Token"}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {[meta.city, meta.state, meta.country].filter(Boolean).join(", ") || "N/A"}
                      </CardDescription>
                    </div>
                    <Badge variant={wasTransferred ? "default" : "secondary"} className="shrink-0">
                      {wasTransferred ? "Acquired" : isMinter ? "Minted" : "Owned"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Token ID */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Token ID</p>
                      <p className="text-sm font-mono font-bold text-primary">{token.token_id}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(token.token_id)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Owner wallet */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owner Wallet</p>
                      <p className="text-xs font-mono truncate">{token.owner_wallet}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(token.owner_wallet)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{meta.property_type || "N/A"}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {meta.currency === "NGN" ? "₦" : ""}{Number(meta.price || 0).toLocaleString()} {meta.currency !== "NGN" ? meta.currency : ""}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <p className="text-muted-foreground">Minted</p>
                      <p className="font-medium">{new Date(token.minted_at).toLocaleDateString()}</p>
                    </div>
                    {wasTransferred && (
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-muted-foreground">Transferred</p>
                        <p className="font-medium">{new Date(token.transferred_at!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Verification badge */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Verified on Rialo blockchain · Immutable ownership record
                    </p>
                  </div>

                  {/* Documents */}
                  {meta.documents?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Attached Documents</p>
                      <div className="space-y-1">
                        {meta.documents.map((doc: string, i: number) => (
                          <a
                            key={i}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Document {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAssetsTab;
