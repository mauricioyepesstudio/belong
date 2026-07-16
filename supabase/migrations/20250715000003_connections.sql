-- BELONG: connections
-- Migration: 20250715000003_connections

create type public.connection_status as enum ('pending', 'accepted', 'declined');

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_no_self check (requester_id != recipient_id),
  constraint connections_unique_pair unique (requester_id, recipient_id)
);

create index connections_requester_idx on public.connections(requester_id);
create index connections_recipient_idx on public.connections(recipient_id);

create trigger connections_updated_at
  before update on public.connections
  for each row execute function public.handle_updated_at();

alter table public.connections enable row level security;

create policy "Users view own connections"
  on public.connections for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users create connection requests"
  on public.connections for insert
  with check (auth.uid() = requester_id);

create policy "Recipients update connection status"
  on public.connections for update
  using (auth.uid() = recipient_id or auth.uid() = requester_id);

create policy "Users delete own connections"
  on public.connections for delete
  using (auth.uid() = requester_id or auth.uid() = recipient_id);
