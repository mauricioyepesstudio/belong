-- BELONG: marketplace listing media storage
-- Migration: 20260902000002_marketplace_listing_media

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Listing images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'listing-media');

create policy "Users can upload own listing image"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own listing image"
  on storage.objects for update
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own listing image"
  on storage.objects for delete
  using (
    bucket_id = 'listing-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
