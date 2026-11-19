'use client';
import { useLanguage } from '@/components/LanguageProvider';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  portalButton as button,
  portalPrimary as primary,
  navTab,
  portalNav,
} from './portalStyles';
import type { UserProfile } from '@/services/authService';
import { AccountIdentity } from '@/components/AccountIdentity';
import { Logo } from '@/components/Logo';
import VolunteerCalendar from '@/components/VolunteerCalendar';
import ExpandedCalendar from '@/components/ExpandedCalendar';
import { supabase } from '@/lib/supabaseClient';
import Messages from '@/components/Messages';
import MyShiftNotes from '@/components/MyShiftNotes';

type View =
  | 'Overview'
  | 'Find events'
  | 'My shifts'
  | 'Calendar'
  | 'Messages'
  | 'My profile';

type Shift = {
  id: string;
  event_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  registered_count: number;
  status: string;
};

type Event = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  location?: string | null;
  starts_at?: string | null;
  shifts: Shift[];
};

type Booking = {
  id: string;
  shift_id: string;
  status: string;
  event: Event;
  shift: Shift;
};

type RegistrationRow = {
  id: string;
  shift_id: string;
  status: string;
};

const views: View[] = [
  'Overview',
  'Find events',
  'My shifts',
  'Calendar',
  'Messages',
  'My profile',
];

function availablePlaces(shift: Shift) {
  if (shift.status !== 'open') return 0;

  if (shift.capacity === null) return null;

  return Math.max(
    0,
    shift.capacity - shift.registered_count
  );
}

