import { describe, expect, it } from 'vitest';
import { DemoEventRepository } from '@/repositories/demoEventRepo';
import { affectedShifts, EventService, overview, validateEvent } from '@/services/eventService';

describe('Event administration rules', () => {
  it('counts slots across shifts rather than unique people and excludes drafts and past events', () => {
    const events = new DemoEventRepository().list();
    expect(overview(events, '2027-01-01')).toEqual({ upcoming: 2, openShifts: 2, vacancies: 9 });
    expect(overview(events, '2027-06-01')).toEqual({ upcoming: 1, openShifts: 1, vacancies: 6 });
    expect(overview(events, '2028-01-01').upcoming).toBe(0);
    events[0].status = 'draft';
    expect(overview(events, '2027-01-01').vacancies).toBe(6);
  });
  it('rejects invalid dates, times, capacity and shifts outside the event period', () => {
    const event = new DemoEventRepository().list()[0];
    event.endDate = '2027-02-30';
    event.shifts[0] = { ...event.shifts[0], date: '2027-05-17', start: '25:00', end: '07:00', capacity: 1.5 };
    const errors = validateEvent(event, true);
    expect(errors.endDate).toBeTruthy();
    expect(errors['shift.water.date']).toBeTruthy();
    expect(errors['shift.water.start']).toBeTruthy();
    expect(errors['shift.water.capacity']).toBeTruthy();
    event.shifts[0].capacity = 2;
    expect(validateEvent(event, true)['shift.water.capacity']).toContain('already 3');
    event.shifts[0].start = '08:00';
    expect(validateEvent(event, true)['shift.water.end']).toBeTruthy();
  });
  it('preserves registrations and blocks deletion or reducing capacity below enrollment', () => {
    const service = new EventService(new DemoEventRepository());
    const event = service.list()[0];
    event.shifts[0].registrations = [];
    service.save(event);
    expect(service.list()[0].shifts[0].registrations).toHaveLength(3);
    event.shifts[0].capacity = 2;
    expect(() => service.save(event)).toThrow();
    event.shifts = [];
    expect(() => service.save(event)).toThrow('cancellation workflow');
  });
  it('allows incomplete drafts and identifies changes that affect registered volunteers', () => {
    const service = new EventService(new DemoEventRepository());
    const draft = service.list()[2];
    draft.contact = '';
    draft.startDate = '';
    service.save(draft);
    expect(() => service.save({ ...draft, status: 'published' })).toThrow();
    const event = service.list()[0];
    const edited = structuredClone(event);
    edited.shifts[0].location = 'Ny vandpost';
    expect(affectedShifts(event, edited).map(s => s.id)).toEqual(['water']);
    service.save(edited);
    expect(service.list()[0].shifts[0].registrations).toHaveLength(3);
  });
});
