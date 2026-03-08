import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function deriveStatus(conditions: Record<string, boolean>): string {
  const { payment_confirmed, buyer_signed, seller_signed, title_verified } = conditions;
  if (!payment_confirmed) return "PAYMENT_INITIATED";
  if (!buyer_signed || !seller_signed) return "FUNDS_LOCKED";
  if (buyer_signed && seller_signed && !title_verified) return "CONTRACT_ACTIVE";
  if (title_verified) return "TITLE_VERIFICATION";
  return "PAYMENT_INITIATED";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const { reference, transaction_id } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(JSON.stringify({ 
        verified: false, 
        message: verifyData.data?.gateway_response || "Payment not successful" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment successful - update transaction if not already done by webhook
    if (transaction_id) {
      const { data: tx } = await supabase
        .from("property_transactions")
        .select("*")
        .eq("id", transaction_id)
        .single();

      if (tx && !tx.conditions?.payment_confirmed) {
        const updatedConditions = { ...tx.conditions, payment_confirmed: true };
        const newStatus = deriveStatus(updatedConditions);

        await supabase
          .from("property_transactions")
          .update({
            conditions: updatedConditions,
            status: newStatus,
            payment_proof_url: `paystack_verified:${reference}`,
          })
          .eq("id", transaction_id);
      }
    }

    return new Response(JSON.stringify({ 
      verified: true, 
      reference,
      amount: verifyData.data.amount / 100,
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
