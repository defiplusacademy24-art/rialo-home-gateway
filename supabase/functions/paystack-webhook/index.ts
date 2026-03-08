import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

// Verify Paystack webhook signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}

// Rule-based reactive engine: derive status from conditions
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

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    if (!verifySignature(rawBody, signature, paystackSecret)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const { metadata, reference, amount } = event.data;
      const transactionId = metadata?.transaction_id;

      if (!transactionId) {
        console.error("No transaction_id in Paystack metadata");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the transaction
      const { data: tx, error: txError } = await supabase
        .from("property_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (txError || !tx) {
        console.error("Transaction not found:", transactionId);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Skip if already confirmed
      if (tx.conditions?.payment_confirmed) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update conditions: auto-confirm payment
      const updatedConditions = { ...tx.conditions, payment_confirmed: true };
      const newStatus = deriveStatus(updatedConditions);

      await supabase
        .from("property_transactions")
        .update({
          conditions: updatedConditions,
          status: newStatus,
          payment_proof_url: `paystack_verified:${reference}`,
        })
        .eq("id", transactionId);

      // Notify both parties
      const amountNgn = amount / 100;
      try {
        await supabase.from("notifications").insert([
          {
            user_id: tx.buyer_id,
            title: "Payment Confirmed",
            message: `Your payment of ₦${amountNgn.toLocaleString()} has been confirmed via Paystack. Funds are now locked in the smart contract.`,
            type: "transaction",
            metadata: { transaction_id: transactionId, reference },
          },
          {
            user_id: tx.seller_id,
            title: "Payment Received",
            message: `Buyer's payment of ₦${amountNgn.toLocaleString()} has been confirmed via Paystack. Funds are locked in the smart contract.`,
            type: "transaction",
            metadata: { transaction_id: transactionId, reference },
          },
        ]);
      } catch (_) { /* non-critical */ }

      console.log(`Payment confirmed for transaction ${transactionId}, ref: ${reference}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
