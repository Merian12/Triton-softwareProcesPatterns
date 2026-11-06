import {
  EventParticipation,
  IProfileRepository,
  UpcomingEvent,
  Volunteer,
} from '@/services/profileService';

// Alt herunder er opdigtet og kun til prototypen.
const currentVolunteer: Volunteer = {
  id: '1',
  name: 'Anna Eksempel',
  role: 'volunteer',
  email: 'anna@example.com',
  phone: '00 00 00 01',
  club: 'Triton Swim Ballerup',
};

const clubs: string[] = ['Triton Swim Ballerup', 'Dummy Klub Nord', 'Dummy Klub Syd'];

const creditsPerEvent = 50;

const myEvents: EventParticipation[] = [
  { id: '1', name: 'Sommerstævne', date: '2026-06-14', location: 'Ballerup Svømmehal' },
  { id: '2', name: 'Klubmesterskab', date: '2026-09-20', location: 'Ballerup Svømmehal' },
  { id: '3', name: 'Efterårsstævne', date: '2026-10-18', location: 'Herlev Svømmehal' },
];

const upcomingEvents: UpcomingEvent[] = [
  { id: '1', name: 'Julestævne', date: '2026-12-06', location: 'Ballerup Svømmehal' },
  { id: '2', name: 'Nytårsstævne', date: '2027-01-17', location: 'Herlev Svømmehal' },
];

export class DummyProfileRepository implements IProfileRepository {
  async getCurrentVolunteer(): Promise<Volunteer> {
    return currentVolunteer;
  }

  async getClubs(): Promise<string[]> {
    return clubs;
  }

  async getCreditsPerEvent(): Promise<number> {
    return creditsPerEvent;
  }

  async getMyEvents(): Promise<EventParticipation[]> {
    return myEvents;
  }

  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    return upcomingEvents;
  }
}
