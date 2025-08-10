// deno-lint-ignore-file no-explicit-any
// Edge Function: create-checkout
// Validates stock, creates pending order, and creates Stripe Checkout Session

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

interface CartLine {
  variantId: string;
  productId?: string | null;
  name: string;
  price_cents: number;
  currency?: string;
  qty: number;
  image_path?: string | null;
  size?: string | null;
  color?: string | null;
}

interface Payload {
  email: string;
  shipping: {
    name: string; address: string; address2?: string; city: string; region: string; postal: string; country: string; phone: string;
  };
  items: CartLine[];
}

function env(name: string): string {
  const value = Deno.env.get(name) ?? '';
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function toStripeAmount(cents: number): number {
  return Math.max(0, Math.floor(cents));
}

async function validateStock(supabaseUrl: string, serviceKey: string, items: CartLine[]) {
  const authHeader = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` };
  for (const it of items) {
    const resp = await fetch(`${supabaseUrl}/rest/v1/product_variants?id=eq.${encodeURIComponent(it.variantId)}&select=stock`, { headers: authHeader });
    if (!resp.ok) throw new Error(`Failed stock check`);
    const rows = await resp.json();
    const stock = Array.isArray(rows) && rows[0]?.stock ? Number(rows[0].stock) : 0;
    if (stock < it.qty) throw new Error(`Insufficient stock for ${it.name}`);
  }
}

async function upsertAddress(supabaseUrl: string, serviceKey: string, shipping: Payload['shipping'], userId: string | null) {
  const authHeader = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const { name, address, address2 = '', city, region, postal, country, phone } = shipping;
  const { data, error } = await fetch(`${supabaseUrl}/rest/v1/addresses`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ user_id: userId, name, address, address2, city, region, postal, country, phone })
  }).then(async (r) => ({ data: await r.json(), error: r.ok ? null : await r.text() }));
  if (error) throw new Error(String(error));
  return Array.isArray(data) ? data[0] : data;
}

async function createOrder(supabaseUrl: string, serviceKey: string, payload: Payload, addressId: string, userId: string | null) {
  const authHeader = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const subtotal_cents = payload.items.reduce((sum, it) => sum + (it.qty * (it.price_cents || 0)), 0);
  const currency = payload.items[0]?.currency || 'USD';
  const { data, error } = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST', headers: authHeader,
    body: JSON.stringify({ user_id: userId, email: payload.email, address_id: addressId, currency, subtotal_cents, status: 'pending' })
  }).then(async (r) => ({ data: await r.json(), error: r.ok ? null : await r.text() }));
  if (error) throw new Error(String(error));
  return Array.isArray(data) ? data[0] : data;
}

async function createStripeSession(stripeKey: string, supabaseUrl: string, orderId: string, items: CartLine[], successUrl: string, cancelUrl: string) {
  const body: any = {
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: items.map((it) => ({
      quantity: it.qty,
      price_data: {
        currency: (it.currency || 'USD').toLowerCase(),
        unit_amount: toStripeAmount(it.price_cents),
        product_data: { name: it.name, metadata: { variantId: it.variantId, productId: String(it.productId || '') } }
      }
    })),
    metadata: { order_id: orderId }
  };

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      mode: body.mode,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      'metadata[order_id]': orderId,
      ...Object.assign({}, ...items.map((it, idx) => ({
        [`line_items[${idx}][quantity]`]: String(it.qty),
        [`line_items[${idx}][price_data][currency]`]: (it.currency || 'usd').toLowerCase(),
        [`line_items[${idx}][price_data][unit_amount]`]: String(toStripeAmount(it.price_cents)),
        [`line_items[${idx}][price_data][product_data][name]`]: it.name,
        [`line_items[${idx}][price_data][product_data][metadata][variantId]`]: String(it.variantId),
        [`line_items[${idx}][price_data][product_data][metadata][productId]`]: String(it.productId || ''),
      })))
    })
  });
  if (!resp.ok) throw new Error(`Stripe error: ${await resp.text()}`);
  const data = await resp.json();
  return { url: data?.url as string, id: data?.id as string };
}

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
    const payload = (await req.json()) as Payload;
    if (!payload?.email || !Array.isArray(payload?.items) || payload.items.length === 0) {
      return jsonResponse(400, { error: 'Invalid payload' });
    }

    const SUPABASE_URL = env('SUPABASE_URL');
    const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
    const STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY');
    const SUCCESS_URL = Deno.env.get('CHECKOUT_SUCCESS_URL') || 'http://localhost:5173/#/placeorder';
    const CANCEL_URL = Deno.env.get('CHECKOUT_CANCEL_URL') || 'http://localhost:5173/#/cart';

    await validateStock(SUPABASE_URL, SERVICE_KEY, payload.items);
    const address = await upsertAddress(SUPABASE_URL, SERVICE_KEY, payload.shipping, null);
    const order = await createOrder(SUPABASE_URL, SERVICE_KEY, payload, address.id, null);

    const session = await createStripeSession(STRIPE_SECRET_KEY, SUPABASE_URL, order.id, payload.items, SUCCESS_URL, CANCEL_URL);

    // Save stripe_session_id back to order (best effort)
    try {
      const authHeader = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, { method: 'PATCH', headers: authHeader, body: JSON.stringify({ stripe_session_id: session.id }) });
    } catch (_) {}

    return jsonResponse(200, { url: session.url, order_id: order.id, session_id: session.id });
  } catch (e) {
    return jsonResponse(400, { error: String(e?.message || e) });
  }
});


