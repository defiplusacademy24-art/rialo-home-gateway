import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTIES } from "@/data/properties";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarIcon, Clock, ChevronRight, MapPin, User, Phone, Mail,
  FileText, CheckCircle2, Loader2, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM",
];

const ScheduleInspection = () => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const property = PROPERTIES.find((p) => p.id === Number(propertyId));

  // Pre-fill user info
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.full_name) setFullName(data.full_name);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property || !date || !time) {
      toast.error("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("inspections").insert({
        property_id: property.id.toString(),
        buyer_id: user.id,
        seller_id: `seller_${property.id}`,
        full_name: fullName,
        phone,
        email,
        preferred_date: format(date, "yyyy-MM-dd"),
        preferred_time: time,
        notes: notes || null,
      });

      if (error) throw error;

      // Send notification to seller
      try {
        await supabase.from("notifications").insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          title: "New Inspection Request",
          message: `${fullName} wants to inspect "${property.title}" on ${format(date, "PPP")} at ${time}.`,
          type: "inspection",
          metadata: { property_id: property.id.toString(), buyer_id: user.id },
        });
      } catch { /* non-critical */ }

      setSuccess(true);
      toast.success("Inspection scheduled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule inspection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Property Not Found</h1>
          <Link to="/properties"><Button>Back to Properties</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-6 mb-6">
          <nav className="flex items-center gap-1.5 text-sm mb-6">
            <Link to="/properties" className="text-muted-foreground hover:text-foreground transition-colors">Properties</Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <Link to={`/property/${property.id}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]">
              {property.title}
            </Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-foreground font-medium">Schedule Inspection</span>
          </nav>
        </div>

        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Property summary sidebar */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="sticky top-24 overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{property.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {property.location}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-display font-bold text-foreground">₦{property.priceNGN}</span>
                    <Badge variant="secondary" className="text-[10px]">{property.type}</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      Schedule an in-person visit to inspect the property before making a purchase decision.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Form */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {success ? (
                <Card className="border-primary/20">
                  <CardContent className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Inspection Scheduled!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Your inspection for <strong>{property.title}</strong> has been scheduled for{" "}
                      <strong>{date ? format(date, "PPP") : ""}</strong> at <strong>{time}</strong>.
                      The seller will be notified and you'll receive a confirmation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                      <Link to={`/property/${property.id}`}>
                        <Button variant="outline">
                          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Property
                        </Button>
                      </Link>
                      <Link to="/dashboard">
                        <Button className="gradient-cta text-primary-foreground">Go to Dashboard</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Schedule Property Inspection</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Fill in your details and choose a convenient date and time.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      {/* Phone & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234 800 000 0000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            required
                          />
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5" /> Preferred Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(d) => d < new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Preferred Time
                          </Label>
                          <Select value={time} onValueChange={setTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map((slot) => (
                                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Additional Notes <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Anything the seller should know? E.g. number of visitors, specific areas to inspect..."
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full gradient-cta text-primary-foreground font-semibold h-12 text-base"
                        disabled={submitting || !date || !time}
                      >
                        {submitting ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</>
                        ) : (
                          "Confirm Inspection"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScheduleInspection;
