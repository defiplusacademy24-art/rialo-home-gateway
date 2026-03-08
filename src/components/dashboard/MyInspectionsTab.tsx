import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Clock, MapPin, Phone, Mail } from "lucide-react";
import { PROPERTIES } from "@/data/properties";

interface Inspection {
  id: string;
  property_id: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-accent/10 text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const MyInspectionsTab = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setInspections(data as Inspection[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

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
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Inspections</h1>
        <p className="text-muted-foreground mt-1">Property inspections you've scheduled.</p>
      </div>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-foreground">No inspections yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule an inspection from a property page and it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const prop = PROPERTIES.find((p) => p.id === Number(insp.property_id));
            return (
              <Card key={insp.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {prop?.image && (
                      <img src={prop.image} alt={prop?.title} className="w-full sm:w-32 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold text-foreground truncate">{prop?.title || `Property #${insp.property_id}`}</h3>
                          {prop && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {prop.location}
                            </p>
                          )}
                        </div>
                        <Badge className={`shrink-0 capitalize ${statusColors[insp.status] || ""}`}>
                          {insp.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(insp.preferred_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {insp.preferred_time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> {insp.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> {insp.email}
                        </span>
                      </div>
                      {insp.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{insp.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyInspectionsTab;
