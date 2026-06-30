'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  monthly_usage_usd: number;
  credits_remaining: number;
  current_period_end: string;
};

type Plan = {
  id: string;
  display_name: string;
  price_monthly_usd: number;
  credits_monthly: number;
};

type Invoice = {
  id: string;
  amount_usd: number;
  status: string;
  period_start: string;
  pdf_url: string | null;
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadBilling = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load subscription
      const { data: sub } = await supabase
        .from('mol_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sub) {
        setSubscription(sub);

        // Load plan
        const { data: planData } = await supabase
          .from('mol_plans')
          .select('*')
          .eq('id', sub.plan_id)
          .single();
        setPlan(planData);
      }

      // Load invoices
      const { data: invoiceData } = await supabase
        .from('mol_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start', { ascending: false });
      setInvoices(invoiceData || []);

      setLoading(false);
    };

    loadBilling();
  }, [supabase]);

  if (loading) return <div className="min-h-screen py-12 text-center">Loading...</div>;

  const usagePercent = subscription && plan
    ? (subscription.monthly_usage_usd / (plan.credits_monthly === -1 ? Infinity : plan.credits_monthly)) * 100
    : 0;

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Billing & Usage</h1>

        {/* Current Plan */}
        {subscription && plan && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{plan.display_name} Plan</h2>
                <p className="text-muted-foreground">
                  ${plan.price_monthly_usd}/month
                  {subscription.status === 'active' ? ' • Active' : ` • ${subscription.status}`}
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
              >
                Change Plan
              </Link>
            </div>

            {/* Usage Progress */}
            {plan.credits_monthly !== -1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Usage</span>
                  <span>${subscription.monthly_usage_usd.toFixed(2)} / ${plan.credits_monthly}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Period Info */}
            <p className="text-sm text-muted-foreground">
              Billing period ends:{' '}
              {subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Invoice History</h3>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">
                      {new Date(invoice.period_start).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{invoice.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">${invoice.amount_usd.toFixed(2)}</span>
                    {invoice.pdf_url && (
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No invoices yet.</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Payment Method</h3>
          <p className="text-muted-foreground mb-4">Manage your payment method on Stripe.</p>
          <a
            href="https://billing.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
          >
            Manage in Stripe
          </a>
        </div>
      </div>
    </main>
  );
}
