-- Journey completion: conversations RPC, post images, community moderation policies

-- Fix messaging: allow creating a DM with both participants
create or replace function public.create_conversation_with_user(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
  v_existing uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'Invalid user';
  end if;

  select cp1.conversation_id into v_existing
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp2.conversation_id = cp1.conversation_id
  where cp1.user_id = v_user_id
    and cp2.user_id = p_other_user_id
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.conversations default values returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

grant execute on function public.create_conversation_with_user(uuid) to authenticated;

-- Post images
alter table public.community_posts
  add column if not exists image_url text;

alter table public.project_posts
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users upload post images to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own post images"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Community managers can add members
create policy "Owners and admins add community members"
  on public.community_members for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = community_members.community_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'admin')
    )
  );

-- Community managers can delete any post in their community
create policy "Community managers delete posts"
  on public.community_posts for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = community_posts.community_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'admin')
    )
  );
