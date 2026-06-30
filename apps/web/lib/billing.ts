/**
 * Billing utilities for cost tracking and estimation
 */

// Per-unit pricing (USD)
export const UNIT_PRICES = {
  audio_master: 0.05, // per minute
  stem_sep: 0.03, // per minute
  video_gen: 0.50, // per minute
  image_gen: 0.10, // per image
  character: 5.0, // one-time
  storage: 0.01, // per GB per month
};

export type JobType = keyof typeof UNIT_PRICES;

/**
 * Estimate cost for a job based on type and params
 * Returns estimated cost in USD
 */
export function estimateCost(type: string, params: Record<string, unknown>): number {
  const unitPrice = UNIT_PRICES[type as JobType];
  if (!unitPrice) return 0;

  switch (type) {
    case 'audio_master':
    case 'stem_sep':
    case 'video_gen': {
      const duration = (params.duration as number) || 0;
      return duration * unitPrice;
    }
    case 'image_gen': {
      const count = (params.count as number) || 1;
      return count * unitPrice;
    }
    case 'character': {
      return unitPrice;
    }
    default:
      return 0;
  }
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Get user's current subscription and credits
 */
export async function getSubscription(supabase: any, userId: string) {
  const { data: sub, error } = await supabase
    .from('mol_subscriptions')
    .select(`
      *,
      plan:mol_plans (*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return sub;
}

/**
 * Check if user has enough credits for a job
 */
export function canAffordJob(subscription: any, estimatedCost: number): boolean {
  if (!subscription) return false;
  if (subscription.plan.credits_monthly === -1) return true; // Unlimited
  return subscription.credits_remaining >= estimatedCost;
}

/**
 * Get user's credit balance and usage
 */
export function getCredits(subscription: any) {
  if (!subscription) return { remaining: 0, total: 0, used: 0, unlimited: false };

  const total = subscription.plan.credits_monthly;
  const unlimited = total === -1;
  const used = subscription.monthly_usage_usd;
  const remaining = unlimited ? Infinity : total - used;

  return { remaining, total: unlimited ? Infinity : total, used, unlimited };
}

/**
 * Format credits for display
 */
export function formatCredits(remaining: number, total: number): string {
  if (total === Infinity) return 'Unlimited';
  return `$${remaining.toFixed(2)} / $${total.toFixed(0)}`;
}
