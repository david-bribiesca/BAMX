// Supabase Edge Function: verify a Stripe Checkout session and, if it's paid,
// record the money donation exactly once (idempotent via stripe_session_id).
// The client polls this after opening the Stripe payment page.
// Requires secret: STRIPE_SECRET_KEY. Uses the auto-provided service role key.
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
    const { sessionId } = await req.json();
    if (!sessionId) return json({ error: 'Falta sessionId' }, 400);

    // Ask Stripe for the authoritative payment status.
    const resp = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` } }
    );
    const session = await resp.json();
    if (!resp.ok) return json({ error: session?.error?.message ?? 'Stripe error' }, 400);

    if (session.payment_status !== 'paid') {
      return json({ status: session.payment_status }); // 'unpaid' / 'no_payment_required'
    }

    // Paid -> record the donation once, bypassing RLS with the service role.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: existing } = await admin
      .from('donations')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from('donations').insert({
        donor_id: session.metadata?.donor_id,
        location_id: session.metadata?.location_id || null,
        kind: 'dinero',
        items: 'Donación en dinero',
        quantity: (session.amount_total ?? 0) / 100,
        status: 'confirmada', // Stripe already verified it — no admin approval needed
        stripe_session_id: sessionId,
      });
      if (error) return json({ error: error.message }, 500);
    }

    return json({ status: 'paid' });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
