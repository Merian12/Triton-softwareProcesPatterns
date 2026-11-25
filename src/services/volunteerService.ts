import { supabase } from '@/lib/supabaseClient';

import type {
  Shift,
  Event,
  Booking,
  RegistrationRow,
} from '@/services/volunteerTypes';

export type VolunteerData = {
  events: Event[];
  bookings: Booking[];
};

// Load events, shifts and the volunteer's registrations
export async function getVolunteerData(
  volunteerId: string
): Promise<VolunteerData> {
  const [
    eventsResult,
    shiftsResult,
    registrationsResult,
  ] = await Promise.all([
    supabase.from('events').select('*'),

    supabase
      .from('shifts')
      .select('*')
      .order('starts_at', { ascending: true }),

    supabase
      .from('registrations')
      .select('id, shift_id, status')
      .eq('volunteer_id', volunteerId),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;
  if (registrationsResult.error) {
    throw registrationsResult.error;
  }

  const allShifts = (shiftsResult.data ?? []) as Shift[];

  const allEvents: Event[] = (
    eventsResult.data ?? []
  ).map(row => ({
    ...row,
    shifts: allShifts.filter(
      shift => shift.event_id === row.id
    ),
  }));

  const registrations = (
    registrationsResult.data ?? []
  ) as RegistrationRow[];

  const bookings: Booking[] = registrations
    .filter(row => row.status === 'registered')
    .flatMap(row => {
      const shift = allShifts.find(
        item => item.id === row.shift_id
      );

      if (!shift) return [];

      const event = allEvents.find(
        item => item.id === shift.event_id
      );

      if (!event) return [];

      return [{
        id: row.id,
        shift_id: row.shift_id,
        status: row.status,
        event,
        shift,
      }];
    });

  return {
    events: allEvents.filter(
      event => event.status === 'published'
    ),
    bookings,
  };
}

// Check whether the volunteer is already registered
export function isRegistered(
  shift: Shift,
  bookings: Booking[]
): boolean {
  return bookings.some(
    booking => booking.shift_id === shift.id
  );
}

// Check the registration deadline
export function registrationClosed(
  shift: Shift
): boolean {
  if (!shift.registration_deadline) return false;

  return (
    new Date(shift.registration_deadline).getTime() <=
    Date.now()
  );
}

// Calculate available places
export function availablePlaces(
  shift: Shift
): number | null {
  if (shift.status !== 'open') return 0;

  if (registrationClosed(shift)) return 0;

  if (shift.capacity === null) return null;

  return Math.max(
    0,
    shift.capacity - shift.registered_count
  );
}

// Register a volunteer for a shift
export async function registerForShift(
  shift: Shift,
  volunteerId: string
): Promise<void> {
  if (shift.status !== 'open') {
    throw new Error('This shift is not open.');
  }

  if (registrationClosed(shift)) {
    throw new Error('The registration deadline has passed.');
  }

  if (availablePlaces(shift) === 0) {
    throw new Error('This shift has no available places.');
  }

  const { error } = await supabase
    .from('registrations')
    .insert({
      shift_id: shift.id,
      volunteer_id: volunteerId,
      status: 'registered',
    });

  if (error) throw error;
}