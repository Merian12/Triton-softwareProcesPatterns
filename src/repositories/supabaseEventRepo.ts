import { supabase } from '@/lib/supabaseClient';

import type {
  Club,
  ClubEvent,
  IEventRepository,
  Registration,
  Shift,
} from '@/services/eventService';

function localDate(timestamp: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(new Date(timestamp));
}

function localTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(timestamp));
}

function toTimestamp(date: string, time: string): string {
  const target = new Date(`${date}T${time}:00Z`);
  let timestamp = target.getTime();

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestamp))
        .map(part => [part.type, part.value])
    );

    const local = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    const difference = target.getTime() - local;

    if (difference === 0) {
      return new Date(timestamp).toISOString();
    }

    timestamp += difference;
  }

  throw new Error('Invalid Copenhagen date or time.');
}

// Retrieve clubs directly from Supabase.
export async function getClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export class SupabaseEventRepository
  implements IEventRepository {

  constructor(private userId: string) {}

  async list(): Promise<ClubEvent[]> {

    // Retrieve events from all accessible clubs.
    const { data: events, error: eventError } =
      await supabase
        .from('events')
        .select('*')
        .in('status', ['draft', 'published'])
        .order('starts_at', { ascending: true });

    if (eventError) {
      throw new Error(eventError.message);
    }

    if (!events?.length) {
      return [];
    }

    const eventIds = events.map(event => event.id);

    // Retrieve shifts belonging to the events.
    const { data: shifts, error: shiftError } =
      await supabase
        .from('shifts')
        .select('*')
        .in('event_id', eventIds)
        .order('starts_at', { ascending: true });

    if (shiftError) {
      throw new Error(shiftError.message);
    }

    const shiftIds = (shifts ?? []).map(
      shift => shift.id
    );

    const registrationsByShift =
      new Map<string, Registration[]>();

    if (shiftIds.length > 0) {

      const {
        data: registrations,
        error: registrationError,
      } = await supabase
        .from('registrations')
        .select('*')
        .in('shift_id', shiftIds)
        .eq('status', 'registered');

      if (registrationError) {
        throw new Error(registrationError.message);
      }

      const volunteerIds = [
        ...new Set(
          (registrations ?? []).map(
            registration => registration.volunteer_id
          )
        ),
      ];

      if (volunteerIds.length > 0) {

        const {
          data: profiles,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', volunteerIds);

        if (profileError) {
          throw new Error(profileError.message);
        }

        for (const registration of registrations ?? []) {

          const profile = profiles?.find(
            person => person.id === registration.volunteer_id
          );

          const entry: Registration = {
            id: registration.id,
            name: profile?.username ?? 'Volunteer',
            email: profile?.email ?? '',
          };

          const current =
            registrationsByShift.get(
              registration.shift_id
            ) ?? [];

          current.push(entry);

          registrationsByShift.set(
            registration.shift_id,
            current
          );
        }
      }
    }

    // Convert Supabase data into ClubEvent objects.
    return events.map(event => ({
      id: event.id,
      clubId: event.club_id,
      name: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      startDate: localDate(event.starts_at),
      endDate: localDate(event.ends_at),
      deadline: event.deadline ?? '',
      contact: event.contact ?? '',
      status: event.status,

      shifts: (shifts ?? [])
        .filter(shift => shift.event_id === event.id)
        .map((shift): Shift => ({
          id: shift.id,
          task: shift.title,
          location: shift.location ?? '',
          date: localDate(shift.starts_at),
          start: localTime(shift.starts_at),
          end: localTime(shift.ends_at),
          capacity: shift.capacity,
          registrations:
            registrationsByShift.get(shift.id) ?? [],
        })),
    }));
  }

  async save(event: ClubEvent): Promise<void> {

    // Use the club selected in the event editor.
    const clubId = event.clubId;

    if (!clubId) {
      throw new Error('Please select a club.');
    }

    const availableClubs = await getClubs();

    if (!availableClubs.some(club => club.id === clubId)) {
      throw new Error('The selected club is not available.');
    }

    // Check whether the event already exists.
    const {
      data: existingEvent,
      error: existingEventError,
    } = await supabase
      .from('events')
      .select('id, club_id, status')
      .eq('id', event.id)
      .maybeSingle();

    if (existingEventError) {
      throw new Error(existingEventError.message);
    }

    if (
      existingEvent &&
      existingEvent.club_id !== clubId
    ) {
      throw new Error(
        'The club of an existing event cannot be changed.'
      );
    }

    if (
      existingEvent?.status === 'published' &&
      event.status === 'draft'
    ) {
      throw new Error(
        'A published event cannot become a draft.'
      );
    }

    // Retrieve existing shifts.
    const {
      data: existingShifts,
      error: existingShiftError,
    } = await supabase
      .from('shifts')
      .select('id, registered_count')
      .eq('event_id', event.id);

    if (existingShiftError) {
      throw new Error(existingShiftError.message);
    }

    // Identify shifts removed in the editor.
    const removedShifts = (existingShifts ?? []).filter(
      oldShift =>
        !event.shifts.some(
          shift => shift.id === oldShift.id
        )
    );

    // Prevent removal of shifts with registrations.
    for (const shift of removedShifts) {

      if (shift.registered_count > 0) {
        throw new Error(
          'A shift with registrations cannot be removed.'
        );
      }

      const { count, error } = await supabase
        .from('registrations')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('shift_id', shift.id);

      if (error) {
        throw new Error(error.message);
      }

      if ((count ?? 0) > 0) {
        throw new Error(
          'A shift with registration history cannot be removed.'
        );
      }
    }

    // Prevent reducing capacity below registered count.
    for (const shift of event.shifts) {

      const existing = existingShifts?.find(
        oldShift => oldShift.id === shift.id
      );

      if (
        existing &&
        shift.capacity < existing.registered_count
      ) {
        throw new Error(
          `Capacity for "${shift.task}" cannot be lower than the registered count.`
        );
      }
    }

    // Prepare event data.
    const eventData = {
      title: event.name,
      description: event.description,
      location: event.location,
      starts_at: toTimestamp(event.startDate, '00:00'),
      ends_at: toTimestamp(event.endDate, '23:59'),
      deadline: event.deadline || null,
      contact: event.contact,
    };

    // Prepare shift data.
    const preparedShifts = event.shifts.map(shift => ({
      id: shift.id,
      title: shift.task,
      location: shift.location,
      starts_at: toTimestamp(shift.date, shift.start),
      ends_at: toTimestamp(shift.date, shift.end),
      capacity: shift.capacity,
      contact: event.contact,
      registration_deadline: event.deadline
        ? toTimestamp(event.deadline, '23:59')
        : null,
    }));

    // Update an existing event.
    if (existingEvent) {

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', event.id)
        .eq('club_id', clubId)
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

    } else {

      // Create a new event using the selected club.
      const { error } = await supabase
        .from('events')
        .insert({
          id: event.id,
          club_id: clubId,
          created_by: this.userId,
          ...eventData,
          status: 'draft',
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }
    }

    // Create or update shifts.
    for (const shift of preparedShifts) {

      const existing = existingShifts?.find(
        oldShift => oldShift.id === shift.id
      );

      const { id, ...shiftData } = shift;

      if (existing) {

        const { error } = await supabase
          .from('shifts')
          .update(shiftData)
          .eq('id', id)
          .eq('event_id', event.id)
          .select('id')
          .single();

        if (error) {
          throw new Error(error.message);
        }

      } else {

        const { error } = await supabase
          .from('shifts')
          .insert({
            id,
            event_id: event.id,
            supervisor_id: this.userId,
            description: '',
            ...shiftData,
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    // Remove deleted shifts.
    for (const shift of removedShifts) {

      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shift.id)
        .eq('event_id', event.id)
        .eq('registered_count', 0)
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }
    }

    // Set the final event status after saving shifts.
    const { error: statusError } = await supabase
      .from('events')
      .update({
        status: event.status,
      })
      .eq('id', event.id)
      .eq('club_id', clubId)
      .select('id')
      .single();

    if (statusError) {
      throw new Error(statusError.message);
    }
  }
}