-- BELONG: rate limiting for auth actions
-- Migration: 20261006000001_auth_rate_limits
--
-- Fixed-window counters for login / signup / password-reset attempts.
-- Keys are opaque strings built by engines/auth/rate-limit.ts (action plus a
-- SHA-256 of the email or IP), so no raw email or IP is stored here.
-- RLS is on with no policies, and the function is executable by service_role
-- only: lib/actions/auth.ts calls it with the admin client, so browsers cannot
-- reset their own counters or lock other people's accounts.

create table if not exists public.auth_rate_limits (
  key text primary key check (length(key) <= 200),
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);

alter table public.auth_rate_limits enable row level security;

-- Records one attempt for p_key and returns true while the key is still
-- within p_max attempts for the current p_window_seconds window.
create or replace function public.consume_auth_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
) returns boolean
language plpgsql
strict
security definer
set search_path = ''
as $$
declare
  v_window interval;
  v_attempts integer;
begin
  if p_max <= 0 or p_window_seconds <= 0 then
    raise exception 'consume_auth_rate_limit: p_max and p_window_seconds must be positive';
  end if;
  v_window := make_interval(secs => p_window_seconds);

  -- Opportunistic cleanup so the table stays small without a cron job.
  delete from public.auth_rate_limits where window_start < now() - interval '1 day';

  insert into public.auth_rate_limits as r (key, window_start, attempts)
  values (p_key, now(), 1)
  on conflict (key) do update
    set attempts = case when r.window_start < now() - v_window then 1 else r.attempts + 1 end,
        window_start = case when r.window_start < now() - v_window then now() else r.window_start end
  returning attempts into v_attempts;

  return v_attempts <= p_max;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, integer, integer) to service_role;

create index if not exists auth_rate_limits_window_start_idx
  on public.auth_rate_limits (window_start);
