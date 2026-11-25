'use client';

import { useState } from 'react';
import { EventParticipation, UpcomingEvent } from '@/services/profileService';
import { card, dateLabel, portalButton as button } from '@/components/portalStyles';

interface MyEventsProps {
  upcoming: UpcomingEvent[];
  past: EventParticipation[];
  loading: boolean;
  error: string | null;
  onCancel: (registrationId: string) => Promise<void>;
}

export default function MyEvents({ upcoming, past, loading, error, onCancel }: MyEventsProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function cancelSignUp(registrationId: string) {
    setCancellingId(registrationId);
    setCancelError(null);

    try {
      await onCancel(registrationId);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Tilmeldingen kunne ikke afmeldes.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Mine stævner</h2>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          Kunne ikke hente dine stævner: {error}
        </p>
      )}
      {cancelError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {cancelError}
        </p>
      )}

      <div className="mt-5 grid max-w-xl grid-cols-2 gap-4">
        <div className={card}>
          <p className="text-3xl font-semibold">{loading ? '–' : past.length}</p>
          <p className="mt-1 text-sm text-neutral-600">Deltaget i</p>
        </div>
        <div className={card}>
          <p className="text-3xl font-semibold">{loading ? '–' : upcoming.length}</p>
          <p className="mt-1 text-sm text-neutral-600">Tilmeldt</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-neutral-600">Henter dine stævner…</p>
      ) : (
        <>
          <h3 className="mt-8 font-semibold">Tilmeldt</h3>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">
              Du er ikke tilmeldt nogen kommende vagter. Find et stævne under Find events.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {upcoming.map((event) => (
                <li key={event.id} className={`${card} flex flex-wrap items-center justify-between gap-4`}>
                  <div>
                    <p className="font-semibold">
                      {event.name}
                      <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                        Tilmeldt
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {event.shift} · {dateLabel(event.date)}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelSignUp(event.id)}
                    disabled={cancellingId !== null}
                    className={button}
                  >
                    {cancellingId === event.id ? 'Afmelder…' : 'Afmeld'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-8 font-semibold">Tidligere</h3>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">Du har ikke deltaget i nogen stævner endnu.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {past.map((event) => (
                <li key={event.id} className="rounded-xl border border-neutral-200 p-5">
                  <p className="font-semibold">
                    {event.name}
                    <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                      Deltaget
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {event.shift} · {dateLabel(event.date)}
                    {event.location && ` · ${event.location}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
