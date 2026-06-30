'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Plan = {
  id: string;
  name: string;
  display_name: string;
  price_monthly_usd: number;
  credits_monthly: number;
  features: Record<string, unknown>;
  description: string;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadPlans = async () => {
      const { data } = await supabase
        .from('mol_plans')
        .select('*')
        .eq('active', true)
        .order('position');
      setPlans(data || []);
    };
    loadPlans();
  }, [supabase]);

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay only for what you use. Start free, scale as you grow.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border ${
                plan.name === 'studio'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border'
              } p-6 flex flex-col`}
            >
              {plan.name === 'studio' && (
                <span className="text-sm font-semibold text-primary mb-2">Most Popular</span>
              )}
              <h3 className="text-2xl font-bold">{plan.display_name}</h3>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>

              <div className="my-6">
                <span className="text-4xl font-bold">${plan.price_monthly_usd}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              {plan.price_monthly_usd > 0 ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 mb-6"
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-full py-2 px-4 rounded-lg bg-muted text-foreground font-semibold text-center hover:bg-muted/80 mb-6"
                >
                  Start Free
                </Link>
              )}

              {/* Features */}
              <ul className="space-y-3 text-sm flex-1">
                {plan.features.audio_minutes && (
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>
                      {plan.features.audio_minutes === 999 ? 'Unlimited' : plan.features.audio_minutes}
                      {' '}audio minutes/month
                    </span>
                  </li>
                )}
                {plan.features.video_minutes && (
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>
                      {plan.features.video_minutes === 999 ? 'Unlimited' : plan.features.video_minutes}
                      {' '}video minutes/month
                    </span>
                  </li>
                )}
                {plan.features.characters && (
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>
                      {plan.features.characters === 999 ? 'Unlimited' : plan.features.characters}
                      {' '}character passports
                    </span>
                  </li>
                )}
                {plan.features.priority && (
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Priority job processing</span>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center">FAQ</h2>
          <div className="space-y-4">
            <details className="border border-border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">Can I change plans anytime?</summary>
              <p className="mt-2 text-muted-foreground">Yes, upgrade or downgrade instantly. Changes take effect on your next billing cycle.</p>
            </details>
            <details className="border border-border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">What happens if I exceed my credits?</summary>
              <p className="mt-2 text-muted-foreground">Jobs won't process if you're out of credits. Add a payment method to continue, or upgrade your plan.</p>
            </details>
            <details className="border border-border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">Do you offer refunds?</summary>
              <p className="mt-2 text-muted-foreground">Yes, 30-day money-back guarantee. Contact support@moreofless.studio.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
