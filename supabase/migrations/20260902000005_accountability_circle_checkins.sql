-- BELONG: Accountability Circles -- Slice B (check-ins)
-- The actual accountability mechanic: members post free-text check-ins into
-- their circle. Day labels are derived client-side from created_at -- there
-- is no stored cadence field. Check-ins are immutable once posted (no
-- update policy) and are not cascade-deleted when a member leaves; history
-- persists even after the membership row is removed.

create table public.accountability_checkins (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.accountability_circles(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index accountability_checkins_circle_created_idx
  on public.accountability_checkins(circle_id, created_at desc);

alter table public.accountability_checkins enable row level security;

-- accountability_checkins policies -------------------------------------------

-- Only an active member of the circle may read its check-ins.
create policy "Active members view circle checkins"
  on public.accountability_checkins for select
  to authenticated
  using (
    exists (
      select 1 from public.accountability_circle_members m
      where m.circle_id = accountability_checkins.circle_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Only an active member may post, and only as themselves.
create policy "Active members post circle checkins"
  on public.accountability_checkins for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.accountability_circle_members m
      where m.circle_id = accountability_checkins.circle_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- No update policy: check-ins are immutable once posted.

-- Only the author may delete their own check-in. Leaving the circle does not
-- cascade-delete their prior check-ins -- history persists regardless of
-- current membership status.
create policy "Author deletes their own checkin"
  on public.accountability_checkins for delete
  to authenticated
  using (auth.uid() = author_id);
