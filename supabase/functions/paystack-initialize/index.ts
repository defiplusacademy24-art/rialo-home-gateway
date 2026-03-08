import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
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

    const { transaction_id, callback_url } = await req.json();
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the transaction
    const { data: tx, error: txError } = await supabase
      .from("property_transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tx.buyer_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the buyer can initiate payment" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Paystack transaction
    // In test mode, cap amount to ₦10,000 (Paystack test limit)
    const actualAmount = Number(tx.amount);
    const testAmount = Math.min(actualAmount, 10000);
    const amountInKobo = Math.round(testAmount * 100);

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        currency: "NGN",
        reference: `rialo_${tx.contract_id}_${Date.now()}`,
        callback_url: callback_url || undefined,
        metadata: {
          transaction_id: tx.id,
          contract_id: tx.contract_id,
          property_id: tx.property_id,
          buyer_id: user.id,
          seller_id: tx.seller_id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Paystack initialization failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the paystack reference on the transaction
    await supabase
      .from("property_transactions")
      .update({ payment_proof_url: `paystack:${paystackData.data.reference}` })
      .eq("id", transaction_id);

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
