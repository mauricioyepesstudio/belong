-- BELONG Social Core V1
-- Canonical authored social posts. Existing community_posts/project_posts remain unchanged.

create type public.social_post_type as enum (
  'text',
  'photo',
  'video',
  'project_update',
  'community_update',
  'needs_help',
  'impact'
);

create type public.social_media_type as enum ('image', 'video');

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  post_type public.social_post_type not null default 'text',
  body text not null default '',
  community_id uuid references public.communities(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  media_url text,
  media_path text,
  media_type public.social_media_type,
  media_mime_type text,
  media_size_bytes bigint,
  media_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_one_context check (
    not (community_id is not null and project_id is not null)
  ),
  constraint social_posts_body_or_media check (
    length(btrim(body)) > 0 or media_path is not null
  ),
  constraint social_posts_media_complete check (
    (media_url is null and media_path is null and media_type is null
      and media_mime_type is null and media_size_bytes is null)
    or
    (media_path is not null and media_type is not null
      and media_mime_type is not null and media_size_bytes is not null)
  ),
  constraint social_posts_media_size check (
    media_size_bytes is null
    or (
      media_size_bytes > 0
      and (
        (media_type = 'image' and media_size_bytes <= 5242880)
        or (media_type = 'video' and media_size_bytes <= 52428800)
      )
    )
  ),
  constraint social_posts_type_media check (
    (post_type = 'photo' and media_type = 'image')
    or (post_type = 'video' and media_type = 'video')
    or (post_type not in ('photo', 'video'))
  ),
  constraint social_posts_media_owner_path check (
    media_path is null or split_part(media_path, '/', 1) = author_id::text
  )
);

create table public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null default 'support' check (reaction = 'support'),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create index social_posts_author_created_idx
  on public.social_posts(author_id, created_at desc, id desc);
create index social_posts_community_created_idx
  on public.social_posts(community_id, created_at desc, id desc)
  where community_id is not null;
create index social_posts_project_created_idx
  on public.social_posts(project_id, created_at desc, id desc)
  where project_id is not null;
create index social_posts_created_idx
  on public.social_posts(created_at desc, id desc);
create unique index social_posts_media_path_unique_idx
  on public.social_posts(media_path)
  where media_path is not null;
create index social_post_comments_post_created_idx
  on public.social_post_comments(post_id, created_at asc, id asc);
create index social_post_reactions_post_idx
  on public.social_post_reactions(post_id);

alter table public.social_posts enable row level security;
alter table public.social_post_comments enable row level security;
alter table public.social_post_reactions enable row level security;

create or replace function public.can_view_social_post(p_post public.social_posts)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    p_post.author_id = auth.uid()
    or p_post.community_id is null and p_post.project_id is null
    or (
      p_post.community_id is not null
      and exists (
        select 1
        from public.community_members cm
        where cm.community_id = p_post.community_id
          and cm.user_id = auth.uid()
      )
    )
    or (
      p_post.project_id is not null
      and exists (
        select 1
        from public.project_members pm
        where pm.project_id = p_post.project_id
          and pm.user_id = auth.uid()
      )
    );
$$;

create policy "Authenticated users view visible social posts"
  on public.social_posts for select
  to authenticated
  using (public.can_view_social_post(social_posts));

create policy "Users create own eligible social posts"
  on public.social_posts for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (
      (community_id is null and project_id is null)
      or (
        community_id is not null
        and exists (
          select 1 from public.community_members cm
          where cm.community_id = social_posts.community_id
            and cm.user_id = auth.uid()
        )
      )
      or (
        project_id is not null
        and exists (
          select 1 from public.project_members pm
          where pm.project_id = social_posts.project_id
            and pm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Authors update own social posts"
  on public.social_posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (
      (community_id is null and project_id is null)
      or (
        community_id is not null
        and exists (
          select 1 from public.community_members cm
          where cm.community_id = social_posts.community_id
            and cm.user_id = auth.uid()
        )
      )
      or (
        project_id is not null
        and exists (
          select 1 from public.project_members pm
          where pm.project_id = social_posts.project_id
            and pm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Authors delete own social posts"
  on public.social_posts for delete
  to authenticated
  using (auth.uid() = author_id);

create policy "Users view comments on visible social posts"
  on public.social_post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.social_posts p
      where p.id = social_post_comments.post_id
        and public.can_view_social_post(p)
    )
  );

create policy "Users create own comments on visible social posts"
  on public.social_post_comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.social_posts p
      where p.id = social_post_comments.post_id
        and public.can_view_social_post(p)
    )
  );

create policy "Comment authors update own comments"
  on public.social_post_comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Comment authors delete own comments"
  on public.social_post_comments for delete
  to authenticated
  using (auth.uid() = author_id);

create policy "Users view reactions on visible social posts"
  on public.social_post_reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.social_posts p
      where p.id = social_post_reactions.post_id
        and public.can_view_social_post(p)
    )
  );

