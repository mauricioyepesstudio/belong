-- BELONG: shareable invite links for Accountability Circles
-- Migration: 20261030000001_circle_invite_links
--
-- Circles are invite-only and every invite targets one existing connection
-- (lib/actions/circles.ts inviteToCircle). An organization piloting a circle
-- with its own group (cohort, youth group, lab) has no connections on BELONG
-- yet, so it cannot fill the circle. This adds an optional invite code the
-- creator can turn on or off; anyone signed in who opens the link can see
-- the circle's name and goal and join, up to the existing member cap.
--
-- Joining happens through SECURITY DEFINER functions because the member
-- insert policy only lets the creator or an active member add rows, and
-- only as 'invited'. The functions re-check the cap under a row lock.

alter table public.accountability_circles
  add column invite_code text unique
    check (invite_code is null or invite_code ~ '^[a-z0-9]{12,32}$');

comment on column public.accountability_circles.invite_code is
  'Optional shareable join code. null = link off. Set and cleared by the creator via the existing "Creator updates their circle" policy.';

-- Read-only preview for someone who is not a member yet (circle RLS would
-- hide the row). Returns nothing for an unknown or disabled code.
create or replace function public.circle_invite_preview(p_code text)
returns table (circle_id uuid, name text, goal_description text, member_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.goal_description,
    (
      select count(*)::integer
      from public.accountability_circle_members m
      where m.circle_id = c.id
        and m.status in ('invited', 'active')
    )
  from public.accountability_circles c
  where p_code is not null
    and c.invite_code = lower(p_code);
$$;

revoke all on function public.circle_invite_preview(text) from public;
grant execute on function public.circle_invite_preview(text) to authenticated;

-- Join the circle behind p_code as the calling user. Returns the circle id.
-- Errors: 'circle_link_invalid' (unknown/disabled code), 'circle_full'
-- (cap of 6 active + invited reached, mirrors CIRCLE_MAX_MEMBERS).
create or replace function public.join_circle_by_invite_code(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_circle_id uuid;
  v_status text;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select c.id into v_circle_id
  from public.accountability_circles c
  where p_code is not null
    and c.invite_code = lower(p_code)
  for update;

  if v_circle_id is null then
    raise exception 'circle_link_invalid' using errcode = 'P0002';
  end if;

  select m.status into v_status
  from public.accountability_circle_members m
  where m.circle_id = v_circle_id
    and m.user_id = v_user_id;

  if v_status = 'active' then
    return v_circle_id;
  end if;

  if v_status = 'invited' then
    update public.accountability_circle_members
      set status = 'active', joined_at = now()
      where circle_id = v_circle_id and user_id = v_user_id;
    return v_circle_id;
  end if;

  select count(*)::integer into v_count
  from public.accountability_circle_members m
  where m.circle_id = v_circle_id
    and m.status in ('invited', 'active');

  if v_count >= 6 then
    raise exception 'circle_full' using errcode = 'P0001';
  end if;

  insert into public.accountability_circle_members (circle_id, user_id, role, status, joined_at)
  values (v_circle_id, v_user_id, 'member', 'active', now())
  on conflict (circle_id, user_id)
    do update set status = 'active', joined_at = now();

  return v_circle_id;
end;
$$;

revoke all on function public.join_circle_by_invite_code(text) from public;
grant execute on function public.join_circle_by_invite_code(text) to authenticated;
