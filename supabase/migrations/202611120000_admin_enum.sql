-- Run and commit this migration before 202611120001_admin_role.sql.
-- Text-based schemas need no enum change.
do $$
declare
  role_schema text;
  role_type text;
begin
  select n.nspname, t.typname into role_schema, role_type
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_type t on t.oid = a.atttypid
  join pg_catalog.pg_namespace n on n.oid = t.typnamespace
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'role' and not a.attisdropped and t.typtype = 'e';

  if role_type is not null then
    execute format('alter type %I.%I add value if not exists %L', role_schema, role_type, 'admin');
  end if;
end;
$$;
