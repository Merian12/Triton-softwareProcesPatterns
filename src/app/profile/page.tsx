import { DummyProfileRepository } from '@/repositories/dummyProfileRepo';
import EventsSection from '@/components/EventsSection';


export default async function ProfilePage() {
  const repo = new DummyProfileRepository();
  const currentUser = await repo.getCurrentVolunteer();
  const volunteers = await repo.getVolunteers();
  const emergencyContacts = await repo.getEmergencyContacts();
  const events = await repo.getMyEvents();
  const upcomingEvents = await repo.getUpcomingEvents();


  const otherVolunteers = volunteers.filter(
    (volunteer) => volunteer.id !== currentUser.id
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}</h1>
      <p className="text-sm text-gray-500">{currentUser.email}</p>

      <h2 className="mt-6 text-lg font-semibold text-gray-800">Andre frivillige</h2>
      <ul className="mt-2 space-y-2">
        {otherVolunteers.map((volunteer) => (
          <li key={volunteer.id} className="rounded-lg bg-white p-4 shadow">
            <p className="font-medium text-gray-800">{volunteer.name}</p>
            <p className="text-sm text-gray-500">{volunteer.email}</p>
            <p className="text-sm text-gray-500">{volunteer.phone}</p>
          </li>
        ))}
      </ul>

      <EventsSection upcomingEvents={upcomingEvents} pastEvents={events} />

      <h2 className="mt-6 text-lg font-semibold text-gray-800">Beredskab</h2>
      <p className="text-sm text-gray-500">Prototype: numrene er dummy-data og virker ikke.</p>
      <ul className="mt-2 list-disc space-y-1 rounded-lg bg-white p-4 pl-8 shadow">
        {emergencyContacts.map((contact) => (
          <li key={contact.id} className="text-gray-800">
            <span className="font-semibold">
              {contact.municipality} ({contact.name}):
            </span>{' '}
            Tlf. {contact.phone}
          </li>
        ))}
      </ul>
    </main>
  );
}