create policy "Users support visible social posts"
  on public.social_post_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and reaction = 'support'
    and exists (
      select 1 from public.social_posts p
      where p.id = social_post_reactions.post_id
        and public.can_view_social_post(p)
    )
  );

create policy "Users remove own social post support"
  on public.social_post_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_read_social_media(p_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() is not null
    and (
      split_part(p_path, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.social_posts p
        where p.media_path = p_path
          and (
            p.author_id = auth.uid()
            or (p.community_id is null and p.project_id is null)
            or (
              p.community_id is not null
              and exists (
                select 1
                from public.community_members cm
                where cm.community_id = p.community_id
                  and cm.user_id = auth.uid()
              )
            )
            or (
              p.project_id is not null
              and exists (
                select 1
                from public.project_members pm
                where pm.project_id = p.project_id
                  and pm.user_id = auth.uid()
              )
            )
          )
      )
    );
$$;

revoke all on function public.can_read_social_media(text) from public;
revoke all on function public.can_read_social_media(text) from anon;
grant execute on function public.can_read_social_media(text) to authenticated;

create policy "Authorized users read social media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-media'
    and public.can_read_social_media(name)
  );

create policy "Users upload social media to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own social media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own social media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

alter publication supabase_realtime add table public.social_posts;
alter publication supabase_realtime add table public.social_post_comments;
alter publication supabase_realtime add table public.social_post_reactions;

-- Active connection pairs are canonical regardless of request direction.
-- Existing duplicate active pairs must be resolved before this migration can apply.
create unique index connections_active_unordered_pair_idx
  on public.connections (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  )
  where status in ('pending', 'accepted');

drop policy if exists "Recipients update connection status" on public.connections;
create policy "Recipients update connection status"
  on public.connections for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

revoke update on public.connections from authenticated;
grant update(status) on public.connections to authenticated;

-- Conversation membership checks must not recursively evaluate
-- conversation_participants RLS. This definer helper derives the caller from
-- auth.uid() and exposes only a boolean membership predicate.
create or replace function public.is_conversation_participant(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = p_conversation_id
        and cp.user_id = auth.uid()
    );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
revoke all on function public.is_conversation_participant(uuid) from anon;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

drop policy if exists "Participants view conversations" on public.conversations;
create policy "Participants view conversations"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_participant(id));

drop policy if exists "Authenticated users create conversations" on public.conversations;
revoke insert, update, delete on public.conversations from authenticated;

drop policy if exists "Participants view membership"
  on public.conversation_participants;
create policy "Participants view membership"
  on public.conversation_participants for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Users join conversations"
  on public.conversation_participants;
revoke insert, update, delete
  on public.conversation_participants
  from authenticated;

drop policy if exists "Participants view messages" on public.messages;
create policy "Participants view messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and public.is_conversation_participant(conversation_id)
  )
  with check (
    sender_id <> auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

revoke update on public.messages from authenticated;
grant update(read_at) on public.messages to authenticated;

-- Serialize canonical direct-conversation creation for an unordered user pair.
create or replace function public.create_conversation_with_user(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
  v_existing uuid;
  v_pair_key text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'Invalid user';
  end if;

  if not exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = v_user_id and c.recipient_id = p_other_user_id)
        or (c.requester_id = p_other_user_id and c.recipient_id = v_user_id)
      )
  ) then
    raise exception 'Accepted connection required';
  end if;

  v_pair_key :=
    least(v_user_id::text, p_other_user_id::text)
    || ':'
    || greatest(v_user_id::text, p_other_user_id::text);
  perform pg_advisory_xact_lock(hashtextextended(v_pair_key, 0));

  select cp1.conversation_id into v_existing
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp2.conversation_id = cp1.conversation_id
  where cp1.user_id = v_user_id
    and cp2.user_id = p_other_user_id
    and (
      select count(*)
      from public.conversation_participants members
      where members.conversation_id = cp1.conversation_id
    ) = 2
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.conversations default values
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke execute on function public.create_conversation_with_user(uuid) from public;
revoke execute on function public.create_conversation_with_user(uuid) from anon;
grant execute on function public.create_conversation_with_user(uuid) to authenticated;
