'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import VolunteerShiftList from '@/components/volunteer/VolunteerShiftList';
import VolunteerShiftDetails from '@/components/volunteer/VolunteerShiftDetails';

import type { UserProfile } from '@/services/authService';

import type {
  Shift,
  Event,
  Booking,
} from '@/services/volunteerTypes';

import {
  getVolunteerData,
  isRegistered,
  availablePlaces,
  registerForShift,
  addGuestsToBooking,
} from '@/services/volunteerService';

import {
  portalButton as button,
  navTab,
  portalNav,
} from '../portalStyles';

import { AccountIdentity } from '@/components/AccountIdentity';
import { Logo } from '@/components/Logo';

import VolunteerCalendar from '@/components/volunteer/VolunteerCalendar';
import ExpandedCalendar from '@/components/volunteer/ExpandedCalendar';
import Messages from '@/components/Messages';
import MyShiftNotes from '@/components/volunteer/MyShiftNotes';

type View =
  | 'Overview'
  | 'Find events'
  | 'My shifts'
  | 'Calendar'
  | 'Messages'
  | 'My profile';

const views: View[] = [
  'Overview',
  'Find events',
  'My shifts',
  'Calendar',
  'Messages',
  'My profile',
];

export default function VolunteerDashboard({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => Promise<void>;
}) {
  const { t, locale } = useLanguage();

  function eventName(event: Event) {
    return (
      event.title ||
      event.name ||
      t('Untitled event')
    );
  }

  function shiftName(shift: Shift) {
    return shift.title || t('Volunteer shift');
  }

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

  function shiftTime(shift: Shift) {
    return `${formatTime(
      shift.starts_at
    )} – ${formatTime(shift.ends_at)}`;
  }

  const searchParams = useSearchParams();

  const [view, setView] = useState<View>('Overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [event, setEvent] = useState<Event | null>(null);

  const [selection, setSelection] = useState<{
    event: Event;
    shift: Shift;
  } | null>(null);

  const [accepted, setAccepted] = useState(false);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [addingGuests, setAddingGuests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoSpin, setLogoSpin] = useState(0);

  // Load data from Supabase through volunteerService.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getVolunteerData(profile.id);

      setEvents(data.events);
      setBookings(data.bookings);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load volunteer data.'
      );
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const requestedView = searchParams?.get('view');

    if (
      requestedView &&
      views.includes(requestedView as View)
    ) {
      setView(requestedView as View);
      setEvent(null);
      setSelection(null);
      setGuestNames([]);
      setAccepted(false);
    }
  }, [searchParams]);

  const registered = (shift: Shift) =>
    isRegistered(shift, bookings);

  const getBookingForShift = (shift: Shift) =>
    bookings.find(
      booking => booking.shift_id === shift.id
    );

  const selectedShift = selection
    ? events
        .flatMap(item => item.shifts)
        .find(item => item.id === selection.shift.id) ??
      bookings.find(
        booking => booking.shift_id === selection.shift.id
      )?.shift ??
      selection.shift
    : null;

  const selectedBooking = selectedShift
    ? getBookingForShift(selectedShift)
    : undefined;

  const selectedEvent = event
    ? events.find(item => item.id === event.id) ?? event
    : null;

  const next = [...bookings]
    .filter(
      booking =>
        new Date(booking.shift.ends_at).getTime() >
        Date.now()
    )
    .sort(
      (a, b) =>
        new Date(a.shift.starts_at).getTime() -
        new Date(b.shift.starts_at).getTime()
    )[0];

  function navigate(nextView: View) {
    setView(nextView);
    setEvent(null);
    setSelection(null);
    setGuestNames([]);
    setNotice('');
    setError('');
    setAccepted(false);
  }

  function choose(selectedEvent: Event, shift: Shift) {
    setSelection({
      event: selectedEvent,
      shift,
    });

    setGuestNames([]);
    setAccepted(false);
    setNotice('');
    setError('');
  }

  function changeGuestNames(names: string[]) {
    setGuestNames(names);
    setError('');
  }

  async function confirm() {
    if (
      !selection ||
      !selectedShift ||
      !accepted ||
      registering ||
      loading
    ) {
      return;
    }

    if (registered(selectedShift)) {
      setError(
        'You are already registered for this shift.'
      );

      return;
    }

    const available = availablePlaces(selectedShift);

    if (available === 0) {
      setError('This shift is unavailable.');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      await registerForShift(
        selectedShift,
        profile.id,
        guestNames
      );

      navigate('My shifts');

      await loadData();

      setNotice(
        'Registration confirmed. Your shift has been saved.'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not complete your registration. Please try again.';

      await loadData();

      setError(message);
    } finally {
      setRegistering(false);
    }
  }

  async function addMoreGuests() {
    if (
      !selectedShift ||
      !selectedBooking ||
      addingGuests ||
      loading
    ) {
      return;
    }

    setAddingGuests(true);
    setError('');
    setNotice('');

    try {
      await addGuestsToBooking(
        selectedBooking,
        selectedShift,
        guestNames
      );

      setGuestNames([]);

      await loadData();

      setNotice(
        'Guests added to your registration.'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not add guests. Please try again.';

      await loadData();

      setError(message);
    } finally {
      setAddingGuests(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setError('');

    try {
      await onLogout();
    } catch {
      setError(
        'Could not log out. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function eventList() {
    const upcomingEvents = events
      .filter(e =>
        e.shifts.some(
          s =>
            new Date(s.ends_at).getTime() >
            Date.now()
        )
      )
      .sort((a, b) => {
        const aDate = Math.min(
          ...a.shifts.map(s =>
            new Date(s.starts_at).getTime()
          )
        );

        const bDate = Math.min(
          ...b.shifts.map(s =>
            new Date(s.starts_at).getTime()
          )
        );

        return aDate - bDate;
      });

    if (!upcomingEvents.length) {
      return (
        <p className="mt-5 text-neutral-600">
          {t('No upcoming events available.')}
        </p>
      );
    }

    return upcomingEvents.map(e => {
      const firstShift = [...e.shifts].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() -
          new Date(b.starts_at).getTime()
      )[0];

      const date = new Date(firstShift.starts_at);

      const places = e.shifts.reduce(
        (total, shift) => {
          const available = availablePlaces(shift);

          return total + (available ?? 0);
        },
        0
      );

      return (
        <article
          key={e.id}
          className="mt-4 grid grid-cols-[44px_1fr] items-center gap-4 rounded-xl border border-[#FF0000]/40 p-5 sm:grid-cols-[44px_1fr_auto]"
        >
          <div className="tabular-nums">
            <span className="block text-xl">
              {date.getDate()}
            </span>

            <span className="text-sm text-neutral-600">
              {date.toLocaleDateString(locale, {
                month: 'short',
              })}
            </span>
          </div>

          <div>
            <h3 className="font-semibold">
              {eventName(e)}
            </h3>

            <p className="mt-1 text-sm text-neutral-600">
              {e.location ||
                firstShift.location ||
                t('Location TBA')}

              {' · '}

              {e.shifts.length}

              {e.shifts.length === 1
                ? t(' shift')
                : t(' shifts')}
            </p>

            <p className="mt-1 text-sm text-neutral-600">
              {places} {t('places available')}
            </p>
          </div>

          <button
            type="button"
            className={`${button} col-start-2 justify-self-start sm:col-start-auto`}
            onClick={() => {
              setEvent(e);
              setNotice('');
              setError('');
            }}
          >
            {t('View shifts')}
          </button>
        </article>
      );
    });
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 sm:px-9">

        {/* Header */}
        <header className="flex flex-wrap items-center gap-4 py-7">
          <button
            type="button"
            onClick={() => {
              setLogoSpin(c => c + 1);
              navigate('Overview');
            }}
            className="flex cursor-pointer items-center gap-3 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF0000]"
          >
            <Logo
              variant="symbol"
              hoverAnimation="none"
              spinTrigger={logoSpin}
              className="h-9 w-9 shrink-0"
            />

            <span className="text-lg font-semibold">
              <span className="text-[#262E40]">
                Volunteer
              </span>

              <span className="text-[#D7142A]">
                portal
              </span>
            </span>
          </button>

          <span className="text-sm text-neutral-600">
            Triton Swim Ballerup
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 border-r border-border-subtle pr-3 text-[#262E40]">
              <AccountIdentity
                email={profile.email}
                username={profile.username}
                roleLabel="Volunteer"
              />
            </div>

            <Link
              href="/profile"
              className={button}
            >
              {t('My profile')}
            </Link>

            <button
              type="button"
              className={button}
              disabled={loggingOut}
              onClick={logout}
            >
              {loggingOut
                ? t('Logging out…')
                : t('Log out')}
            </button>
          </div>
        </header>

        {/* Navigation */}
        <nav
          aria-label={t('Main navigation')}
          className={portalNav}
        >
          {(
            [
              'Overview',
              'Find events',
              'My shifts',
              'Calendar',
              'Messages',
            ] as const
          ).map(item => (
            <button
              type="button"
              key={item}
              aria-current={
                view === item ? 'page' : undefined
              }
              className={navTab(view === item)}
              onClick={() => navigate(item)}
            >
              {t(item)}
            </button>
          ))}
        </nav>

        <main className="py-9">

          {/* Back arrow and page heading */}
          {view !== 'Calendar' && (
            <>
              {(event || selection) && (
                <button
                  type="button"
                  onClick={() => {
                    if (selection) {
                      setSelection(null);
                      setGuestNames([]);
                      setAccepted(false);
                    } else {
                      setEvent(null);
                    }

                    setError('');
                    setNotice('');
                  }}
                  aria-label={t('Go back')}
                  title={t('Go back')}
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-md text-neutral-900 transition-colors hover:bg-neutral-100 hover:text-[#FF0000]"
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              <div
                className={
                  view === 'Overview' &&
                  !event &&
                  !selection
                    ? 'relative pr-[150px]'
                    : undefined
                }
              >
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {selection
                      ? t('Review your shift')
                      : event
                        ? eventName(event)
                        : t(view)}
                  </h1>

                  <p className="mt-3 break-words text-sm text-neutral-600">
                    {t('Signed in as')} {profile.email}
                  </p>
                </div>

                {view === 'Overview' &&
                  !event &&
                  !selection && (
                    <div className="absolute right-0 top-0">
                      <VolunteerCalendar
                        onOpenCalendar={() =>
                          navigate('Calendar')
                        }
                      />
                    </div>
                  )}
              </div>
            </>
          )}

          {loading && (
            <p className="mt-5 text-sm text-neutral-500">
              {t('Loading events and registrations...')}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-6 border-b border-neutral-300 py-4"
            >
              {t(notice)}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-6 text-red-800"
            >
              {t(error)}
            </p>
          )}

          {selection && selectedShift ? (

            <VolunteerShiftDetails
              event={selection.event}
              shift={selectedShift}
              booking={selectedBooking}
              accepted={accepted}
              registering={registering}
              addingGuests={addingGuests}
              loading={loading}
              guestNames={guestNames}
              onGuestNamesChange={changeGuestNames}
              onAcceptedChange={setAccepted}
              onConfirm={confirm}
              onAddGuests={addMoreGuests}
              onMessages={() => navigate('Messages')}
            />

          ) : selectedEvent ? (

            <VolunteerShiftList
              event={selectedEvent}
              registered={registered}
              loading={loading}
              onChoose={choose}
            />

          ) : view === 'Overview' ? (

            <div className="mt-9">
              <section className="border-b border-neutral-200 pb-7">
                <div className="min-w-0">
                  <h2 className="pr-[150px] text-lg font-semibold">
                    {t('Your next shift')}
                  </h2>

                  {next ? (
                    <>
                      <h3 className="mt-4 text-xl">
                        {eventName(next.event)}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-600">
                        {formatDate(
                          next.shift.starts_at
                        )}

                        {' · '}

                        {shiftTime(next.shift)}

                        {' · '}

                        {shiftName(next.shift)}
                      </p>

                      {next.guests.length > 0 && (
                        <p className="mt-1 text-sm text-neutral-700">
                          {next.guests.length === 1
                            ? t('+ 1 guest')
                            : t('+ {value0} guests', {
                                value0: next.guests.length,
                              })}

                          {': '}

                          {next.guests
                            .map(guest => guest.full_name)
                            .join(', ')}
                        </p>
                      )}

                      <button
                        type="button"
                        className={`${button} mt-4`}
                        onClick={() =>
                          choose(
                            next.event,
                            next.shift
                          )
                        }
                      >
                        {t('View shift')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-neutral-600">
                        {t(
                          'You have not signed up for an upcoming shift yet.'
                        )}
                      </p>

                      <p className="mt-2 text-sm text-neutral-600">
                        {t(
                          'Choose an event below to find an available task.'
                        )}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">
                  {t('Upcoming events')}
                </h2>

                {eventList()}
              </section>
            </div>

          ) : view === 'Find events' ? (

            <section className="mt-8 max-w-3xl">
              {eventList()}
            </section>

          ) : view === 'My shifts' ? (

            <MyShiftNotes
              bookings={bookings}
              userId={profile.id}
              onViewDetails={bookingId => {
                const booking = bookings.find(
                  b => b.id === bookingId
                );

                if (booking) {
                  choose(
                    booking.event,
                    booking.shift
                  );
                }
              }}
              onFindEvents={() =>
                navigate('Find events')
              }
            />

          ) : view === 'Calendar' ? (

            <section className="mt-4">
              <ExpandedCalendar />
            </section>

          ) : view === 'Messages' ? (

            <Messages userId={profile.id} />

          ) : (

            <section className="mt-8">
              <h2 className="font-semibold">
                {t('Account details')}
              </h2>

              <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
                {profile.username && (
                  <>
                    <dt>{t('Username')}</dt>

                    <dd className="break-all">
                      {profile.username}
                    </dd>
                  </>
                )}

                <dt>{t('Email')}</dt>

                <dd className="break-all">
                  {profile.email}
                </dd>

                <dt>{t('Role')}</dt>

                <dd>{t(profile.role)}</dd>
              </dl>

              <Link
                href="/profile"
                className={`${button} mt-5 inline-flex`}
              >
                {t('My profile')}
              </Link>
            </section>

          )}
        </main>
      </div>
    </div>
  );
}