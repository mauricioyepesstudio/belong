-- Direct messages are available only between accepted connections.
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
