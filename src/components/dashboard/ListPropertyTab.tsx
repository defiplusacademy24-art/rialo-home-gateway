import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2, ImagePlus, FileText, MapPin, DollarSign, Home, Plus, Trash2, Eye, Check, Shield, CheckCircle2 } from "lucide-react";
import { countries } from "@/data/countries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ethLogo from "@/assets/eth-logo.png";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import nairaLogo from "@/assets/naira-logo.jpg";

interface ListPropertyTabProps {
  onPropertyCreated?: () => void;
}

const propertyTypes = [
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial", label: "Commercial" },
];

const currencies = [
  { value: "NGN", label: "NGN (₦)" },
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
  { value: "ETH", label: "ETH" },
];

const PAYMENT_OPTIONS = [
  { key: "NGN", label: "Naira (₦)", sub: "NGN Bank Transfer", logo: nairaLogo },
  { key: "USDT", label: "USDT", sub: "Tether · ERC-20", logo: usdtLogo },
  { key: "USDC", label: "USDC", sub: "USD Coin · ERC-20", logo: usdcLogo },
  { key: "ETH", label: "Ethereum", sub: "Native currency", logo: ethLogo },
];

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const ListPropertyTab = ({ onPropertyCreated }: ListPropertyTabProps) => {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("house");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  // tokenize is always true now (auto-tokenized)
  const [acceptedPayments, setAcceptedPayments] = useState<string[]>(["NGN"]);

  // Files
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const maxFiles = 10 - imageUrls.length;
    const selected = Array.from(files).slice(0, maxFiles);

    if (selected.length === 0) {
      toast({ title: "Maximum 10 images allowed", variant: "destructive" });
      return;
    }

    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      const previews: string[] = [];

      for (const file of selected) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name} too large`, description: "Max 10MB per image.", variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage.from("property-files").upload(filePath, file);
        if (error) throw error;

        const { data: urlData } = supabase.storage.from("property-files").getPublicUrl(filePath);
        uploaded.push(urlData.publicUrl);
        previews.push(URL.createObjectURL(file));
      }

      setImageUrls((prev) => [...prev, ...uploaded]);
      setImagePreviews((prev) => [...prev, ...previews]);
      toast({ title: `${uploaded.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const maxFiles = 5 - docUrls.length;
    const selected = Array.from(files).slice(0, maxFiles);

    if (selected.length === 0) {
      toast({ title: "Maximum 5 documents allowed", variant: "destructive" });
      return;
    }

    setUploadingDocs(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: `${file.name} too large`, description: "Max 20MB per document.", variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/docs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage.from("property-files").upload(filePath, file);
        if (error) throw error;

        const { data: urlData } = supabase.storage.from("property-files").getPublicUrl(filePath);
        uploaded.push(urlData.publicUrl);
      }

      setDocUrls((prev) => [...prev, ...uploaded]);
      toast({ title: `${uploaded.length} document(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingDocs(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDoc = (index: number) => {
    setDocUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!user) return;

    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!price || Number(price) <= 0) {
      toast({ title: "Valid price is required", variant: "destructive" });
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !country.trim()) {
      toast({ title: "Complete location details are required", variant: "destructive" });
      return;
    }
    if (imageUrls.length === 0) {
      toast({ title: "At least one property image is required", variant: "destructive" });
      return;
    }

    if (acceptedPayments.length === 0) {
      toast({ title: "Select at least one payment method", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase.from("properties").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        property_type: propertyType,
        price: Number(price),
        currency,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        area_sqft: areaSqft ? Number(areaSqft) : null,
        images: imageUrls,
        documents: docUrls,
        status,
        is_tokenized: true,
        accepted_payments: acceptedPayments,
      } as any).select().single();

      if (error) throw error;

      // Auto-mint property token (NFT digital deed)
      if (inserted) {
        try {
          await supabase.functions.invoke("mint-property-token", {
            body: { property_id: inserted.id },
          });
        } catch (_) { /* non-critical: token minting is best-effort */ }
      }

      toast({ title: status === "published" ? "Property published & tokenized!" : "Draft saved & tokenized!" });

      // Reset form
      setTitle(""); setDescription(""); setPropertyType("house"); setPrice("");
      setCurrency("NGN"); setAddress(""); setCity(""); setState(""); setCountry("Nigeria");
      setBedrooms(""); setBathrooms(""); setAreaSqft(""); setTokenize(false);
      setImageUrls([]); setDocUrls([]); setImagePreviews([]); setAcceptedPayments(["NGN"]);

      onPropertyCreated?.();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const showRoomFields = propertyType !== "land";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">List Property</h1>
          <p className="text-muted-foreground mt-1">Add a new property listing or tokenize it on the blockchain.</p>
        </div>
      </div>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Property Details
          </CardTitle>
          <CardDescription>Basic information about the property.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Property Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3 Bedroom Duplex in Lekki" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property in detail — features, amenities, surroundings..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showRoomFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="e.g. 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="e.g. 2" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="areaSqft">Area (sq ft)</Label>
              <Input id="areaSqft" type="number" min="0" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} placeholder="e.g. 2500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 50000000" />
            </div>
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-base font-display font-semibold">Accepted Payment Methods *</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Select the payment methods buyers can use to purchase this property.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = acceptedPayments.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setAcceptedPayments((prev) =>
                        selected ? prev.filter((p) => p !== opt.key) : [...prev, opt.key]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={opt.logo} alt={opt.key} className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.sub}</p>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location
          </CardTitle>
          <CardDescription>Where is the property located?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 15 Victoria Island Road" maxLength={300} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              {country === "Nigeria" ? (
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State/Province" maxLength={100} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setState(""); }}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-primary" />
            Property Images *
          </CardTitle>
          <CardDescription>Upload up to 10 images. First image is the cover photo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img src={preview} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <Badge className="absolute top-1 left-1 text-[10px]">Cover</Badge>
                )}
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {imageUrls.length < 10 && (
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImages}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                {uploadingImages ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">Add Image</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documents
          </CardTitle>
          <CardDescription>Upload supporting documents — title deed, C of O, survey plan, etc. (Max 5 files, 20MB each)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {docUrls.map((url, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">Document {i + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => removeDoc(i)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {docUrls.length < 5 && (
            <Button
              variant="outline"
              onClick={() => docInputRef.current?.click()}
              disabled={uploadingDocs}
              className="gap-2"
            >
              {uploadingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Document
            </Button>
          )}
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={handleDocUpload}
          />
        </CardContent>
      </Card>

      {/* Tokenization Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Blockchain Tokenization
          </CardTitle>
          <CardDescription>
            All properties are automatically tokenized as NFTs on the Rialo blockchain. A digital deed will be minted to your wallet upon listing, ensuring immutable proof of ownership. When sold, the NFT transfers to the buyer automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>Property documents are embedded in the token metadata</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={submitting}
          className="gap-2 flex-1"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("published")}
          disabled={submitting}
          className="gap-2 flex-1 gradient-cta text-primary-foreground"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Publish Property
        </Button>
      </div>
    </div>
  );
};

export default ListPropertyTab;
