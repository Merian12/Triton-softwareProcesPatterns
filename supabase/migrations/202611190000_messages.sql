begin;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index messages_sender_created on public.messages(sender_id, created_at);
create index messages_recipient_created on public.messages(recipient_id, created_at);
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
create policy participants_read on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Narrow RPCs keep profile-directory access private and derive the sender from the session.
create function public.send_message(recipient_email text, message_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  select p.id into recipient from public.profiles p
    where lower(p.email) = lower(btrim(recipient_email));
  if recipient is null then raise exception 'Recipient not found.'; end if;
  if recipient = auth.uid() then raise exception 'You cannot message yourself.'; end if;
  insert into public.messages(sender_id, recipient_id, body)
    values (auth.uid(), recipient, btrim(message_body));
end;
$$;

create function public.list_my_messages()
returns table(id uuid, sender_id uuid, recipient_id uuid, peer_email text, body text, created_at timestamptz)
language sql security definer set search_path = '' as $$
  select m.id, m.sender_id, m.recipient_id, p.email::text, m.body, m.created_at
  from public.messages m
  join public.profiles p on p.id = case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end
  where auth.uid() = m.sender_id or auth.uid() = m.recipient_id
  order by m.created_at, m.id;
$$;
revoke all on function public.send_message(text, text) from public, anon;
revoke all on function public.list_my_messages() from public, anon;
grant execute on function public.send_message(text, text) to authenticated;
grant execute on function public.list_my_messages() to authenticated;
commit;
