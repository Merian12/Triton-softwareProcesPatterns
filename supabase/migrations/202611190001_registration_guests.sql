begin;

create table public.registration_guests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create index registration_guests_registration_created
  on public.registration_guests(registration_id, created_at);

alter table public.registration_guests enable row level security;
revoke all on public.registration_guests from anon, authenticated;
grant select on public.registration_guests to authenticated;

create policy volunteers_read_own_guests
  on public.registration_guests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.registrations r
      where r.id = registration_id
        and r.volunteer_id = auth.uid()
    )
  );

create or replace function public.sync_shift_registered_count(p_shift_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  select
    (
      select count(*)
      from public.registrations r
      where r.shift_id = p_shift_id
        and r.status = 'registered'
    ) +
    (
      select count(*)
      from public.registration_guests g
      join public.registrations r on r.id = g.registration_id
      where r.shift_id = p_shift_id
        and r.status = 'registered'
    )
  into v_total;

  update public.shifts
  set registered_count = v_total
  where id = p_shift_id;

  return v_total;
end;
$$;

create or replace function public.register_shift_with_guests(
  p_shift_id uuid,
  p_guest_names text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_shift record;
  v_cleaned text[] := '{}';
  v_raw text;
  v_trimmed text;
  v_guest_count integer;
  v_current_count integer;
  v_registration_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_guest_names is not null then
    foreach v_raw in array p_guest_names loop
      v_trimmed := btrim(coalesce(v_raw, ''));
      if length(v_trimmed) = 0 then
        raise exception 'Enter a name for each guest.';
      end if;
      if length(v_trimmed) > 120 then
        raise exception 'Guest names must be 120 characters or fewer.';
      end if;
      v_cleaned := array_append(v_cleaned, v_trimmed);
    end loop;
  end if;

  v_guest_count := coalesce(cardinality(v_cleaned), 0);
  if v_guest_count > 5 then
    raise exception 'You can bring at most 5 guests per shift.';
  end if;

  select id, status, capacity
  into v_shift
  from public.shifts
  where id = p_shift_id
  for update;

  if not found or v_shift.status <> 'open' then
    raise exception 'This shift is unavailable.';
  end if;

  if exists (
    select 1
    from public.registrations r
    where r.shift_id = p_shift_id
      and r.volunteer_id = v_user_id
      and r.status = 'registered'
  ) then
    raise exception 'You are already registered for this shift.';
  end if;

  v_current_count := public.sync_shift_registered_count(p_shift_id);

  if v_shift.capacity is not null
     and v_current_count + 1 + v_guest_count > v_shift.capacity then
    raise exception 'Not enough places available for everyone.';
  end if;

  insert into public.registrations (shift_id, volunteer_id, status)
  values (p_shift_id, v_user_id, 'registered')
  returning id into v_registration_id;

  if v_guest_count > 0 then
    insert into public.registration_guests (registration_id, full_name)
    select v_registration_id, guest_name
    from unnest(v_cleaned) as guest_name;
  end if;

  perform public.sync_shift_registered_count(p_shift_id);

  return v_registration_id;
end;
$$;

create or replace function public.add_registration_guests(
  p_registration_id uuid,
  p_guest_names text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration record;
  v_shift record;
  v_cleaned text[] := '{}';
  v_raw text;
  v_trimmed text;
  v_new_guest_count integer;
  v_existing_guest_count integer;
  v_current_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_guest_names is null or coalesce(cardinality(p_guest_names), 0) = 0 then
    raise exception 'Add at least one guest name.';
  end if;

  foreach v_raw in array p_guest_names loop
    v_trimmed := btrim(coalesce(v_raw, ''));
    if length(v_trimmed) = 0 then
      raise exception 'Enter a name for each guest.';
    end if;
    if length(v_trimmed) > 120 then
      raise exception 'Guest names must be 120 characters or fewer.';
    end if;
    v_cleaned := array_append(v_cleaned, v_trimmed);
  end loop;

  v_new_guest_count := cardinality(v_cleaned);

  select id, shift_id, volunteer_id, status
  into v_registration
  from public.registrations
  where id = p_registration_id
    and volunteer_id = v_user_id
    and status = 'registered';

  if not found then
    raise exception 'Registration not found.';
  end if;

  select id, status, capacity
  into v_shift
  from public.shifts
  where id = v_registration.shift_id
  for update;

  if not found or v_shift.status <> 'open' then
    raise exception 'This shift is unavailable.';
  end if;

  select count(*)
  into v_existing_guest_count
  from public.registration_guests
  where registration_id = p_registration_id;

  if v_existing_guest_count + v_new_guest_count > 5 then
    raise exception 'You can bring at most 5 guests per shift.';
  end if;

  v_current_count := public.sync_shift_registered_count(v_registration.shift_id);

  if v_shift.capacity is not null
     and v_current_count + v_new_guest_count > v_shift.capacity then
    raise exception 'Not enough places available for everyone.';
  end if;

  insert into public.registration_guests (registration_id, full_name)
  select p_registration_id, guest_name
  from unnest(v_cleaned) as guest_name;

  perform public.sync_shift_registered_count(v_registration.shift_id);
end;
$$;

revoke all on function public.sync_shift_registered_count(uuid) from public, anon, authenticated;
revoke all on function public.register_shift_with_guests(uuid, text[]) from public, anon;
revoke all on function public.add_registration_guests(uuid, text[]) from public, anon;
grant execute on function public.register_shift_with_guests(uuid, text[]) to authenticated;
grant execute on function public.add_registration_guests(uuid, text[]) to authenticated;

commit;
