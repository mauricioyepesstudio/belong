-- BELONG: notifications
-- Migration: 20250715000008_notifications

create type public.notification_type as enum (
  'connection',
  'project',
  'event',
  'community',
  'message',
  'system'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text,
  type public.notification_type not null default 'system',
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System inserts notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Helper: create notification for another user (via security definer function)
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type public.notification_type default 'system',
  p_metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, title, body, type, metadata)
  values (p_user_id, p_title, p_body, p_type, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;
