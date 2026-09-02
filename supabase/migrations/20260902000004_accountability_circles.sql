-- BELONG: Accountability Circles (Circulos de Rendicion de Cuentas) V1 -- Slice A
-- Small private groups (4-6 people) formed around ONE shared, concrete goal,
-- invite-only. This is a new, standalone data model: the existing mission
-- tables are strictly single-owner and have no shared-goal entity to FK into.
-- Check-ins are explicitly out of scope for this slice.

create table public.accountability_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  goal_description text not null check (length(btrim(goal_description)) > 0),
  creator_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accountability_circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.accountability_circles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active', 'left')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

create index accountability_circles_creator_idx on public.accountability_circles(creator_id);
create index accountability_circle_members_circle_idx
  on public.accountability_circle_members(circle_id);
create index accountability_circle_members_user_idx
  on public.accountability_circle_members(user_id);

create trigger accountability_circles_updated_at
  before update on public.accountability_circles
  for each row execute function public.handle_updated_at();

alter table public.accountability_circles enable row level security;
alter table public.accountability_circle_members enable row level security;

-- accountability_circles policies -------------------------------------------

-- Circles are private: visible only to their creator and to invited/active
-- members, unlike public communities.
create policy "Members and creator view their circles"
  on public.accountability_circles for select
  to authenticated
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from public.accountability_circle_members m
      where m.circle_id = accountability_circles.id
        and m.user_id = auth.uid()
        and m.status in ('invited', 'active')
    )
  );

create policy "Authenticated users create circles"
  on public.accountability_circles for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Creator updates their circle"
  on public.accountability_circles for update
  to authenticated
  using (auth.uid() = creator_id);

create policy "Creator deletes their circle"
  on public.accountability_circles for delete
  to authenticated
  using (auth.uid() = creator_id);

-- accountability_circle_members policies -------------------------------------

-- Any member of a circle (invited or active) can see the full roster, so
-- invited members can see who else is already in the circle before
-- accepting. A user can always see their own row regardless of status.
create policy "Circle members view the roster"
  on public.accountability_circle_members for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.accountability_circle_members m
      where m.circle_id = accountability_circle_members.circle_id
        and m.user_id = auth.uid()
    )
  );

-- Only an already-active member, or the circle's creator (who has not
-- necessarily accepted their own membership row yet -- this also covers
-- circle creation bootstrap), may invite a new member. New rows always
-- start as 'invited'; direct-active inserts are never allowed via RLS.
create policy "Active members or creator invite new members"
  on public.accountability_circle_members for insert
  to authenticated
  with check (
    status = 'invited'
    and (
      exists (
        select 1 from public.accountability_circle_members m2
        where m2.circle_id = accountability_circle_members.circle_id
          and m2.user_id = auth.uid()
          and m2.status = 'active'
      )
      or exists (
        select 1 from public.accountability_circles c
        where c.id = accountability_circle_members.circle_id
          and c.creator_id = auth.uid()
      )
    )
  );

-- A user may only update their own membership row, and only to accept an
-- invite (invited -> active). No other transition is permitted via RLS.
create policy "Members accept their own invite"
  on public.accountability_circle_members for update
  to authenticated
  using (auth.uid() = user_id and status = 'invited')
  with check (auth.uid() = user_id and status = 'active');

revoke update on public.accountability_circle_members from authenticated;
grant update(status, joined_at) on public.accountability_circle_members to authenticated;

-- A member may remove themselves (leaving or declining an invite); the
-- circle's creator may remove any member's row.
create policy "Members leave or creator removes a member"
  on public.accountability_circle_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.accountability_circles c
      where c.id = accountability_circle_members.circle_id
        and c.creator_id = auth.uid()
    )
  );
