
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
  portalPrimary as primary,
} from '../portalStyles';

type Props = {
  event: Event;
  shift: Shift;
  isRegistered: boolean;
  accepted: boolean;
  registering: boolean;
  loading: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onConfirm: () => void;
  onMessages: () => void;
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

export default function VolunteerShiftDetails({
  event,
  shift,
  isRegistered,
  accepted,
  registering,
  loading,
  onAcceptedChange,
  onConfirm,
  onMessages,
}: Props) {
  const closed = registrationClosed(shift);
  const available = availablePlaces(shift);

  const details = {
    Event: event.title || event.name || 'Untitled event',
    Date: formatDate(shift.starts_at),
    Time: `${formatTime(shift.starts_at)} – ${formatTime(shift.ends_at)}`,
    Location: shift.location || event.location || 'TBA',
    Task: shift.description || 'No description provided.',
    Contact: shift.contact || 'Not specified',
    'Registration deadline': shift.registration_deadline
      ? `${formatDate(shift.registration_deadline)} · ${formatTime(shift.registration_deadline)}`
      : 'No deadline specified',
  };

  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="mt-7 text-xl font-semibold">
        {shift.title || 'Volunteer shift'}
      </h2>

      <dl className="mt-5 grid grid-cols-[90px_1fr] gap-4 text-sm sm:grid-cols-[120px_1fr]">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-neutral-600">
              {key}
            </dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {isRegistered ? (
        <div className="mt-6">
          <p>You are registered for this shift.</p>

          <button
            type="button"
            className={`${button} mt-4`}
            onClick={onMessages}
          >
            Message coordinator
          </button>

          <p className="mt-3 text-sm text-neutral-600">
            To change or cancel a shift,
            contact your coordinator.
          </p>
        </div>
      ) : closed ? (
        <p className="mt-6 text-sm text-red-800">
          The registration deadline has passed.
        </p>
      ) : (
        <>
          <label className="mt-6 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 accent-[#FF0000]"
              checked={accepted}
              onChange={e =>
                onAcceptedChange(e.target.checked)
              }
            />
            I have read the task description
            and can attend the entire shift.
          </label>

          <button
            type="button"
            className={`${primary} mt-5`}
            disabled={
              !accepted ||
              registering ||
              loading ||
              available === 0
            }
            onClick={onConfirm}
          >
            {registering
              ? 'Registering...'
              : 'Confirm registration'}
          </button>
        </>
      )}
    </section>
  );
}
