-- BELONG demo seed entrypoint (delegates to modular seed files)
-- Runs automatically on: npm run db:reset
-- Demo login: sarah@demo.belong.app / BelongDemo2026!

\ir seeds/01-users.sql
\ir seeds/02-communities.sql
\ir seeds/03-projects.sql
\ir seeds/04-events.sql
\ir seeds/05-posts.sql
\ir seeds/06-missions.sql
