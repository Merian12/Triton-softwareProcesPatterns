
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from '@/services/volunteerService';

import {
  portalButton as button,
  portalPrimary as primary,
  navTab,
  portalNav,
} from '../portalStyles';

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

function eventName(event: Event) {
  return event.title || event.name || 'Untitled event';
}

function shiftName(shift: Shift) {
  return shift.title || 'Volunteer shift';
}

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

function shiftTime(shift: Shift) {
  return `${formatTime(shift.starts_at)} – ${formatTime(shift.ends_at)}`;
}

export default function VolunteerDashboard({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => Promise<void>;
}) {
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
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoSpin, setLogoSpin] = useState(0);

  // Load data from Supabase through the service
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
    }
  }, [searchParams]);

  const registered = (shift: Shift) =>
    isRegistered(shift, bookings);

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
    setNotice('');
    setError('');
    setAccepted(false);
  }

  function choose(selectedEvent: Event, shift: Shift) {
    setSelection({
      event: selectedEvent,
      shift,
    });

    setAccepted(false);
    setNotice('');
    setError('');
  }

  // Register for a shift using volunteerService
  async function confirm() {
    if (!selection || !accepted || registering) return;

    if (registered(selection.shift)) {
      setError('You are already registered for this shift.');
      return;
    }

    if (availablePlaces(selection.shift) === 0) {
      setError('This shift is unavailable.');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      await registerForShift(
        selection.shift,
        profile.id
      );

      await loadData();

      navigate('My shifts');

      setNotice(
        'Registration confirmed. Your shift has been saved.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not register for this shift.'
      );
    } finally {
      setRegistering(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setError('');

    try {
      await onLogout();
    } catch {
      setError('Could not log out. Please try again.');
      setLoggingOut(false);
    }
  }

  function eventList() {
    const upcomingEvents = events
      .filter(e =>
        e.shifts.some(
          s => new Date(s.ends_at).getTime() > Date.now()
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
          No upcoming events available.
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

      const places = e.shifts.reduce((total, shift) => {
        const available = availablePlaces(shift);
        return total + (available ?? 0);
      }, 0);

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
              {date.toLocaleDateString('en-GB', {
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
                'Location TBA'}
              {' · '}
              {e.shifts.length}
              {e.shifts.length === 1
                ? ' shift'
                : ' shifts'}
            </p>

            <p className="mt-1 text-sm text-neutral-600">
              {places} places available
            </p>
          </div>

          <button
            type="button"
            className={`${button} col-start-2 justify-self-start sm:col-start-auto`}
            onClick={() => {
              setEvent(e);
              setNotice('');
            }}
          >
            View shifts
          </button>
        </article>
      );
    });
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 sm:px-9">

        {/* Original header */}
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
                Portal
              </span>
            </span>
          </button>

          <span className="text-sm text-neutral-600">
            Triton Swim Ballerup · demo club
          </span>

          <div className="ml-auto flex gap-3">
            <button
              type="button"
              className={button}
              onClick={() => navigate('My profile')}
            >
              My profile
            </button>

            <button
              type="button"
              className={button}
              disabled={loggingOut}
              onClick={logout}
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </header>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
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
              {item}
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
                    } else {
                      setEvent(null);
                    }
                  }}
                  aria-label="Go back"
                  title="Go back"
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
                      ? 'Review your shift'
                      : event
                        ? eventName(event)
                        : view}
                  </h1>

                  <p className="mt-3 break-words text-sm text-neutral-600">
                    Signed in as {profile.email}
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
              Loading events and registrations...
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-6 border-b border-neutral-300 py-4"
            >
              {notice}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-6 text-red-800"
            >
              {error}
            </p>
          )}

         
{selection ? (
  <VolunteerShiftDetails
    event={selection.event}
    shift={selection.shift}
    isRegistered={registered(selection.shift)}
    accepted={accepted}
    registering={registering}
    loading={loading}
    onAcceptedChange={setAccepted}
    onConfirm={confirm}
    onMessages={() => navigate('Messages')}
  />

) : event ? (
  <VolunteerShiftList
    event={event}
    registered={registered}
    loading={loading}
    onChoose={choose}
  />
) : view === 'Overview' ? (
         

            /* Overview */
            <div className="mt-9">
              <section className="border-b border-neutral-200 pb-7">
                <div className="min-w-0">
                  <h2 className="pr-[150px] text-lg font-semibold">
                    Your next shift
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
                        View shift
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-neutral-600">
                        You have not signed up for
                        an upcoming shift yet.
                      </p>

                      <p className="mt-2 text-sm text-neutral-600">
                        Choose an event below to find
                        an available task.
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">
                  Upcoming events
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

            /* My profile */
            <section className="mt-8">
              <h2 className="font-semibold">
                Account details
              </h2>

              <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
                <dt>Email</dt>
                <dd className="break-all">
                  {profile.email}
                </dd>

                <dt>Role</dt>
                <dd>{profile.role}</dd>
              </dl>

              <p className="mt-5 text-sm text-neutral-600">
                Profile editing and club membership
                are not yet available in this project.
              </p>
            </section>
          )}
        </main>

        <footer className="border-t border-neutral-200 py-5 text-xs text-neutral-600">
          Volunteer Portal
        </footer>
      </div>
    </div>
  );
}
