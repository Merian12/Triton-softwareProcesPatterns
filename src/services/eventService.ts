export interface Registration { id: string; name: string; email: string }
export interface Shift { id: string; task: string; location: string; date: string; start: string; end: string; capacity: number; registrations: Registration[] }
export interface ClubEvent { id: string; name: string; description: string; location: string; startDate: string; endDate: string; deadline: string; contact: string; status: 'draft' | 'published'; shifts: Shift[] }
export interface IEventRepository { list(): ClubEvent[]; save(event: ClubEvent): void }
export type FieldErrors = Record<string, string>;
export const dateIsValid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const timeIsValid = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function validateEvent(event: ClubEvent, publish: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!event.name.trim()) errors.name = 'Skriv arrangementets navn.';
  for (const key of ['startDate', 'endDate', 'deadline'] as const) {
    if ((publish || event[key]) && !dateIsValid(event[key])) errors[key] = 'Vælg en gyldig dato.';
  }
  if (dateIsValid(event.startDate) && dateIsValid(event.endDate) && event.endDate < event.startDate) errors.endDate = 'Slutdato skal være på eller efter startdato.';
  if (dateIsValid(event.deadline) && dateIsValid(event.startDate) && event.deadline > event.startDate) errors.deadline = 'Fristen skal være senest på startdatoen.';
  if (publish) {
    for (const key of ['description', 'location', 'contact'] as const) if (!event[key].trim()) errors[key] = 'Udfyld feltet før offentliggørelse.';
    if (!event.shifts.length) errors.shifts = 'Tilføj mindst én vagt før offentliggørelse.';
  }
  event.shifts.forEach((shift) => {
    const prefix = `shift.${shift.id}.`;
    for (const key of ['task', 'location'] as const) if (!shift[key].trim()) errors[prefix + key] = 'Udfyld feltet.';
    if (!dateIsValid(shift.date)) errors[prefix + 'date'] = 'Vælg en gyldig dato.';
    else if (!dateIsValid(event.startDate) || !dateIsValid(event.endDate) || shift.date < event.startDate || shift.date > event.endDate) errors[prefix + 'date'] = 'Vagten skal ligge inden for arrangementets periode.';
    if (!timeIsValid(shift.start)) errors[prefix + 'start'] = 'Vælg en gyldig starttid.';
    if (!timeIsValid(shift.end) || (timeIsValid(shift.start) && shift.end <= shift.start)) errors[prefix + 'end'] = 'Sluttid skal være senere end starttid samme dag.';
    if (!Number.isInteger(shift.capacity) || shift.capacity < 1) errors[prefix + 'capacity'] = 'Angiv et positivt heltal.';
    else if (shift.capacity < shift.registrations.length) errors[prefix + 'capacity'] = `Der er allerede ${shift.registrations.length} tilmeldte. Kapaciteten må ikke være lavere.`;
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
    if (original?.status === 'published' && event.status === 'draft') throw new Error('Et offentliggjort arrangement kan ikke ændres til kladde.');
    if (original) {
      for (const shift of original.shifts) {
        const updated = event.shifts.find(s => s.id === shift.id);
        if (!updated && shift.registrations.length) throw new Error('Vagter med tilmeldinger kræver en særskilt aflysningsfunktion.');
      }
    }
    // Registrations belong to the repository, never to editable form input.
    const preserved = { ...event, shifts: event.shifts.map(s => ({ ...s, registrations: original?.shifts.find(old => old.id === s.id)?.registrations ?? [] })) };
    const errors = validateEvent(preserved, preserved.status === 'published');
    if (Object.keys(errors).length) throw new Error('Ret de markerede felter før du gemmer.');
    this.repository.save(preserved);
  }
}

