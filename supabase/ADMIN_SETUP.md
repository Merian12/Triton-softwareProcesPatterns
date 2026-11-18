# Admin setup

Apply `migrations/202611120000_admin_enum.sql` first in the Supabase SQL editor and wait for it to finish. Then run `migrations/202611120001_admin_role.sql` separately. PostgreSQL requires the new enum value to be committed before use. Both enum and text role columns are supported. If your role constraint has a different name than `profiles_role_check`, update that constraint to include `admin` as well. Always use lowercase `admin` in SQL.

Create a normal account, then promote the intended user using trusted SQL:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>'::uuid;
```

Sign in with the account's existing email and password. Admin users are routed to `/admin-dashboard` with organizer event tools and organizer management. Admin is intentionally unavailable during public signup.

Removing an organizer changes their profile role to `volunteer`; it does not delete their Auth account or event data. The RPC checks the caller's current database role for every request. Existing pages may remain visible until navigation/reload; client-side event tools currently use demo data, as before.

Verify against a staging database: Admin can list/demote organizers; anonymous, Volunteer and Organizer calls to both RPCs fail; direct profile inserts with `admin`, role updates and deletes via the public API fail; a demoted user signs in to the Volunteer dashboard; neither RPC changes Admin or Volunteer targets.

The migration has not been applied automatically. Do not expose service-role keys in the browser. Database function security follows https://supabase.com/docs/guides/database/functions.
