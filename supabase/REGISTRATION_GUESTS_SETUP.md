# Registration Guests Setup

Apply [202611190001_registration_guests.sql](./migrations/202611190001_registration_guests.sql) in the Supabase SQL Editor (or via `supabase db push`) to enable multi-person shift registrations:

- Creates `public.registration_guests` linked to `public.registrations(id)` with RLS so volunteers can read guests on their own registrations.
- Adds atomic RPCs `register_shift_with_guests(p_shift_id, p_guest_names)` and `add_registration_guests(p_registration_id, p_guest_names)` that lock the shift row, enforce the 5-guest limit and shift capacity, and keep `shifts.registered_count` in sync with total volunteers + guests.
