'use client';

import { useLanguage } from '@/components/LanguageProvider';

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

export default function VolunteerShiftList({
  event,
  registered,
  loading,
  onChoose,
}: Props) {
  const { t, locale } = useLanguage();

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

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
                {shift.title || t('Volunteer shift')}
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
                  t('TBA')}
              </p>

              <p className="mt-2 text-sm">
                {isRegistered
                  ? t('Registered')
                  : closed
                    ? t('Registration closed')
                    : unavailable
                      ? t('Unavailable')
                      : available === null
                        ? t('Places available')
                        : t('{value0} places available', {
                            value0: available,
                          })}
              </p>
            </div>

            <button
              type="button"
              className={button}
              disabled={
                loading ||
                (!isRegistered && unavailable)
              }
              onClick={() => onChoose(event, shift)}
            >
              {isRegistered
                ? t('View shift')
                : closed
                  ? t('Registration closed')
                  : unavailable
                    ? t('Unavailable')
                    : t('Choose shift')}
            </button>
          </article>
        );
      })}
    </section>
  );
}