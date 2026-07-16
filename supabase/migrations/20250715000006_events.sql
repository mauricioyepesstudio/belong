-- BELONG: events
-- Migration: 20250715000006_events

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  community_id uuid references public.communities(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index events_starts_at_idx on public.events(starts_at);
create index events_community_idx on public.events(community_id);
create index event_registrations_user_idx on public.event_registrations(user_id);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

create policy "Anyone can view events"
  on public.events for select using (true);

create policy "Authenticated users create events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Creators update events"
  on public.events for update
  using (auth.uid() = created_by);

create policy "Creators delete events"
  on public.events for delete
  using (auth.uid() = created_by);

create policy "Anyone can view registrations"
  on public.event_registrations for select using (true);

create policy "Users register for events"
  on public.event_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users cancel registration"
  on public.event_registrations for delete
  using (auth.uid() = user_id);
