export interface Registration { id: string; name: string; email: string }
export interface Shift { id: string; task: string; location: string; date: string; start: string; end: string; capacity: number; registrations: Registration[] }
export interface ClubEvent { id: string; name: string; description: string; location: string; startDate: string; endDate: string; deadline: string; contact: string; status: 'draft' | 'published'; shifts: Shift[] }
export interface IEventRepository { list(): ClubEvent[]; save(event: ClubEvent): void }
export type FieldErrors = Record<string, string>;
export const dateIsValid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const timeIsValid = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function validateEvent(event: ClubEvent, publish: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!event.name.trim()) errors.name = 'Enter the event name.';
  for (const key of ['startDate', 'endDate', 'deadline'] as const) {
    if ((publish || event[key]) && !dateIsValid(event[key])) errors[key] = 'Choose a valid date.';
  }
  if (dateIsValid(event.startDate) && dateIsValid(event.endDate) && event.endDate < event.startDate) errors.endDate = 'The end date must be on or after the start date.';
  if (dateIsValid(event.deadline) && dateIsValid(event.startDate) && event.deadline > event.startDate) errors.deadline = 'The registration deadline must be on or before the start date.';
  if (publish) {
    for (const key of ['description', 'location', 'contact'] as const) if (!event[key].trim()) errors[key] = 'Complete this field before publishing.';
    if (!event.shifts.length) errors.shifts = 'Add at least one shift before publishing.';
  }
  event.shifts.forEach((shift) => {
    const prefix = `shift.${shift.id}.`;
    for (const key of ['task', 'location'] as const) if (!shift[key].trim()) errors[prefix + key] = 'Complete this field.';
    if (!dateIsValid(shift.date)) errors[prefix + 'date'] = 'Choose a valid date.';
    else if (!dateIsValid(event.startDate) || !dateIsValid(event.endDate) || shift.date < event.startDate || shift.date > event.endDate) errors[prefix + 'date'] = 'The shift must be within the event dates.';
    if (!timeIsValid(shift.start)) errors[prefix + 'start'] = 'Choose a valid start time.';
    if (!timeIsValid(shift.end) || (timeIsValid(shift.start) && shift.end <= shift.start)) errors[prefix + 'end'] = 'The end time must be later than the start time on the same day.';
    if (!Number.isInteger(shift.capacity) || shift.capacity < 1) errors[prefix + 'capacity'] = 'Enter a positive whole number.';
    else if (shift.capacity < shift.registrations.length) errors[prefix + 'capacity'] = `There are already ${shift.registrations.length} volunteers signed up. Capacity cannot be lower.`;
  });
  return errors;
}
export function affectedShifts(original: ClubEvent | undefined, event: ClubEvent): Shift[] {
  return event.shifts.filter(shift => {
    const old = original?.shifts.find(s => s.id === shift.id);
    return old && old.registrations.length > 0 && (original?.location !== event.location || (['task', 'location', 'date', 'start', 'end'] as const).some(key => old[key] !== shift[key]));
  });
}
export function staffing(event: ClubEvent) {
  return event.shifts.reduce((sum, shift) => ({ capacity: sum.capacity + shift.capacity, filled: sum.filled + shift.registrations.length }), { capacity: 0, filled: 0 });
}
export function overview(events: ClubEvent[], today: string) {
  const upcoming = events.filter(e => e.status === 'published' && e.startDate >= today);
  const shifts = upcoming.flatMap(e => e.shifts);
  return { upcoming: upcoming.length, openShifts: shifts.filter(s => s.capacity > s.registrations.length).length, vacancies: shifts.reduce((sum, s) => sum + Math.max(0, s.capacity - s.registrations.length), 0) };
}
export class EventService {
  constructor(private repository: IEventRepository) {}
  list() { return this.repository.list(); }
  save(event: ClubEvent) {
    const original = this.list().find(e => e.id === event.id);
    if (original?.status === 'published' && event.status === 'draft') throw new Error('A published event cannot be changed to a draft.');
    if (original) {
      for (const shift of original.shifts) {
        const updated = event.shifts.find(s => s.id === shift.id);
        if (!updated && shift.registrations.length) throw new Error('Shifts with registrations require a separate cancellation workflow.');
      }
    }
    // Registrations belong to the repository, never to editable form input.
    const preserved = { ...event, shifts: event.shifts.map(s => ({ ...s, registrations: original?.shifts.find(old => old.id === s.id)?.registrations ?? [] })) };
    const errors = validateEvent(preserved, preserved.status === 'published');
    if (Object.keys(errors).length) throw new Error('Fix the highlighted fields before saving.');
    this.repository.save(preserved);
  }
}

