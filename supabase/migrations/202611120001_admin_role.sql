-- Apply 202611120000_admin_enum.sql in a separate transaction first.
begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('volunteer', 'organizer', 'admin'));

-- Invoker trigger: direct API calls cannot promote users or recreate admin profiles.
-- Trusted SQL and the narrowly scoped SECURITY DEFINER RPC below can change roles.
create or replace function public.protect_profile_roles()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if TG_OP = 'DELETE' then
      raise exception 'Profiles cannot be deleted through the public API.';
    elsif TG_OP = 'INSERT' then
      if new.id is distinct from auth.uid() or new.role not in ('volunteer', 'organizer') then
        raise exception 'Invalid profile registration.';
      end if;
    elsif new.id is distinct from old.id or new.role is distinct from old.role then
      raise exception 'Profile roles cannot be changed through the public API.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles before insert or update or delete on public.profiles
for each row execute function public.protect_profile_roles();

create or replace function public.admin_list_organizers()
returns table (id uuid, email text, role text)
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' for share;
  if not found then raise exception 'Admin access required.' using errcode = '42501'; end if;
  return query select p.id, p.email::text, p.role::text from public.profiles p where p.role = 'organizer' order by p.email;
end;
$$;

create or replace function public.admin_remove_organizer(organizer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' for share;
  if not found then raise exception 'Admin access required.' using errcode = '42501'; end if;
  update public.profiles set role = 'volunteer' where id = organizer_id and role = 'organizer';
  if not found then raise exception 'Organizer not found. Refresh the list and try again.'; end if;
end;
$$;
revoke all on function public.admin_list_organizers() from public, anon;
revoke all on function public.admin_remove_organizer(uuid) from public, anon;
grant execute on function public.admin_list_organizers() to authenticated;
grant execute on function public.admin_remove_organizer(uuid) to authenticated;
commit;
