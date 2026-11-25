
'use client';

import type {
  Event,
  Shift,
} from '@/services/volunteerTypes';

import {
  availablePlaces,
  registrationClosed,
} from '@/services/volunteerService';

import {
  portalButton as button,
} from '../portalStyles';

type Props = {
  event: Event;
  registered: (shift: Shift) => boolean;
  loading: boolean;
  onChoose: (event: Event, shift: Shift) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VolunteerShiftList({
  event,
  registered,
  loading,
  onChoose,
}: Props) {
  return (
    <section className="mt-8 max-w-3xl">
      <p className="my-6 text-neutral-600">
        {event.description || ''}
      </p>

      {event.shifts.map(shift => {
        const available = availablePlaces(shift);
        const isRegistered = registered(shift);
        const closed = registrationClosed(shift);
        const unavailable = available === 0;

        return (
          <article
            key={shift.id}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 py-5"
          >
            <div>
              <h2 className="font-semibold">
                {shift.title || 'Volunteer shift'}
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {formatDate(shift.starts_at)}
                {' · '}
                {formatTime(shift.starts_at)}
                {' – '}
                {formatTime(shift.ends_at)}
                {' · '}
                {shift.location ||
                  event.location ||
                  'TBA'}
              </p>

              <p className="mt-2 text-sm">
                {isRegistered
                  ? 'Registered'
                  : closed
                    ? 'Registration closed'
                    : unavailable
                      ? 'Unavailable'
                      : available === null
                        ? 'Places available'
                        : `${available} places available`}
              </p>
            </div>

            <button
              type="button"
              className={button}
              disabled={
                isRegistered ||
                unavailable ||
                loading
              }
              onClick={() => onChoose(event, shift)}
            >
              {isRegistered
                ? 'Registered'
                : closed
                  ? 'Registration closed'
                  : unavailable
                    ? 'Unavailable'
                    : 'Choose shift'}
            </button>
          </article>
        );
      })}
    </section>
  );
}
