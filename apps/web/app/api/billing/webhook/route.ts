import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { planId } = session.metadata || {};
        const customerId = session.customer as string;

        // Get plan to fetch credits
        const { data: plan } = await supabase
          .from('mol_plans')
          .select('id, credits_monthly')
          .eq('id', planId)
          .single();

        if (!plan) break;

        // Update subscription
        const subscriptionId = session.subscription as string;
        const stripeSubResp = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase
          .from('mol_subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            status: 'active',
            current_period_start: new Date(stripeSubResp.current_period_start * 1000),
            current_period_end: new Date(stripeSubResp.current_period_end * 1000),
            credits_remaining: plan.credits_monthly,
            monthly_usage_usd: 0,
          })
          .eq('stripe_customer_id', customerId);

        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const planId = (sub.metadata?.planId as string) || null;

        if (planId) {
          await supabase
            .from('mol_subscriptions')
            .update({
              status: sub.status as string,
              current_period_start: new Date(sub.current_period_start * 1000),
              current_period_end: new Date(sub.current_period_end * 1000),
              cancel_at_period_end: sub.cancel_at_period_end || false,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Downgrade to free plan
        const { data: freePlan } = await supabase
          .from('mol_plans')
          .select('id')
          .eq('name', 'free')
          .single();

        if (freePlan) {
          await supabase
            .from('mol_subscriptions')
            .update({
              plan_id: freePlan.id,
              status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Record invoice
        await supabase
          .from('mol_invoices')
          .insert({
            stripe_invoice_id: invoice.id,
            user_id: (await supabase.from('mol_subscriptions').select('user_id').eq('stripe_customer_id', customerId).single()).data?.user_id,
            amount_usd: (invoice.total || 0) / 100,
            status: 'paid',
            period_start: new Date(invoice.period_start * 1000),
            period_end: new Date(invoice.period_end * 1000),
            pdf_url: invoice.pdf || null,
            stripe_hosted_url: invoice.hosted_invoice_url || null,
          });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
