import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Eye, Pencil, Trash2, MapPin, Bed, Bath, Ruler,
  MoreVertical, Search, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Property = {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  price: number;
  currency: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  images: string[] | null;
  status: string;
  is_tokenized: boolean;
  created_at: string;
};

const statusColors: Record<string, string> = {
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  sold: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const currencySymbols: Record<string, string> = {
  NGN: "₦",
  USDT: "USDT ",
  ETH: "ETH ",
};

const MyListingsTab = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "", status: "" });
  const [saving, setSaving] = useState(false);

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load listings", description: error.message, variant: "destructive" });
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("properties").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Property deleted" });
      setProperties((prev) => prev.filter((p) => p.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const openEdit = (p: Property) => {
    setEditProperty(p);
    setEditForm({
      title: p.title,
      description: p.description || "",
      price: String(p.price),
      status: p.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editProperty) return;
    if (!editForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        price: Number(editForm.price) || 0,
        status: editForm.status,
      })
      .eq("id", editProperty.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Property updated" });
      fetchProperties();
    }
    setSaving(false);
    setEditProperty(null);
  };

  const toggleStatus = async (p: Property) => {
    const newStatus = p.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", p.id);
    if (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } else {
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: newStatus } : x)));
    }
  };

  const filtered = properties.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatPrice = (price: number, currency: string) => {
    const sym = currencySymbols[currency] || "";
    if (currency === "NGN") return `${sym}${price.toLocaleString()}`;
    return `${sym}${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Listings</h1>
        <p className="text-muted-foreground mt-1">Manage your property listings.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {properties.length === 0 ? "No listings yet" : "No matching listings"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {properties.length === 0
                ? "List your first property to get started."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-48 h-40 sm:h-auto bg-muted shrink-0">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground text-lg leading-tight">{p.title}</h3>
                          {(p.city || p.state) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {[p.city, p.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={statusColors[p.status] || ""}>
                            {p.status}
                          </Badge>
                          {p.is_tokenized && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Tokenized
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(p)}>
                                <Eye className="w-4 h-4 mr-2" />
                                {p.status === "published" ? "Unpublish" : "Publish"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(p.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                        {p.bedrooms != null && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" /> {p.bedrooms} bed
                          </span>
                        )}
                        {p.bathrooms != null && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" /> {p.bathrooms} bath
                          </span>
                        )}
                        {p.area_sqft != null && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" /> {p.area_sqft.toLocaleString()} sqft
                          </span>
                        )}
                        <span className="capitalize">{p.property_type}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">
                        {formatPrice(p.price, p.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Listed {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The listing and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={!!editProperty} onOpenChange={() => setEditProperty(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProperty(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="gradient-cta text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyListingsTab;
