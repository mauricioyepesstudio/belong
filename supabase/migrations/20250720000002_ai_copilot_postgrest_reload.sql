-- Repair: PostgREST must reload after ai_copilot_actions was created.
-- Without this, the table can exist in Postgres while the API returns PGRST205.

notify pgrst, 'reload schema';
