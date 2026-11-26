import { UserRole } from './authService';

export interface Volunteer {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  club: string;
}

// Et stævne, som den frivillige har deltaget i. id er tilmeldingens id.
export interface EventParticipation {
  id: string;
  name: string;
  shift: string;
  date: string;
  location: string;
}

// Et kommende stævne, som den frivillige er tilmeldt. id er tilmeldingens id.
export interface UpcomingEvent {
  id: string;
  name: string;
  shift: string;
  date: string;
  location: string;
}

export interface RegisteredEvents {
  upcoming: UpcomingEvent[];
  past: EventParticipation[];
}

// Profiloplysninger, som endnu ikke findes i databasen (dummy data).
export interface IProfileRepository {
  getCurrentVolunteer(): Promise<Volunteer>;
  getCreditsPerEvent(): Promise<number>;
}

// Den frivilliges tilmeldinger. Samme data som volunteer-dashboardet bruger.
export interface IProfileEventRepository {
  getRegisteredEvents(volunteerId: string): Promise<RegisteredEvents>;
  cancelRegistration(volunteerId: string, registrationId: string): Promise<void>;
}

// Skift adgangskode for den bruger, der er logget ind.
export interface IPasswordRepository {
  changePassword(email: string, currentPassword: string, newPassword: string): Promise<void>;
}
