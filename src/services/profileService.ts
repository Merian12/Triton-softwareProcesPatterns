import { UserRole } from './authService';

export interface Volunteer {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
}

export type ContactType = 'Beredskab' | 'Politi' | 'Ambulance';

export interface EmergencyContact {
  id: string;
  name: string;
  type: ContactType;
  phone: string;
  municipality: string;
}

export interface EventParticipation {
  id: string;
  name: string;
  date: string;
  location: string;
}


export interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
}

export interface IProfileRepository {
  getCurrentVolunteer(): Promise<Volunteer>;
  getVolunteers(): Promise<Volunteer[]>;
  getEmergencyContacts(): Promise<EmergencyContact[]>;
  getMyEvents(): Promise<EventParticipation[]>;
  getUpcomingEvents(): Promise<UpcomingEvent[]>;

}



