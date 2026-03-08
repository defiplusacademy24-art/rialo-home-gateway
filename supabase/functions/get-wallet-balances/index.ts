import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USDT_CONTRACTS: Record<string, string> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
};

const USDC_CONTRACTS: Record<string, string> = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const RPC_URLS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  base: 'https://mainnet.base.org',
};

const ERC20_BALANCE_OF = '0x70a08231';

async function getEthBalance(rpcUrl: string, address: string): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const wei = BigInt(data.result);
  return (Number(wei) / 1e18).toFixed(6);
}

async function getTokenBalance(rpcUrl: string, tokenAddress: string, walletAddress: string, decimals: number): Promise<string> {
  const paddedAddress = walletAddress.slice(2).padStart(64, '0');
  const callData = ERC20_BALANCE_OF + paddedAddress;

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params: [{ to: tokenAddress, data: callData }, 'latest'],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = BigInt(data.result || '0x0');
  return (Number(raw) / Math.pow(10, decimals)).toFixed(2);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [ethBalance, ethUsdt, ethUsdc, baseEth, baseUsdt, baseUsdc] = await Promise.all([
      getEthBalance(RPC_URLS.ethereum, address).catch(() => '0.000000'),
      getTokenBalance(RPC_URLS.ethereum, USDT_CONTRACTS.ethereum, address, 6).catch(() => '0.00'),
      getTokenBalance(RPC_URLS.ethereum, USDC_CONTRACTS.ethereum, address, 6).catch(() => '0.00'),
      getEthBalance(RPC_URLS.base, address).catch(() => '0.000000'),
      getTokenBalance(RPC_URLS.base, USDT_CONTRACTS.base, address, 6).catch(() => '0.00'),
      getTokenBalance(RPC_URLS.base, USDC_CONTRACTS.base, address, 6).catch(() => '0.00'),
    ]);

    return new Response(JSON.stringify({
      ethereum: { eth: ethBalance, usdt: ethUsdt, usdc: ethUsdc },
      base: { eth: baseEth, usdt: baseUsdt, usdc: baseUsdc },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
