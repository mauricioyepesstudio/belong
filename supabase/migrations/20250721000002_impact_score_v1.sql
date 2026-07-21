-- Impact Score v1 — participation event types

alter type public.impact_event_module add value if not exists 'event';

alter type public.impact_event_type add value if not exists 'helpful_reaction_received';
alter type public.impact_event_type add value if not exists 'event_organized';
alter type public.impact_event_type add value if not exists 'profile_completed';
alter type public.impact_event_type add value if not exists 'collaboration_started';
