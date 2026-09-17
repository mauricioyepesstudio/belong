-- BELONG: circle invite notifications
-- Migration: 20260916000001_circle_invite_notifications
--
-- Every other invite-like flow (connections, communities, projects, events,
-- messages) calls public.create_notification() so the other party finds out
-- without having to go looking. Accountability Circles never got this:
-- lib/actions/circles.ts inserts the invited membership row and stops --
-- the invitee only learns about it if they happen to open /circles. This
-- adds the missing enum value (mirrors how 'payment' was added for Stripe
-- billing in 20250715000011_stripe_billing.sql) so circles.ts can notify
-- invitees the same way every other invite flow already does.

alter type public.notification_type add value if not exists 'circle';
