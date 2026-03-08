import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const url = new URL(req.url);

    // GET: List all pending KYC submissions
    if (req.method === "GET") {
      const adminKey = url.searchParams.get("admin_key");
      if (adminKey !== SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = url.searchParams.get("status") || "pending";
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*, profiles!inner(full_name, avatar_url)")
        .eq("status", status)
        .order("submitted_at", { ascending: false });

      // Fallback if join fails (profiles FK might not exist)
      if (error) {
        const { data: fallback, error: err2 } = await supabase
          .from("kyc_submissions")
          .select("*")
          .eq("status", status)
          .order("submitted_at", { ascending: false });

        if (err2) throw err2;
        return new Response(JSON.stringify(fallback), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Approve or reject a KYC submission
    if (req.method === "POST") {
      const { admin_key, submission_id, action, reason } = await req.json();

      if (admin_key !== SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!submission_id || !["approve", "reject"].includes(action)) {
        return new Response(
          JSON.stringify({ error: "submission_id and action (approve|reject) required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newStatus = action === "approve" ? "approved" : "rejected";

      // Update KYC status
      const { data: submission, error: updateErr } = await supabase
        .from("kyc_submissions")
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq("id", submission_id)
        .select("user_id, full_legal_name")
        .single();

      if (updateErr) throw updateErr;

      // Create notification for the user
      const notifTitle = action === "approve"
        ? "KYC Verified ✅"
        : "KYC Rejected ❌";
      const notifMessage = action === "approve"
        ? "Your identity has been verified! You can now transact as a verified buyer/seller on RialEstate."
        : `Your KYC submission was rejected. ${reason ? `Reason: ${reason}` : "Please resubmit with correct information."}`;

      await supabase.from("notifications").insert({
        user_id: submission.user_id,
        title: notifTitle,
        message: notifMessage,
        type: "kyc",
        metadata: { submission_id, action, reason: reason || null },
      });

      return new Response(
        JSON.stringify({ success: true, status: newStatus, user_id: submission.user_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-kyc-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
