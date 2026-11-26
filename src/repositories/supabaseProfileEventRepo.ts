import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
  EventParticipation,
  IProfileEventRepository,
  RegisteredEvents,
  UpcomingEvent,
} from '@/services/profileService';

// Samme tabeller og felter, som VolunteerDashboard bruger.
type RegistrationRow = { id: string; shift_id: string; status: string };
type ShiftRow = {
  id: string;
  event_id: string;
  title: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
};
type EventRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  location?: string | null;
};

// Dato som YYYY-MM-DD i lokal tid, så den passer med dateLabel().
function localDate(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export class SupabaseProfileEventRepository implements IProfileEventRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || supabase;
  }

  async getRegisteredEvents(volunteerId: string, now: Date = new Date()): Promise<RegisteredEvents> {
    const { data: registrationData, error: registrationError } = await this.client
      .from('registrations')
      .select('id, shift_id, status')
      .eq('volunteer_id', volunteerId)
      .eq('status', 'registered');

    if (registrationError) throw new Error(registrationError.message);

    const registrations = (registrationData ?? []) as RegistrationRow[];
    if (registrations.length === 0) return { upcoming: [], past: [] };

    const shiftIds = [...new Set(registrations.map((row) => row.shift_id))];
    const { data: shiftData, error: shiftError } = await this.client
      .from('shifts')
      .select('id, event_id, title, location, starts_at, ends_at')
      .in('id', shiftIds);

    if (shiftError) throw new Error(shiftError.message);

    const shifts = (shiftData ?? []) as ShiftRow[];
    const eventIds = [...new Set(shifts.map((shift) => shift.event_id))];

    let events: EventRow[] = [];
    if (eventIds.length > 0) {
      const { data: eventData, error: eventError } = await this.client
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (eventError) throw new Error(eventError.message);
      events = (eventData ?? []) as EventRow[];
    }

    const rows = registrations.flatMap((registration) => {
      const shift = shifts.find((item) => item.id === registration.shift_id);
      if (!shift) return [];
      const event = events.find((item) => item.id === shift.event_id);
      return [{ registration, shift, event }];
    });

    rows.sort(
      (a, b) => new Date(a.shift.starts_at).getTime() - new Date(b.shift.starts_at).getTime()
    );

    const upcoming: UpcomingEvent[] = [];
    const past: EventParticipation[] = [];

    for (const { registration, shift, event } of rows) {
      const item = {
        id: registration.id,
        name: event?.title || event?.name || 'Untitled event',
        shift: shift.title || 'Volunteer shift',
        date: localDate(shift.starts_at),
        location: shift.location || event?.location || '',
      };

      if (new Date(shift.ends_at).getTime() > now.getTime()) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    }

    // Nyeste tidligere stævne først.
    past.reverse();

    return { upcoming, past };
  }

  async cancelRegistration(volunteerId: string, registrationId: string): Promise<void> {
    const { data, error } = await this.client
      .from('registrations')
      .delete()
      .eq('id', registrationId)
      .eq('volunteer_id', volunteerId)
      .select('id');

    if (error) throw new Error(error.message);

    // Hvis databasen ikke tillader sletningen, kommer der ingen rækker tilbage.
    if (!data || data.length === 0) {
      throw new Error('Could not cancel your registration. Contact an organizer.');
    }
  }
}
