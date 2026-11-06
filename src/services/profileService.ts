import { UserRole } from './authService';

export interface Volunteer {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  club: string;
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
  getClubs(): Promise<string[]>;
  getCreditsPerEvent(): Promise<number>;
  getMyEvents(): Promise<EventParticipation[]>;
  getUpcomingEvents(): Promise<UpcomingEvent[]>;
}
