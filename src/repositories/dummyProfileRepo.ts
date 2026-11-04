import {
  EmergencyContact,
  EventParticipation,
  IProfileRepository,
    UpcomingEvent,
  Volunteer,
} from '@/services/profileService';

// Alt herunder er opdigtet og kun til prototypen.
const volunteers: Volunteer[] = [
  { id: '1', name: 'Anna Eksempel', role: 'volunteer', email: 'anna@example.com', phone: '00 00 00 01' },
  { id: '2', name: 'Peter Prøve', role: 'volunteer', email: 'peter@example.com', phone: '00 00 00 02' },
  { id: '3', name: 'Sara Test', role: 'organizer', email: 'sara@example.com', phone: '00 00 00 03' },
];

const emergencyContacts: EmergencyContact[] = [
  { id: '1', name: 'Beredskab Ballerup', type: 'Beredskab', phone: '00 00 10 01', municipality: 'Ballerup' },
  { id: '2', name: 'Politi Ballerup', type: 'Politi', phone: '00 00 10 02', municipality: 'Ballerup' },
  { id: '3', name: 'Beredskab Herlev', type: 'Beredskab', phone: '00 00 10 03', municipality: 'Herlev' },
  { id: '4', name: 'Ambulance Herlev', type: 'Ambulance', phone: '00 00 10 04', municipality: 'Herlev' },
  { id: '5', name: 'Politi Furesø', type: 'Politi', phone: '00 00 10 05', municipality: 'Furesø' },
];

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
    return volunteers[0];
  }

  async getVolunteers(): Promise<Volunteer[]> {
    return volunteers;
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return emergencyContacts;
  }

  async getMyEvents(): Promise<EventParticipation[]> {
    return myEvents;
  }

  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
  return upcomingEvents;
}

  
}
