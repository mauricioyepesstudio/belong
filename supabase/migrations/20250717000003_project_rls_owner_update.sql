-- Fix project UPDATE RLS: owner-only (match communities pattern)
-- Migration: 20250717000003_project_rls_owner_update

drop policy if exists "Owners and members update projects" on public.projects;

create policy "Owners update projects"
  on public.projects for update
  using (auth.uid() = owner_id);
