'use client';

import { useLanguage } from '@/components/LanguageProvider';

import type {
  Event,
  Shift,
  Booking,
} from '@/services/volunteerTypes';

import {
  availablePlaces,
  registrationClosed,
} from '@/services/volunteerService';

import {
  maxAdditionalGuests,
} from '@/services/registrationService';

import {
  portalButton as button,
  portalPrimary as primary,
  input,
} from '../portalStyles';

type Props = {
  event: Event;
  shift: Shift;
  booking?: Booking;
  accepted: boolean;
  registering: boolean;
  addingGuests: boolean;
  loading: boolean;
  guestNames: string[];
  onGuestNamesChange: (names: string[]) => void;
  onAcceptedChange: (accepted: boolean) => void;
  onConfirm: () => void;
  onAddGuests: () => void;
  onMessages: () => void;
};

export default function VolunteerShiftDetails({
  event,
  shift,
  booking,
  accepted,
  registering,
  addingGuests,
  loading,
  guestNames,
  onGuestNamesChange,
  onAcceptedChange,
  onConfirm,
  onAddGuests,
  onMessages,
}: Props) {
  const { t, locale } = useLanguage();

  const closed = registrationClosed(shift);
  const available = availablePlaces(shift);

  const maxNewBeforeRegister = maxAdditionalGuests(
    available,
    0,
    true
  );

  const maxNewAfterRegister = booking
    ? maxAdditionalGuests(
        available,
        booking.guests.length,
        false
      )
    : 0;

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

  function addGuestField(maxAllowed: number) {
    if (guestNames.length >= maxAllowed) return;

    onGuestNamesChange([...guestNames, '']);
  }

  function updateGuestName(index: number, value: string) {
    onGuestNamesChange(
      guestNames.map((name, i) =>
        i === index ? value : name
      )
    );
  }

  function removeGuestField(index: number) {
    onGuestNamesChange(
      guestNames.filter((_, i) => i !== index)
    );
  }

  function guestFields(existingGuests: number) {
    return (
      <div className="mt-4 space-y-3">
        {guestNames.map((guestName, index) => (
          <div
            key={index}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <label
                htmlFor={`guest-name-${index}`}
                className="mb-1 block text-sm text-neutral-700"
              >
                {t('Guest {value0} name', {
                  value0: existingGuests + index + 1,
                })}
              </label>

              <input
                id={`guest-name-${index}`}
                type="text"
                maxLength={120}
                placeholder={t('Full name')}
                value={guestName}
                disabled={registering || addingGuests}
                onChange={e =>
                  updateGuestName(index, e.target.value)
                }
                className={input}
              />
            </div>

            <button
              type="button"
              aria-label={t('Remove guest {value0}', {
                value0: existingGuests + index + 1,
              })}
              className={button}
              disabled={registering || addingGuests}
              onClick={() => removeGuestField(index)}
            >
              {t('Remove')}
            </button>
          </div>
        ))}
      </div>
    );
  }

  const details = {
    Event:
      event.title ||
      event.name ||
      t('Untitled event'),

    Date: formatDate(shift.starts_at),

    Time: `${formatTime(shift.starts_at)} – ${formatTime(
      shift.ends_at
    )}`,

    Location:
      shift.location ||
      event.location ||
      t('TBA'),

    Task:
      shift.description ||
      t('No description provided.'),

    Contact:
      shift.contact ||
      t('Not specified'),

    'Registration deadline': shift.registration_deadline
      ? `${formatDate(
          shift.registration_deadline
        )} · ${formatTime(
          shift.registration_deadline
        )}`
      : t('No deadline specified'),
  };

  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="mt-7 text-xl font-semibold">
        {shift.title || t('Volunteer shift')}
      </h2>

      <dl className="mt-5 grid grid-cols-[90px_1fr] gap-4 text-sm sm:grid-cols-[120px_1fr]">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-neutral-600">
              {t(key)}
            </dt>

            <dd className="break-words">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {booking ? (
        <div className="mt-6">
          <p>
            {t('You are registered for this shift.')}
          </p>

          {booking.guests.length > 0 && (
            <div className="mt-4 rounded-xl border border-neutral-200 p-4">
              <h3 className="text-sm font-semibold">
                {t('Bringing')}
              </h3>

              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
                {booking.guests.map(guest => (
                  <li key={guest.id}>
                    {guest.full_name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!closed && maxNewAfterRegister > 0 && (
            <div className="mt-6 rounded-xl border border-neutral-200 p-4">
              <h3 className="text-sm font-semibold">
                {t('Bring more people')}
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                {maxNewAfterRegister === 1
                  ? t(
                      'You can add 1 more guest to this shift.'
                    )
                  : t(
                      'You can add up to {value0} more guests to this shift.',
                      {
                        value0: maxNewAfterRegister,
                      }
                    )}
              </p>

              {guestNames.length > 0 &&
                guestFields(booking.guests.length)}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={button}
                  disabled={
                    guestNames.length >= maxNewAfterRegister ||
                    addingGuests ||
                    loading
                  }
                  onClick={() =>
                    addGuestField(maxNewAfterRegister)
                  }
                >
                  {t('+ Add guest')}
                </button>

                {guestNames.length > 0 && (
                  <button
                    type="button"
                    className={primary}
                    disabled={
                      addingGuests ||
                      loading ||
                      guestNames.some(name => !name.trim())
                    }
                    onClick={onAddGuests}
                  >
                    {addingGuests
                      ? t('Adding guests...')
                      : t('Add guests')}
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            className={`${button} mt-6`}
            onClick={onMessages}
          >
            {t('Message coordinator')}
          </button>

          <p className="mt-3 text-sm text-neutral-600">
            {t(
              'To change or cancel a shift, contact your coordinator.'
            )}
          </p>
        </div>
      ) : closed ? (
        <p className="mt-6 text-sm text-red-800">
          {t('The registration deadline has passed.')}
        </p>
      ) : (
        <>
          {maxNewBeforeRegister > 0 && (
            <div className="mt-6 rounded-xl border border-neutral-200 p-4">
              <h3 className="text-sm font-semibold">
                {t('Bringing someone? (optional)')}
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                {t(
                  'You can bring up to {value0} guests without an account. Each person takes 1 spot.',
                  {
                    value0: maxNewBeforeRegister,
                  }
                )}
              </p>

              {guestNames.length > 0 &&
                guestFields(0)}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={button}
                  disabled={
                    guestNames.length >= maxNewBeforeRegister ||
                    registering ||
                    loading
                  }
                  onClick={() =>
                    addGuestField(maxNewBeforeRegister)
                  }
                >
                  {t('+ Add guest')}
                </button>

                {guestNames.length > 0 && (
                  <span className="text-sm text-neutral-600">
                    {t('Total spots: {value0}', {
                      value0: 1 + guestNames.length,
                    })}
                  </span>
                )}
              </div>
            </div>
          )}

          <label className="mt-6 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 accent-[#FF0000]"
              checked={accepted}
              disabled={registering}
              onChange={e =>
                onAcceptedChange(e.target.checked)
              }
            />

            {t(
              'I have read the task description and can attend the entire shift.'
            )}
          </label>

          <button
            type="button"
            className={`${primary} mt-5`}
            disabled={
              !accepted ||
              registering ||
              loading ||
              available === 0 ||
              guestNames.some(name => !name.trim())
            }
            onClick={onConfirm}
          >
            {registering
              ? t('Registering...')
              : t('Confirm registration')}
          </button>
        </>
      )}
    </section>
  );
}