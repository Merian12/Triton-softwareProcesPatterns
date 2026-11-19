'use client';

import { useState } from 'react';
import { EventParticipation, UpcomingEvent } from '@/services/profileService';
import { card, dateLabel, portalButton as button } from '@/components/portalStyles';

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
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Mine events</h2>

      <div className="mt-5 grid max-w-xl grid-cols-2 gap-4">
        <div className={card}>
          <p className="text-3xl font-semibold">{pastEvents.length}</p>
          <p className="mt-1 text-sm text-neutral-600">Deltaget i</p>
        </div>
        <div className={card}>
          <p className="text-3xl font-semibold">{signedUpEvents.length}</p>
          <p className="mt-1 text-sm text-neutral-600">Tilmeldt</p>
        </div>
      </div>

      <h3 className="mt-8 font-semibold">Tilmeldt</h3>
      {signedUpEvents.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">Du er ikke tilmeldt nogen events.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {signedUpEvents.map((event) => (
            <li key={event.id} className={`${card} flex flex-wrap items-center justify-between gap-4`}>
              <div>
                <p className="font-semibold">
                  {event.name}
                  <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                    Tilmeldt
                  </span>
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {dateLabel(event.date)} · {event.location}
                </p>
              </div>
              <button type="button" onClick={() => cancelSignUp(event.id)} className={button}>
                Afmeld
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-8 font-semibold">Tidligere</h3>
      <ul className="mt-3 space-y-3">
        {pastEvents.map((event) => (
          <li key={event.id} className="rounded-xl border border-neutral-200 p-5">
            <p className="font-semibold">
              {event.name}
              <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                Deltaget
              </span>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {dateLabel(event.date)} · {event.location}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
