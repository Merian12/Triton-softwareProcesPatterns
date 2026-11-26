import { DummyProfileRepository } from '@/repositories/dummyProfileRepo';
import ProfileDetails from '@/components/ProfileDetails';
import ProfileShell from '@/components/ProfileShell';

export default async function ProfilePage() {
  // Navn, telefon, klub og credits er stadig dummy data.
  // Stævnerne hentes fra Supabase inde i ProfileDetails.
  const repo = new DummyProfileRepository();
  const currentUser = await repo.getCurrentVolunteer();
  const creditsPerEvent = await repo.getCreditsPerEvent();

  return (
    <ProfileShell>
      <h1 className="text-3xl font-semibold tracking-tight">{currentUser.name}</h1>

      <ProfileDetails user={currentUser} creditsPerEvent={creditsPerEvent} />
    </ProfileShell>
  );
}
