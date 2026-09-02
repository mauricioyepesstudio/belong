-- BELONG: marketplace listing category
-- Migration: 20260902000003_marketplace_listing_category
--
-- Adds a real, seller-chosen category to marketplace_listings. Previously the
-- "category" filter chips in the marketplace UI were computed client-side by
-- guessing at the listing's title/description text (see listingCategory() in
-- engines/marketplace/components/marketplace-screen.tsx) -- nothing was
-- persisted. This column is nullable so existing rows are unaffected; the
-- UI's text-guess heuristic can remain as a fallback display label only for
-- legacy rows where category is null, until a category picker is added to
-- the create-listing flow.

alter table public.marketplace_listings
  add column category text
    constraint marketplace_listings_category_check
    check (
      category is null
      or category in (
        'Services',
        'Tools & templates',
        'Guidance',
        'Learning',
        'Funding & launch'
      )
    );

create index marketplace_listings_category_idx
  on public.marketplace_listings(category);
