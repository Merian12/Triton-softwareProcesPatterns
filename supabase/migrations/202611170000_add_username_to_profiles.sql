begin;

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  drop constraint if exists profiles_username_check;

alter table public.profiles
  add constraint profiles_username_check
  check (username is null or length(btrim(username)) > 0);

drop function if exists public.admin_list_organizers();
create or replace function public.admin_list_organizers()
returns table (id uuid, email text, role text, username text)
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' for share;
  if not found then raise exception 'Admin access required.' using errcode = '42501'; end if;
  return query select p.id, p.email::text, p.role::text, p.username::text from public.profiles p where p.role = 'organizer' order by p.email;
end;
$$;

revoke all on function public.admin_list_organizers() from public, anon;
grant execute on function public.admin_list_organizers() to authenticated;

commit;
