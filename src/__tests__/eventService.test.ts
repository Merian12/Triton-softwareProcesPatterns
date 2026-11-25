import { describe, expect, it } from 'vitest';
import { DemoEventRepository } from '@/repositories/demoEventRepo';
import {
  affectedShifts,
  EventService,
  overview,
  validateEvent,
} from '@/services/eventService';

describe('Event administration rules', () => {
  it('counts slots across shifts rather than unique people and excludes drafts and past events', async () => {
    const events = await new DemoEventRepository().list();

    expect(overview(events, '2027-01-01')).toEqual({
      upcoming: 2,
      openShifts: 2,
      vacancies: 9,
    });

    expect(overview(events, '2027-06-01')).toEqual({
      upcoming: 1,
      openShifts: 1,
      vacancies: 6,
    });

    expect(overview(events, '2028-01-01').upcoming).toBe(0);

    events[0].status = 'draft';

    expect(overview(events, '2027-01-01').vacancies).toBe(6);
  });

  it('rejects invalid dates, times, capacity and shifts outside the event period', async () => {
    const event = (await new DemoEventRepository().list())[0];

    event.endDate = '2027-02-30';

    event.shifts[0] = {
      ...event.shifts[0],
      date: '2027-05-17',
      start: '25:00',
      end: '07:00',
      capacity: 1.5,
    };

    const errors = validateEvent(event, true);

    expect(errors.endDate).toBeTruthy();
    expect(errors['shift.water.date']).toBeTruthy();
    expect(errors['shift.water.start']).toBeTruthy();
    expect(errors['shift.water.capacity']).toBeTruthy();

    event.shifts[0].capacity = 2;

    expect(
      validateEvent(event, true)['shift.water.capacity']
    ).toContain('already 3');

    event.shifts[0].start = '08:00';

    expect(
      validateEvent(event, true)['shift.water.end']
    ).toBeTruthy();
  });

  it('preserves registrations and blocks deletion or reducing capacity below enrollment', async () => {
    const service = new EventService(
      new DemoEventRepository()
    );

    const event = (await service.list())[0];

    event.shifts[0].registrations = [];

    await service.save(event);

    expect(
      (await service.list())[0].shifts[0].registrations
    ).toHaveLength(3);

    event.shifts[0].capacity = 2;

    await expect(service.save(event)).rejects.toThrow();

    event.shifts = [];

    await expect(service.save(event)).rejects.toThrow(
      'cancellation workflow'
    );
  });

  it('allows incomplete drafts and identifies changes that affect registered volunteers', async () => {
    const service = new EventService(
      new DemoEventRepository()
    );

    const draft = (await service.list())[2];

    draft.contact = '';
    draft.startDate = '';

    await service.save(draft);

    await expect(
      service.save({
        ...draft,
        status: 'published',
      })
    ).rejects.toThrow();

    const event = (await service.list())[0];

    const edited = structuredClone(event);

    edited.shifts[0].location = 'Ny vandpost';

    expect(
      affectedShifts(event, edited).map(s => s.id)
    ).toEqual(['water']);

    await service.save(edited);

    expect(
      (await service.list())[0].shifts[0].registrations
    ).toHaveLength(3);
  });

  it('rejects end dates before start dates, deadlines after start dates, empty shift fields, and reverting published events to draft', async () => {
    const service = new EventService(
      new DemoEventRepository()
    );

    const published = (await service.list())[0];

    await expect(
      service.save({
        ...published,
        status: 'draft',
      })
    ).rejects.toThrow('cannot be changed to a draft');

    const invalid = structuredClone(published);

    invalid.endDate = '2027-05-10';
    invalid.deadline = '2027-05-20';

    invalid.shifts[0] = {
      ...invalid.shifts[0],
      task: '   ',
      location: '',
    };

    const errors = validateEvent(invalid, true);

    expect(errors.endDate).toContain(
      'on or after the start date'
    );

    expect(errors.deadline).toContain(
      'on or before the start date'
    );

    expect(errors['shift.water.task']).toBe(
      'Complete this field.'
    );

    expect(errors['shift.water.location']).toBe(
      'Complete this field.'
    );
  });
});