-- BELONG: Stripe billing, payments, marketplace
-- Migration: 20250715000011_stripe_billing

alter type public.notification_type add value if not exists 'payment';

create type public.subscription_tier as enum ('free', 'pro', 'creator');
create type public.subscription_status as enum (
  'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'
);
create type public.payment_type as enum (
  'platform_subscription',
  'community_subscription',
  'project_funding',
  'donation',
  'marketplace_purchase',
  'creator_tip'
);
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type public.listing_status as enum ('draft', 'active', 'sold', 'archived');

-- User billing fields
alter table public.users
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_tier public.subscription_tier not null default 'free',
  add column if not exists stripe_connect_account_id text unique,
  add column if not exists connect_charges_enabled boolean not null default false,
  add column if not exists connect_payouts_enabled boolean not null default false;

create index if not exists users_stripe_customer_idx on public.users(stripe_customer_id);

-- Community monetization
alter table public.communities
  add column if not exists is_paid boolean not null default false,
  add column if not exists subscription_price_cents integer check (subscription_price_cents is null or subscription_price_cents >= 100),
  add column if not exists stripe_price_id text,
  add column if not exists stripe_product_id text;

-- Project funding
alter table public.projects
  add column if not exists funding_enabled boolean not null default false,
  add column if not exists funding_goal_cents integer check (funding_goal_cents is null or funding_goal_cents >= 100),
  add column if not exists funding_raised_cents integer not null default 0 check (funding_raised_cents >= 0);

-- Platform & community subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_type text not null check (subscription_type in ('platform', 'community')),
  status public.subscription_status not null default 'incomplete',
  stripe_subscription_id text unique,
  stripe_customer_id text,
  community_id uuid references public.communities(id) on delete cascade,
  price_cents integer,
  currency text not null default 'usd',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, community_id)
);

create index subscriptions_user_idx on public.subscriptions(user_id);
create index subscriptions_stripe_idx on public.subscriptions(stripe_subscription_id);
create index subscriptions_community_idx on public.subscriptions(community_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- One-time payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete set null,
  payment_type public.payment_type not null,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 50),
  currency text not null default 'usd',
  platform_fee_cents integer not null default 0,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_payer_idx on public.payments(payer_id, created_at desc);
create index payments_recipient_idx on public.payments(recipient_id, created_at desc);
create index payments_target_idx on public.payments(target_type, target_id);
create index payments_stripe_session_idx on public.payments(stripe_checkout_session_id);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- Marketplace listings
create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 100),
  currency text not null default 'usd',
  stripe_price_id text,
  stripe_product_id text,
  image_url text,
  status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketplace_listings_seller_idx on public.marketplace_listings(seller_id);
create index marketplace_listings_status_idx on public.marketplace_listings(status, created_at desc);

create trigger marketplace_listings_updated_at
  before update on public.marketplace_listings
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.marketplace_listings enable row level security;

create policy "Users view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Community owners view community subscriptions"
  on public.subscriptions for select
  using (
    community_id is not null
    and exists (
      select 1 from public.communities c
      where c.id = subscriptions.community_id and c.owner_id = auth.uid()
    )
  );

create policy "Users view own payments"
  on public.payments for select
  using (auth.uid() = payer_id or auth.uid() = recipient_id);

create policy "Anyone view active marketplace listings"
  on public.marketplace_listings for select
  using (status = 'active' or auth.uid() = seller_id);

create policy "Sellers manage own listings"
  on public.marketplace_listings for insert
  with check (auth.uid() = seller_id);

create policy "Sellers update own listings"
  on public.marketplace_listings for update
  using (auth.uid() = seller_id);

create policy "Sellers delete own listings"
  on public.marketplace_listings for delete
  using (auth.uid() = seller_id);

-- Webhook idempotency log
create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Only service role accesses webhook events (no user policies)

-- Atomic funding increment
create or replace function public.increment_project_funding(
  p_project_id uuid,
  p_amount_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
  set funding_raised_cents = funding_raised_cents + p_amount_cents
  where id = p_project_id;
end;
$$;
