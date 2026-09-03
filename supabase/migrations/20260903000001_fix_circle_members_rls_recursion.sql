-- BELONG: fix infinite recursion (Postgres 42P17) in
-- accountability_circle_members RLS policies.
--
-- "Circle members view the roster" and "Active members or creator invite
-- new members" both queried accountability_circle_members from *within*
-- accountability_circle_members's own policy — evaluating that subquery
-- re-triggers the same SELECT policy, which queries the table again, ad
-- infinitum. This is the standard Postgres RLS self-reference trap; the
-- fix is a SECURITY DEFINER helper that performs the membership lookup
-- with RLS bypassed, so the check never re-enters policy evaluation.

create or replace function public.is_circle_member(
  p_circle_id uuid,
  p_user_id uuid,
  p_status text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.accountability_circle_members m
    where m.circle_id = p_circle_id
      and m.user_id = p_user_id
      and (p_status is null or m.status = p_status)
  );
$$;

comment on function public.is_circle_member(uuid, uuid, text) is
  'RLS-bypassing membership lookup for accountability_circle_members, used only from within that table''s own policies to avoid self-referential recursion (42P17). p_status null means any status.';

revoke all on function public.is_circle_member(uuid, uuid, text) from public;
grant execute on function public.is_circle_member(uuid, uuid, text) to authenticated;

drop policy if exists "Circle members view the roster" on public.accountability_circle_members;
create policy "Circle members view the roster"
  on public.accountability_circle_members for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_circle_member(accountability_circle_members.circle_id, auth.uid())
  );

drop policy if exists "Active members or creator invite new members" on public.accountability_circle_members;
create policy "Active members or creator invite new members"
  on public.accountability_circle_members for insert
  to authenticated
  with check (
    status = 'invited'
    and (
      public.is_circle_member(accountability_circle_members.circle_id, auth.uid(), 'active')
      or exists (
        select 1 from public.accountability_circles c
        where c.id = accountability_circle_members.circle_id
          and c.creator_id = auth.uid()
      )
    )
  );
