-- BELONG Impact Passport V1
-- Two-sided-confirmed collaboration records: "what was done, with whom".
-- A record only becomes real once the partner confirms it; the proposer
-- can never confirm their own record. Public export page is out of scope
-- for this slice.

create table public.collaboration_records (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.users(id) on delete cascade,
  partner_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  summary text not null check (length(btrim(summary)) > 0),
  project_id uuid references public.projects(id) on delete set null,
  community_id uuid references public.communities(id) on delete set null,
  proposed_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collaboration_records_distinct_parties check (proposer_id <> partner_id),
  constraint collaboration_records_one_context check (
    not (community_id is not null and project_id is not null)
  )
);

-- At most one pending proposal per unordered pair of users at a time.
create unique index collaboration_records_pending_pair_idx
  on public.collaboration_records (
    least(proposer_id, partner_id),
    greatest(proposer_id, partner_id)
  )
  where status = 'pending';

create index collaboration_records_proposer_idx
  on public.collaboration_records(proposer_id, created_at desc, id desc);
create index collaboration_records_partner_idx
  on public.collaboration_records(partner_id, created_at desc, id desc);
create index collaboration_records_project_idx
  on public.collaboration_records(project_id)
  where project_id is not null;
create index collaboration_records_community_idx
  on public.collaboration_records(community_id)
  where community_id is not null;

create trigger collaboration_records_updated_at
  before update on public.collaboration_records
  for each row execute function public.handle_updated_at();

alter table public.collaboration_records enable row level security;

create policy "Participants view own collaboration records"
  on public.collaboration_records for select
  to authenticated
  using (auth.uid() = proposer_id or auth.uid() = partner_id);

create policy "Proposers create pending collaboration records"
  on public.collaboration_records for insert
  to authenticated
  with check (auth.uid() = proposer_id and status = 'pending');

-- Only the partner can respond, and only while the record is still
-- pending. Since proposer_id <> partner_id is enforced above, the
-- proposer can never satisfy auth.uid() = partner_id -- self-confirmation
-- is structurally impossible, not just app-layer enforced.
create policy "Partners respond to pending collaboration records"
  on public.collaboration_records for update
  to authenticated
  using (auth.uid() = partner_id and status = 'pending')
  with check (auth.uid() = partner_id and status in ('confirmed', 'declined'));

revoke update on public.collaboration_records from authenticated;
grant update(status, responded_at) on public.collaboration_records to authenticated;

-- A proposer may withdraw an unanswered proposal; confirmed/declined
-- records are permanent history and cannot be deleted.
create policy "Proposers withdraw pending collaboration records"
  on public.collaboration_records for delete
  to authenticated
  using (auth.uid() = proposer_id and status = 'pending');
