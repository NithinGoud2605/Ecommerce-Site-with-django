// deno-lint-ignore-file no-explicit-any
// Edge Function: paypal-verify
// After PayPal capture, call this function with order_id and PayPal capture details to mark paid

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

function env(name: string): string {
  const value = Deno.env.get(name) ?? '';
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
    const { order_id, capture } = await req.json();
    if (!order_id || !capture) return jsonResponse(400, { error: 'Missing order_id or capture' });

    const SUPABASE_URL = env('SUPABASE_URL');
    const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

    // TODO: Verify capture with PayPal API using client credentials
    // For local emulation we assume capture is valid

    const authHeader = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ is_paid: true, paid_at: new Date().toISOString(), status: 'paid' })
    });

    return jsonResponse(200, { ok: true });
  } catch (e) {
    return jsonResponse(400, { error: String(e?.message || e) });
  }
});


