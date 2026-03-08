import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackRequest(path: string, method: string, secret: string, body?: any) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || `Paystack API error: ${path}`);
  }
  return data.data;
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

    const { transaction_id } = await req.json();
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch transaction
    const { data: tx, error: txErr } = await supabase
      .from("property_transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (txErr || !tx) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process BANK_TRANSFER (NGN) transactions at SETTLEMENT_EXECUTION
    if (tx.status !== "SETTLEMENT_EXECUTION") {
      return new Response(JSON.stringify({ error: "Transaction not at settlement stage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check for existing payout (prevent duplicates)
    const { data: existingPayout } = await supabase
      .from("payouts")
      .select("id, status")
      .eq("transaction_id", transaction_id)
      .maybeSingle();

    if (existingPayout) {
      if (existingPayout.status === "success") {
        return new Response(JSON.stringify({ error: "Payout already completed" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // If failed, allow retry by deleting old record
      if (existingPayout.status === "failed") {
        await supabase.from("payouts").delete().eq("id", existingPayout.id);
      } else if (existingPayout.status === "processing") {
        return new Response(JSON.stringify({ error: "Payout already in progress", payout_id: existingPayout.id }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Get seller bank details
    const { data: bankDetails, error: bankErr } = await supabase
      .from("bank_details")
      .select("*")
      .eq("user_id", tx.seller_id)
      .maybeSingle();

    if (bankErr || !bankDetails) {
      console.error("Seller bank details not found for:", tx.seller_id);
      return new Response(JSON.stringify({ error: "Seller bank details not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Resolve bank account with Paystack
    let resolvedAccount;
    try {
      resolvedAccount = await paystackRequest(
        `/bank/resolve?account_number=${bankDetails.account_number}&bank_code=${bankDetails.bank_name}`,
        "GET",
        paystackSecret
      );
    } catch (err: any) {
      console.error("Bank resolve failed:", err.message);
      // Continue with stored details - resolve is optional verification
    }

    // 5. Create transfer recipient
    const recipient = await paystackRequest("/transferrecipient", "POST", paystackSecret, {
      type: "nuban",
      name: bankDetails.account_name,
      account_number: bankDetails.account_number,
      bank_code: bankDetails.bank_name,
      currency: "NGN",
    });

    const recipientCode = recipient.recipient_code;

    // 6. Initiate transfer (amount in kobo)
    const amountKobo = Math.round(tx.amount * 100);
    const transfer = await paystackRequest("/transfer", "POST", paystackSecret, {
      source: "balance",
      amount: amountKobo,
      recipient: recipientCode,
      reason: `Property payout - Contract ${tx.contract_id}`,
      reference: `payout_${transaction_id}_${Date.now()}`,
      metadata: {
        transaction_id,
        contract_id: tx.contract_id,
        seller_id: tx.seller_id,
      },
    });

    // 7. Store payout record
    const { data: payout, error: payoutErr } = await supabase
      .from("payouts")
      .insert({
        transaction_id,
        seller_id: tx.seller_id,
        amount: tx.amount,
        paystack_transfer_reference: transfer.transfer_code || transfer.reference,
        paystack_recipient_code: recipientCode,
        status: "processing",
      })
      .select()
      .single();

    if (payoutErr) {
      console.error("Failed to store payout:", payoutErr);
    }

    // 8. Notify seller
    try {
      await supabase.from("notifications").insert({
        user_id: tx.seller_id,
        title: "Payout Initiated",
        message: `A payout of ₦${Number(tx.amount).toLocaleString()} is being processed to your bank account. Contract: ${tx.contract_id}`,
        type: "payout",
        metadata: { transaction_id, payout_id: payout?.id },
      });
    } catch (_) { /* non-critical */ }

    console.log(`Payout initiated for transaction ${transaction_id}, transfer: ${transfer.transfer_code || transfer.reference}`);

    return new Response(JSON.stringify({
      success: true,
      payout_id: payout?.id,
      transfer_reference: transfer.transfer_code || transfer.reference,
      status: "processing",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Payout error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
