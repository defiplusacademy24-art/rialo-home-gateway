import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate mock Rialo contract ID
function generateContractId(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `RX${num}`;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user from auth header
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

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).pop() || "";

  try {
    // POST /create - Create a new transaction
    if (req.method === "POST" && path === "reactive-transaction-engine") {
      const body = await req.json();
      const { action } = body;

      if (action === "create") {
        const { property_id, seller_id, amount, currency } = body;
        if (!property_id || !seller_id || !amount) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if buyer already has active transaction for this property
        const { data: existing } = await supabase
          .from("property_transactions")
          .select("id")
          .eq("property_id", property_id)
          .eq("buyer_id", user.id)
          .not("status", "in", '("COMPLETED","CANCELLED")')
          .maybeSingle();

        if (existing) {
          return new Response(JSON.stringify({ error: "Active transaction exists", transaction_id: existing.id }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const contractId = generateContractId();
        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const { data, error } = await supabase
          .from("property_transactions")
          .insert({
            property_id,
            buyer_id: user.id,
            seller_id,
            amount,
            currency: currency || "USDT",
            contract_id: contractId,
            deadline: deadline.toISOString(),
            status: "PAYMENT_INITIATED",
            conditions: {
              payment_confirmed: false,
              buyer_signed: false,
              seller_signed: false,
              title_verified: false,
            },
          })
          .select()
          .single();

        if (error) throw error;

        // Auto-simulate: payment confirmed after creation
        const updatedConditions = { ...data.conditions, payment_confirmed: true };
        const newStatus = deriveStatus(updatedConditions);

        const { data: updated, error: updateError } = await supabase
          .from("property_transactions")
          .update({ conditions: updatedConditions, status: newStatus })
          .eq("id", data.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "update-condition") {
        const { transaction_id, condition, value } = body;
        if (!transaction_id || !condition) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch current transaction
        const { data: tx, error: fetchErr } = await supabase
          .from("property_transactions")
          .select("*")
          .eq("id", transaction_id)
          .single();

        if (fetchErr || !tx) {
          return new Response(JSON.stringify({ error: "Transaction not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify user is buyer or seller
        if (tx.buyer_id !== user.id && tx.seller_id !== user.id) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updatedConditions = { ...tx.conditions, [condition]: value !== undefined ? value : true };
        let newStatus = deriveStatus(updatedConditions);

        // If all conditions met, move to settlement then completed
        if (updatedConditions.payment_confirmed && updatedConditions.buyer_signed && 
            updatedConditions.seller_signed && updatedConditions.title_verified) {
          newStatus = "SETTLEMENT_EXECUTION";
        }

        const { data: updated, error: updateErr } = await supabase
          .from("property_transactions")
          .update({ conditions: updatedConditions, status: newStatus })
          .eq("id", transaction_id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        // If settlement, auto-complete after a moment
        if (newStatus === "SETTLEMENT_EXECUTION") {
          // Complete immediately in simulation
          await supabase
            .from("property_transactions")
            .update({ status: "COMPLETED" })
            .eq("id", transaction_id);
        }

        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "list") {
        const { data, error } = await supabase
          .from("property_transactions")
          .select("*, properties(title, city, state, images, price, property_type)")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "get") {
        const { transaction_id } = body;
        const { data, error } = await supabase
          .from("property_transactions")
          .select("*, properties(title, city, state, images, price, property_type, currency)")
          .eq("id", transaction_id)
          .single();

        if (error) throw error;

        // Verify access
        if (data.buyer_id !== user.id && data.seller_id !== user.id) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