export default function VolunteerDashboard({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => Promise<void>;
}) {
  const { t, locale } = useLanguage();
  function eventName(event: Event) {
    return event.title || event.name || t('Untitled event');
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
    return `${formatTime(shift.starts_at)} – ${formatTime(shift.ends_at)}`;
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
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoSpin, setLogoSpin] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        eventsResult,
        shiftsResult,
        registrationsResult,
      ] = await Promise.all([
        supabase.from('events').select('*'),
        supabase
          .from('shifts')
          .select('*')
          .order('starts_at', { ascending: true }),
        supabase
          .from('registrations')
          .select('id, shift_id, status')
          .eq('volunteer_id', profile.id),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (shiftsResult.error) throw shiftsResult.error;
      if (registrationsResult.error) {
        throw registrationsResult.error;
      }

      const allShifts = (shiftsResult.data ?? []) as Shift[];

      const allEvents: Event[] = (
        eventsResult.data ?? []
      ).map(row => ({
        ...row,
        shifts: allShifts.filter(
          shift => shift.event_id === row.id
        ),
      }));

      const registrations = (
        registrationsResult.data ?? []
      ) as RegistrationRow[];

      const registeredBookings: Booking[] = registrations
        .filter(row => row.status === 'registered')
        .flatMap(row => {
          const shift = allShifts.find(
            item => item.id === row.shift_id
          );

          if (!shift) return [];

          const matchingEvent = allEvents.find(
            item => item.id === shift.event_id
          );

          if (!matchingEvent) return [];

          return [{
            id: row.id,
            shift_id: row.shift_id,
            status: row.status,
            event: matchingEvent,
            shift,
          }];
        });

      setEvents(allEvents);
      setBookings(registeredBookings);
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
    bookings.some(
      booking => booking.shift_id === shift.id
    );

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

    console.log('REGISTERING SHIFT:', selection.shift.id);
    console.log('VOLUNTEER ID:', profile.id);

    const { data, error: registrationError } = await supabase
      .from('registrations')
      .insert({
        shift_id: selection.shift.id,
        volunteer_id: profile.id,
        status: 'registered',
      })
      .select();

    console.log('REGISTRATION RESULT:', data);
    console.log('REGISTRATION ERROR:', registrationError);

    if (registrationError) {
      setError(registrationError.message);
      setRegistering(false);
      await loadData();
      return;
    }

    await loadData();

    navigate('My shifts');
    setNotice(
      'Registration confirmed. Your shift has been saved.'
    );

    setRegistering(false);
  }

  async function logout() {
    setLoggingOut(true);
    setError('');

    try {
      await onLogout();
    } catch {
      setError('Could not log out. Please try again.');
    } finally {
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
          ...a.shifts.map(s => new Date(s.starts_at).getTime())
        );
        const bDate = Math.min(
          ...b.shifts.map(s => new Date(s.starts_at).getTime())
        );

        return aDate - bDate;
      });

    if (!upcomingEvents.length) {
      return (
        <p className="mt-5 text-neutral-600">
          {t("No upcoming events available.")} </p>
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
              {e.location || firstShift.location || t("Location TBA")}
              {' · '}
              {e.shifts.length}
              {e.shifts.length === 1 ? t(" shift") : t(" shifts")}
            </p>

            <p className="mt-1 text-sm text-neutral-600">
              {places} {t("places available")} </p>
          </div>

          <button
            type="button"
            className={`${button} col-start-2 justify-self-start sm:col-start-auto`}
            onClick={() => {
              setEvent(e);
              setNotice('');
            }}
          >
            {t("View shifts")} </button>
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
      <span className="text-[#262E40]">Volunteer</span>
      <span className="text-[#D7142A]">portal</span>
    </span>
  </button>

  <span className="text-sm text-neutral-600">
    {t("Triton Swim Ballerup · demo club")} </span>

  <div className="ml-auto flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2.5 border-r border-border-subtle pr-3 text-[#262E40]">
      <AccountIdentity
        email={profile.email}
        username={profile.username}
        roleLabel="Volunteer"
      />
    </div>

    <Link href="/profile" className={button}>
      {t("My profile")}
    </Link>

    <button
      type="button"
      className={button}
      disabled={loggingOut}
      onClick={logout}
    >
      {loggingOut ? t("Logging out…") : t("Log out")}
    </button>
  </div>
</header>

{/* Navigation */}
<nav
  aria-label={t("Main navigation")}
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
      aria-current={view === item ? 'page' : undefined}
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
                    } else {
                      setEvent(null);
                    }
                  }}
                  aria-label={t("Go back")}
                  title={t("Go back")}
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

              <div className={view === 'Overview' && !event && !selection ? 'relative pr-[150px]' : undefined}>
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {selection
                      ? t("Review your shift")
                      : event
                        ? eventName(event)
                        : t(view)}
                  </h1>

                  <p className="mt-3 break-words text-sm text-neutral-600">
                    {t("Signed in as")} {profile.email}
                  </p>
                </div>
                {view === 'Overview' && !event && !selection && (
                  <div className="absolute right-0 top-0">
                    <VolunteerCalendar
                      onOpenCalendar={() => navigate('Calendar')}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {loading && (
            <p className="mt-5 text-sm text-neutral-500">
              {t("Loading events and registrations...")} </p>
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
            <p role="alert" className="mt-6 text-red-800">
              {t(error)}
            </p>
          )}

          {selection ? (
            <section className="mt-8 max-w-2xl">
              <h2 className="mt-7 text-xl font-semibold">
                {shiftName(selection.shift)}
              </h2>

              <dl className="mt-5 grid grid-cols-[90px_1fr] gap-4 text-sm sm:grid-cols-[120px_1fr]">
                {Object.entries({
                  Event: eventName(selection.event),
                  Date: formatDate(selection.shift.starts_at),
                  Time: shiftTime(selection.shift),
                  Location:
                    selection.shift.location ||
                    selection.event.location ||
                    t('TBA'),
                  Task:
                    selection.shift.description ||
                    t('No description provided.'),
                }).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-neutral-600">
                      {t(key)}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {registered(selection.shift) ? (
                <div className="mt-6">
                  <p>{t("You are registered for this shift.")}</p>

                  <button
                    type="button"
                    className={`${button} mt-4`}
                    onClick={() => navigate('Messages')}
                  >
                    {t("Message coordinator")} </button>

                  <p className="mt-3 text-sm text-neutral-600">
                    {t("To change or cancel a shift, contact your coordinator.")} </p>
                </div>
              ) : (
                <>
                  <label className="mt-6 flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-[#FF0000]"
                      checked={accepted}
                      onChange={e =>
                        setAccepted(e.target.checked)
                      }
                    />
                    {t("I have read the task description and can attend the entire shift.")} </label>

                  <button
                    type="button"
                    className={`${primary} mt-5`}
                    disabled={
                      !accepted ||
                      registering ||
                      loading ||
                      availablePlaces(selection.shift) === 0
                    }
                    onClick={confirm}
                  >
                    {registering
                      ? t("Registering...")
                      : t("Confirm registration")}
                  </button>
                </>
              )}
            </section>
          ) : event ? (
            <section className="mt-8 max-w-3xl">
              <p className="my-6 text-neutral-600">
                {event.description || ''}
              </p>

              {event.shifts.map(s => {
                const available = availablePlaces(s);
                const isRegistered = registered(s);
                const full = available === 0;

                return (
                  <article
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 py-5"
                  >
                    <div>
                      <h2 className="font-semibold">
                        {shiftName(s)}
                      </h2>

                      <p className="mt-1 text-sm text-neutral-600">
                        {formatDate(s.starts_at)}
                        {' · '}
                        {shiftTime(s)}
                        {' · '}
                        {s.location || event.location || t("TBA")}
                      </p>

                      <p className="mt-2 text-sm">
                        {isRegistered
                          ? t("Registered")
                          : full
                            ? t("Fully booked")
                            : available === null
                              ? t("Places available")
                              : t("{value0} places available", { value0: available })}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={button}
                      disabled={
                        isRegistered || full || loading
                      }
                      onClick={() => choose(event, s)}
                    >
                      {isRegistered
                        ? t("Registered")
                        : full
                          ? t("Fully booked")
                          : t("Choose shift")}
                    </button>
                  </article>
                );
              })}
            </section>
          ) : view === 'Overview' ? (
            <div className="mt-9">
              <section className="border-b border-neutral-200 pb-7">
                <div className="min-w-0">
                  <h2 className="pr-[150px] text-lg font-semibold">
                    {t("Your next shift")} </h2>

                  {next ? (
                    <>
                      <h3 className="mt-4 text-xl">
                        {eventName(next.event)}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-600">
                        {formatDate(next.shift.starts_at)}
                        {' · '}
                        {shiftTime(next.shift)}
                        {' · '}
                        {shiftName(next.shift)}
                      </p>

                      <button
                        type="button"
                        className={`${button} mt-4`}
                        onClick={() =>
                          choose(next.event, next.shift)
                        }
                      >
                        {t("View shift")} </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-neutral-600">
                        {t("You have not signed up for an upcoming shift yet.")} </p>

                      <p className="mt-2 text-sm text-neutral-600">
                        {t("Choose an event below to find an available task.")} </p>
                    </>
                  )}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">
                  {t("Upcoming events")} </h2>

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
                  choose(booking.event, booking.shift);
                }
              }}
              onFindEvents={() => navigate('Find events')}
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
                {t("Account details")} </h2>

              <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
                {profile.username && (
                  <>
                    <dt>Username</dt>
                    <dd className="break-all">
                      {profile.username}
                    </dd>
                  </>
                )}

                <dt>Email</dt>
                <dd className="break-all">
                  {profile.email}
                </dd>

                <dt>{t("Role")}</dt>
                <dd>{t(profile.role)}</dd>
              </dl>

              <p className="mt-5 text-sm text-neutral-600">
                {t("Profile editing and club membership are not yet available in this project.")} </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
