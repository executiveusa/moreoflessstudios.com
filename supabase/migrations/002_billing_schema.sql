-- More-of-Less: Billing Schema
-- Phase 6: Plans, subscriptions, invoices, and usage metering

-- Plans: Tier definitions for subscription tiers
create table if not exists public.mol_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- 'free', 'creator', 'studio', 'professional'
  display_name text not null, -- 'Free', 'Creator', 'Studio', 'Professional'
  price_monthly_usd numeric not null, -- 0 for free tier
  credits_monthly numeric not null, -- USD credits per month; -1 for unlimited
  stripe_price_id text, -- Stripe Price ID for this tier
  features jsonb not null default '{}', -- {"video_minutes": 3, "characters": 1, "priority": false}
  description text,
  position int not null, -- Sort order
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
enable row level security on public.mol_plans;

-- Subscriptions: Track user subscription to a plan
create table if not exists public.mol_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.mol_profiles on delete cascade not null,
  plan_id uuid references public.mol_plans not null,
  stripe_subscription_id text, -- Stripe subscription ID (null for free tier)
  stripe_customer_id text, -- Stripe customer ID
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  credits_remaining numeric not null default 0, -- Unused credits this month
  monthly_usage_usd numeric not null default 0, -- Spent this month
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
enable row level security on public.mol_subscriptions;

-- Invoices: Billing history
create table if not exists public.mol_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.mol_profiles on delete cascade not null,
  stripe_invoice_id text unique, -- Stripe Invoice ID
  amount_usd numeric not null, -- Total invoice amount
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  pdf_url text, -- URL to downloadable PDF
  stripe_hosted_url text, -- Stripe-hosted invoice link
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
enable row level security on public.mol_invoices;

-- Usage Metrics: Detailed cost tracking per project
create table if not exists public.mol_usage_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.mol_profiles on delete cascade not null,
  project_id uuid references public.mol_projects on delete cascade,
  job_id uuid references public.mol_jobs on delete cascade,
  metric_type text not null check (metric_type in ('audio_master', 'stem_sep', 'video_gen', 'image_gen', 'character', 'storage')),
  quantity numeric not null, -- Minutes, count, etc.
  cost_usd numeric not null, -- Actual cost charged
  price_per_unit_usd numeric not null, -- Unit cost at time of usage
  month_year text not null, -- 'YYYY-MM' for grouping
  created_at timestamptz not null default now()
);
create index if not exists idx_mol_usage_metrics_user_month on public.mol_usage_metrics(user_id, month_year);
create index if not exists idx_mol_usage_metrics_project_month on public.mol_usage_metrics(project_id, month_year);
enable row level security on public.mol_usage_metrics;

-- Pricing History: Audit trail of cost changes
create table if not exists public.mol_pricing_history (
  id uuid primary key default gen_random_uuid(),
  metric_type text not null,
  price_per_unit_usd numeric not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  reason text, -- 'launch', 'promotional', 'increase', etc.
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- Row-Level Security Policies
-- ==============================================================================

-- mol_plans: Public read, admin write
alter table public.mol_plans enable row level security;
create policy "plans_read_public" on public.mol_plans for select using (true);

-- mol_subscriptions: Users see only their own
create policy "subscriptions_read_own" on public.mol_subscriptions for select
  using (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.mol_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- mol_invoices: Users see only their own
create policy "invoices_read_own" on public.mol_invoices for select
  using (auth.uid() = user_id);

-- mol_usage_metrics: Users see only their own
create policy "usage_metrics_read_own" on public.mol_usage_metrics for select
  using (auth.uid() = user_id);

-- ==============================================================================
-- Triggers and Functions
-- ==============================================================================

-- Auto-update subscription credits at month boundary
create or replace function public.reset_monthly_credits()
returns trigger as $$
begin
  -- Reset credits to plan's monthly allowance at period start
  if new.current_period_start != old.current_period_start then
    new.credits_remaining := (select credits_monthly from public.mol_plans where id = new.plan_id);
    new.monthly_usage_usd := 0;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger reset_credits_on_period_change
  before update on public.mol_subscriptions
  for each row
  execute function public.reset_monthly_credits();

-- Update subscription usage when job completes
create or replace function public.update_subscription_usage()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.mol_subscriptions
    set monthly_usage_usd = monthly_usage_usd + coalesce(new.cost_usd, 0),
        credits_remaining = credits_remaining - coalesce(new.cost_usd, 0),
        updated_at = now()
    where user_id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_usage_on_job_complete
  after update on public.mol_jobs
  for each row
  execute function public.update_subscription_usage();

-- ==============================================================================
-- Initial Plan Seed Data
-- ==============================================================================

insert into public.mol_plans (name, display_name, price_monthly_usd, credits_monthly, features, description, position)
values
  ('free', 'Free', 0, 20, '{"audio_minutes": 5, "video_minutes": 0, "characters": 0, "monthly": true}', 'Get started with audio mastering', 1),
  ('creator', 'Creator', 29, 100, '{"audio_minutes": 999, "video_minutes": 3, "characters": 1, "monthly": true}', 'Perfect for creators and musicians', 2),
  ('studio', 'Studio', 99, 500, '{"audio_minutes": 999, "video_minutes": 15, "characters": 5, "monthly": true}', 'For professional studios', 3),
  ('professional', 'Professional', 299, -1, '{"audio_minutes": 999, "video_minutes": 999, "characters": 999, "priority": true}', 'Unlimited access for professionals', 4)
on conflict (name) do nothing;

-- ==============================================================================
-- Cost Reference: Per-unit pricing (informational, enforced in app logic)
-- ==============================================================================
-- audio_master: $0.05 per minute
-- stem_sep: $0.03 per minute
-- video_gen: $0.50 per minute (fal.ai LTX-Video ~$0.30, platform fee)
-- image_gen: $0.10 per image (fal.ai SDXL)
-- character: $5.00 per character (one-time creation cost)
-- storage: $0.01 per GB per month (R2 base rate + platform fee)
