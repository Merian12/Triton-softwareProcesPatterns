'use client';

import { useState } from 'react';
import { EventParticipation, UpcomingEvent } from '@/services/profileService';

interface MyEventsProps {
  initialSignedUpEvents: UpcomingEvent[];
  pastEvents: EventParticipation[];
}

export default function MyEvents({ initialSignedUpEvents, pastEvents }: MyEventsProps) {
  const [signedUpEvents, setSignedUpEvents] = useState(initialSignedUpEvents);

  function cancelSignUp(eventId: string) {
    setSignedUpEvents(signedUpEvents.filter((event) => event.id !== eventId));
  }

  return (
    <>
      <h2 className="mt-6 text-lg font-semibold text-gray-800">Mine events</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-2xl font-bold text-gray-900">{pastEvents.length}</p>
          <p className="text-sm text-gray-500">Deltaget i</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-2xl font-bold text-gray-900">{signedUpEvents.length}</p>
          <p className="text-sm text-gray-500">Tilmeldt</p>
        </div>
      </div>

      <h3 className="mt-4 font-semibold text-gray-800">Tilmeldt</h3>
      {signedUpEvents.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Du er ikke tilmeldt nogen events.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {signedUpEvents.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-green-600 bg-white p-4 shadow"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {event.name}
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    Tilmeldt
                  </span>
                </p>
                <p className="text-sm text-gray-500">{event.date}, {event.location}</p>
              </div>
              <button
                onClick={() => cancelSignUp(event.id)}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
              >
                Afmeld
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-4 font-semibold text-gray-800">Tidligere</h3>
      <ul className="mt-2 space-y-2">
        {pastEvents.map((event) => (
          <li key={event.id} className="rounded-lg border-l-4 border-gray-400 bg-white p-4 shadow">
            <p className="font-medium text-gray-800">
              {event.name}
              <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                Deltaget
              </span>
            </p>
            <p className="text-sm text-gray-500">{event.date}, {event.location}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
