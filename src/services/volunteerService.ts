import { supabase } from '@/lib/supabaseClient';

import {
  RegistrationService,
} from '@/services/registrationService';

import {
  SupabaseRegistrationRepository,
} from '@/repositories/supabaseRegistrationRepo';

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

const registrationService = new RegistrationService(
  new SupabaseRegistrationRepository()
);

// Load events, shifts and the volunteer's registrations.
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

  const activeRegistrations = registrations.filter(
    row => row.status === 'registered'
  );

  const allGuests = activeRegistrations.length
    ? await registrationService.listGuests(
        activeRegistrations.map(row => row.id)
      )
    : [];

  const bookings: Booking[] = activeRegistrations
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
        guests: allGuests.filter(
          guest => guest.registration_id === row.id
        ),
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

// Check whether the volunteer is already registered.
export function isRegistered(
  shift: Shift,
  bookings: Booking[]
): boolean {
  return bookings.some(
    booking => booking.shift_id === shift.id
  );
}

// Check the registration deadline.
export function registrationClosed(
  shift: Shift
): boolean {
  if (!shift.registration_deadline) return false;

  return (
    new Date(shift.registration_deadline).getTime() <=
    Date.now()
  );
}

// Calculate available places.
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

// Register a volunteer and their optional guests.
export async function registerForShift(
  shift: Shift,
  volunteerId: string,
  guestNames: string[] = []
): Promise<void> {
  if (shift.status !== 'open') {
    throw new Error('This shift is not open.');
  }

  if (registrationClosed(shift)) {
    throw new Error('The registration deadline has passed.');
  }

  const available = availablePlaces(shift);

  if (available === 0) {
    throw new Error('This shift has no available places.');
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  if (data.user?.id !== volunteerId) {
    throw new Error('Could not verify volunteer identity.');
  }

  await registrationService.registerWithGuests(
    shift.id,
    guestNames,
    available
  );
}

// Add guests to an existing registration.
export async function addGuestsToBooking(
  booking: Booking,
  shift: Shift,
  guestNames: string[]
): Promise<void> {
  if (registrationClosed(shift)) {
    throw new Error('The registration deadline has passed.');
  }

  if (shift.status !== 'open') {
    throw new Error('This shift is not open.');
  }

  if (booking.shift_id !== shift.id) {
    throw new Error('Registration does not match this shift.');
  }

  await registrationService.addGuests(
    booking.id,
    guestNames,
    booking.guests.length,
    availablePlaces(shift)
  );
}