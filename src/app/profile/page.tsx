import { DummyProfileRepository } from '@/repositories/dummyProfileRepo';
import MyEvents from '@/components/MyEvents';
import ProfileDetails from '@/components/ProfileDetails';

export default async function ProfilePage() {
  const repo = new DummyProfileRepository();
  const currentUser = await repo.getCurrentVolunteer();
  const clubs = await repo.getClubs();
  const creditsPerEvent = await repo.getCreditsPerEvent();
  const pastEvents = await repo.getMyEvents();
  const signedUpEvents = await repo.getUpcomingEvents();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}</h1>

      <ProfileDetails
        user={currentUser}
        clubs={clubs}
        creditsPerEvent={creditsPerEvent}
        attendedEventsCount={pastEvents.length}
      >
        <MyEvents initialSignedUpEvents={signedUpEvents} pastEvents={pastEvents} />
      </ProfileDetails>
    </main>
  );
}
