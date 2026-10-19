// Supabase Edge Function: create a Stripe Checkout Session for a money donation.
// The donor is identified from their JWT; the amount comes from the client.
// Requires secret: STRIPE_SECRET_KEY (set in Supabase > Edge Functions > Secrets).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { amount, locationId, successUrl, cancelUrl } = await req.json();
    const pesos = Number(amount);
    if (!pesos || Number.isNaN(pesos) || pesos <= 0) {
      return json({ error: 'Monto inválido' }, 400);
    }

    // Identify the donor from their access token.
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const donorId = userData?.user?.id;
    if (!donorId) return json({ error: 'No autenticado' }, 401);

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set(
      'success_url',
      successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}'
    );
    params.set('cancel_url', cancelUrl || 'https://example.com/cancel');
    // Payment methods are configured in the Stripe Dashboard (Settings >
    // Payment methods); Checkout no longer accepts payment_method_types here.
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'mxn');
    params.set('line_items[0][price_data][unit_amount]', String(Math.round(pesos * 100)));
    params.set('line_items[0][price_data][product_data][name]', 'Donación BAMX Guadalajara');
    params.set('metadata[donor_id]', donorId);
    if (locationId) params.set('metadata[location_id]', String(locationId));

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await resp.json();
    if (!resp.ok) return json({ error: session?.error?.message ?? 'Stripe error' }, 400);

    return json({ url: session.url, id: session.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
