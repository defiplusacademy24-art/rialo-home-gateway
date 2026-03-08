import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateTokenId(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `RX${num}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return new Response(JSON.stringify({ error: "Missing property_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch property
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propErr || !property) {
      return new Response(JSON.stringify({ error: "Property not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    if (property.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not your property" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already minted
    const { data: existing } = await supabase
      .from("property_tokens")
      .select("id, token_id")
      .eq("property_id", property_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already minted", token: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get seller wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("address")
      .eq("user_id", user.id)
      .maybeSingle();

    const ownerWallet = wallet?.address || "0x0000000000000000000000000000000000000000";
    const tokenId = generateTokenId();

    // Build metadata
    const metadata = {
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      price: property.price,
      currency: property.currency,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area_sqft: property.area_sqft,
      images: property.images,
      documents: property.documents,
      seller_id: user.id,
      minted_at: new Date().toISOString(),
    };

    const { data: tokenRecord, error: insertErr } = await supabase
      .from("property_tokens")
      .insert({
        token_id: tokenId,
        property_id,
        owner_wallet: ownerWallet,
        owner_user_id: user.id,
        minted_by: user.id,
        metadata,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Mark property as tokenized
    await supabase
      .from("properties")
      .update({ is_tokenized: true })
      .eq("id", property_id);

    return new Response(JSON.stringify(tokenRecord), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
