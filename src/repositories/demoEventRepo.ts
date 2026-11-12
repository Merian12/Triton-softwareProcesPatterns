import type { ClubEvent, IEventRepository, Registration } from '@/services/eventService';
const people: Registration[] = [
  { id: 'anna', name: 'Anna Jensen', email: 'anna@example.com' },
  { id: 'mikkel', name: 'Mikkel Hansen', email: 'mikkel@example.com' },
  { id: 'sara', name: 'Sara Nielsen', email: 'sara@example.com' },
];
function sampleEvents(): ClubEvent[] {
  return [
    { id: 'cph', name: 'CPH Marathon', location: 'København', startDate: '2027-05-16', endDate: '2027-05-16', deadline: '2027-05-01', description: 'Hjælp løberne godt igennem dagen. Mød 15 minutter før din vagt til fælles briefing.', contact: 'Lene · lene@example.com', status: 'published', shifts: [
      { id: 'water', task: 'Uddeling af vand', location: 'Vandpost · Østerbro', date: '2027-05-16', start: '07:00', end: '11:00', capacity: 6, registrations: people },
      { id: 'bags', task: 'Bagage og modtagelse', location: 'Fælledparken', date: '2027-05-16', start: '08:00', end: '12:00', capacity: 2, registrations: people.slice(0, 2) },
    ] },
    { id: 'ironman', name: 'IRONMAN Copenhagen', location: 'København', startDate: '2027-08-22', endDate: '2027-08-22', deadline: '2027-08-01', description: 'Vær med på holdet ved rutens forplejningsstation.', contact: 'Lene · lene@example.com', status: 'published', shifts: [
      { id: 'route', task: 'Forplejning på ruten', location: 'Islands Brygge', date: '2027-08-22', start: '10:00', end: '16:00', capacity: 8, registrations: people.slice(0, 2) },
    ] },
    { id: 'triton', name: 'Triton klubstævne', location: 'Ballerup svømmehal', startDate: '2027-09-11', endDate: '2027-09-12', deadline: '2027-09-01', description: 'Klubbens eget stævne. Vi planlægger fortsat opgaverne.', contact: 'Klubkontoret', status: 'draft', shifts: [] },
  ];
}
/** Demo only: isolated to this mounted dashboard; no browser or Supabase storage. */
export class DemoEventRepository implements IEventRepository {
  private events = sampleEvents();
  list() { return structuredClone(this.events); }
  save(event: ClubEvent) {
    const index = this.events.findIndex(e => e.id === event.id);
    if (index < 0) this.events.push(structuredClone(event));
    else this.events[index] = structuredClone(event);
  }
}
