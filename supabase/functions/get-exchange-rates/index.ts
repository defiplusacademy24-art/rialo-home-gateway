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
    // Fetch real-time prices from CoinGecko (free, no API key needed)
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether,usd-coin&vs_currencies=ngn,usd",
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    // Build rates object
    // data shape: { ethereum: { ngn: X, usd: Y }, tether: { ngn: X, usd: Y }, "usd-coin": { ngn: X, usd: Y } }
    const rates = {
      ETH: {
        ngn: data.ethereum?.ngn || 0,
        usd: data.ethereum?.usd || 0,
      },
      USDT: {
        ngn: data.tether?.ngn || 0,
        usd: data.tether?.usd || 0,
      },
      USDC: {
        ngn: data["usd-coin"]?.ngn || 0,
        usd: data["usd-coin"]?.usd || 0,
      },
      // NGN to USD rate (derived from USDT which is pegged to $1)
      NGN_USD: data.tether?.ngn ? 1 / data.tether.ngn : 0,
    };

    return new Response(JSON.stringify(rates), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Exchange rate error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
