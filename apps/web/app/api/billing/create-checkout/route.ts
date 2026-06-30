import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await request.json();
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

  try {
    // Get plan
    const { data: plan } = await supabase
      .from('mol_plans')
      .select('id, name, price_monthly_usd, stripe_price_id')
      .eq('id', planId)
      .single();

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    if (!plan.stripe_price_id) return NextResponse.json({ error: 'Plan not available for purchase' }, { status: 400 });

    // Get or create Stripe customer
    let { data: sub } = await supabase
      .from('mol_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Insert subscription record
      await supabase
        .from('mol_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          stripe_customer_id: customerId,
          status: 'trialing',
        });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${new URL(request.url).origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(request.url).origin}/billing/plans`,
      metadata: { userId: user.id, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
