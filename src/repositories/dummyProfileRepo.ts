import { IProfileRepository, Volunteer } from '@/services/profileService';

// Alt herunder er opdigtet og kun til prototypen.
// Stævnerne hentes fra Supabase i supabaseProfileEventRepo.ts.
const currentVolunteer: Volunteer = {
  id: '1',
  name: 'Anna Eksempel',
  role: 'volunteer',
  email: 'anna@example.com',
  phone: '00 00 00 01',
  club: 'Triton Swim Ballerup',
};

const creditsPerEvent = 50;

export class DummyProfileRepository implements IProfileRepository {
  async getCurrentVolunteer(): Promise<Volunteer> {
    return currentVolunteer;
  }

  async getCreditsPerEvent(): Promise<number> {
    return creditsPerEvent;
  }
}
