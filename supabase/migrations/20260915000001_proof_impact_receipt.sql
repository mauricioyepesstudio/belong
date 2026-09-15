-- BELONG: Proof Loop Impact Receipt
-- Migration: 20260915000001
--
-- Extends the existing Impact Engine enums (impact_event_module,
-- impact_event_type — see 20250718000001_identity_reputation_engine.sql)
-- so a resolved Proof can record an Impact Receipt through the same
-- impact_events table every other module already uses, instead of a new
-- subsystem. Follows the same additive pattern as
-- 20250718000002_project_workspace_sprint3b.sql and
-- 20250719000001_organization_engine_sprint4a.sql.

alter type public.impact_event_module add value if not exists 'proof';

alter type public.impact_event_type add value if not exists 'proof_claim_created';
alter type public.impact_event_type add value if not exists 'proof_resolved';
