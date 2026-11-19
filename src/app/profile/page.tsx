import { DummyProfileRepository } from '@/repositories/dummyProfileRepo';
import MyEvents from '@/components/MyEvents';
import ProfileDetails from '@/components/ProfileDetails';
import ProfileShell from '@/components/ProfileShell';

export default async function ProfilePage() {
  const repo = new DummyProfileRepository();
  const currentUser = await repo.getCurrentVolunteer();
  const clubs = await repo.getClubs();
  const creditsPerEvent = await repo.getCreditsPerEvent();
  const pastEvents = await repo.getMyEvents();
  const signedUpEvents = await repo.getUpcomingEvents();

  return (
    <ProfileShell>
      <h1 className="text-3xl font-semibold tracking-tight">{currentUser.name}</h1>

      <ProfileDetails
        user={currentUser}
        clubs={clubs}
        creditsPerEvent={creditsPerEvent}
        attendedEventsCount={pastEvents.length}
      >
        <MyEvents initialSignedUpEvents={signedUpEvents} pastEvents={pastEvents} />
      </ProfileDetails>
    </ProfileShell>
  );
}
