
'use client';

import { useState } from 'react';
import { portalButton as button, portalPrimary as primary } from './portalStyles';
import type { UserProfile } from '@/services/authService';
import PortalTopbar from '@/components/PortalTopbar';
import { volunteerDemoEvents as events } from './volunteerDemoData';
import VolunteerCalendar from '@/components/VolunteerCalendar';

type View = 'Overview' | 'Find events' | 'My shifts' | 'Messages' | 'My profile';
type Shift = (typeof events)[number]['shifts'][number];
type Event = (typeof events)[number];
type Booking = { event: Event; shift: Shift };

export default function VolunteerDashboard({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => Promise<void>;
}) {
  const [view, setView] = useState<View>('Overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [selection, setSelection] = useState<Booking | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const registered = (e: Event, s: Shift) =>
    bookings.some(
      b => b.event.id === e.id && b.shift.id === s.id
    );

  const next = [...bookings].sort(
    (a, b) => a.event.day - b.event.day
  )[0];

  function navigate(nextView: View) {
    setView(nextView);
    setEvent(null);
    setSelection(null);
    setNotice('');
    setError('');
    setAccepted(false);
  }

  function choose(e: Event, s: Shift) {
    setSelection({ event: e, shift: s });
    setAccepted(false);
    setNotice('');
    setError('');
  }

  function confirm() {
    if (!selection || !accepted) return;

    if (
      registered(selection.event, selection.shift) ||
      selection.shift.spots < 1
    ) {
      setError('This shift is unavailable. Please choose another shift.');
      return;
    }

    setBookings(previous =>
      previous.some(
        b =>
          b.event.id === selection.event.id &&
          b.shift.id === selection.shift.id
      )
        ? previous
        : [...previous, selection]
    );

    navigate('My shifts');
    setNotice(
      'Registration confirmed in this demo. Your shift is shown below.'
    );
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
    return events.map(e => (
      <article
        key={e.id}
        className="mt-4 grid grid-cols-[44px_1fr] items-center gap-4 rounded-xl border border-[#FF0000]/40 p-5 sm:grid-cols-[44px_1fr_auto]"
      >
        <div className="tabular-nums">
          <span className="block text-xl">{e.day}</span>
          <span className="text-sm text-neutral-600">May</span>
        </div>

        <div>
          <h3 className="font-semibold">{e.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            {e.place} · {e.shifts.length}{' '}
            {e.shifts.length === 1 ? 'shift' : 'shifts'}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {e.shifts.reduce(
              (sum, s) =>
                sum + s.spots - (registered(e, s) ? 1 : 0),
              0
            )}{' '}
            places available
          </p>
        </div>

        <button
          className={`${button} col-start-2 justify-self-start sm:col-start-auto`}
          onClick={() => {
            setEvent(e);
            setNotice('');
          }}
        >
          View shifts
        </button>
      </article>
    ));
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <PortalTopbar
        email={profile.email}
        roleLabel="volunteers"
        activeView={view === 'My profile' ? null : view}
        loggingOut={loggingOut}
        onNavigate={navigate}
        onProfile={() => navigate('My profile')}
        onLogout={logout}
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-9">
        <main className="py-9">
          <h1 className="text-3xl font-semibold tracking-tight">
            {selection
              ? 'Review your shift'
              : event
                ? event.name
                : view}
          </h1>

          <p className="mt-3 break-words text-sm text-neutral-600">
            Signed in as {profile.email}
          </p>

          {notice && (
            <p
              role="status"
              className="mt-6 border-b border-neutral-300 py-4"
            >
              {notice}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-6 text-red-800">
              {error}
            </p>
          )}

          {selection ? (
            <section className="mt-8 max-w-2xl">
              <button
                className={button}
                onClick={() => setSelection(null)}
              >
                Back to shifts
              </button>

              <h2 className="mt-7 text-xl font-semibold">
                {selection.shift.name}
              </h2>

              <dl className="mt-5 grid grid-cols-[90px_1fr] gap-4 text-sm sm:grid-cols-[120px_1fr]">
                {Object.entries({
                  Event: selection.event.name,
                  Date: `${selection.event.day} May 2027`,
                  Time: selection.shift.time,
                  Location: selection.shift.place,
                  Meeting: selection.shift.meet,
                  Task: selection.shift.task,
                  Bring: selection.shift.need,
                }).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-neutral-600">{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {registered(selection.event, selection.shift) ? (
                <div className="mt-6">
                  <p>Registered in this demo.</p>
                  <button
                    className={`${button} mt-4`}
                    onClick={() => navigate('Messages')}
                  >
                    Message coordinator
                  </button>
                  <p className="mt-3 text-sm text-neutral-600">
                    To change or cancel a shift, contact your coordinator.
                  </p>
                </div>
              ) : (
                <>
                  <label className="mt-6 flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-[#FF0000]"
                      checked={accepted}
                      onChange={e => setAccepted(e.target.checked)}
                    />
                    I have read the task description and can attend
                    the entire shift.
                  </label>

                  <button
                    className={`${primary} mt-5`}
                    disabled={!accepted}
                    onClick={confirm}
                  >
                    Confirm registration
                  </button>
                </>
              )}
            </section>
          ) : event ? (
            <section className="mt-8 max-w-3xl">
              <button
                className={button}
                onClick={() => setEvent(null)}
              >
                Back to events
              </button>

              <p className="my-6 text-neutral-600">{event.desc}</p>

              {event.shifts.map(s => (
                <article
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 py-5"
                >
                  <div>
                    <h2 className="font-semibold">{s.name}</h2>
                    <p className="mt-1 text-sm text-neutral-600">
                      {s.time} · {s.place}
                    </p>
                    <p className="mt-2 text-sm">
                      {registered(event, s)
                        ? 'Registered'
                        : s.spots
                          ? `${s.spots} places available`
                          : 'Fully booked'}
                    </p>
                  </div>

                  <button
                    className={button}
                    disabled={registered(event, s) || !s.spots}
                    onClick={() => choose(event, s)}
                  >
                    {registered(event, s)
                      ? 'Registered'
                      : s.spots
                        ? 'Choose shift'
                        : 'Fully booked'}
                  </button>
                </article>
              ))}
            </section>
          ) : view === 'Overview' ? (
            <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0">
                <section className="border-b border-neutral-200 pb-7">
                  <h2 className="text-lg font-semibold">
                    Your next shift
                  </h2>

                  {next ? (
                    <>
                      <h3 className="mt-4 text-xl">
                        {next.event.name}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-600">
                        {next.event.day} May 2027 ·{' '}
                        {next.shift.time} · {next.shift.name}
                      </p>
                      <button
                        className={`${button} mt-4`}
                        onClick={() =>
                          choose(next.event, next.shift)
                        }
                      >
                        View shift
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-neutral-600">
                        You have not signed up for a shift yet.
                      </p>
                      <p className="mt-2 text-sm text-neutral-600">
                        Choose an event below to find an available task.
                      </p>
                    </>
                  )}
                </section>

                <section className="mt-8">
                  <h2 className="text-lg font-semibold">
                    Upcoming events
                  </h2>
                  {eventList()}
                </section>
              </div>

              {/* YOUR EXISTING SUPABASE CALENDAR COMPONENT */}
             <aside className="min-w-0 lg:translate-x-12">
                <h2 className="mb-4 font-semibold">
                  Your calendar
                </h2>

                <VolunteerCalendar />

                <div className="mt-6">
                  <button
                    className={`${button} inline-flex items-center gap-2`}
                    onClick={() => navigate('Messages')}
                  >
                    <svg
                      aria-hidden="true"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"
                    />
                    </svg>
                    Open messages
                  </button>
                </div>
              </aside>
            </div>
          ) : view === 'Find events' ? (
            <section className="mt-8 max-w-3xl">
              {eventList()}
            </section>
          ) : view === 'My shifts' ? (
            <section className="mt-8 max-w-3xl">
              {bookings.length ? (
                bookings.map(b => (
                  <article
                    key={`${b.event.id}-${b.shift.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 py-5"
                  >
                    <div>
                      <h2 className="font-semibold">
                        {b.event.name}
                      </h2>
                      <p className="mt-2 text-sm text-neutral-600">
                        {b.event.day} May 2027 ·{' '}
                        {b.shift.time} · {b.shift.name}
                      </p>
                    </div>
                    <button
                      className={button}
                      onClick={() => choose(b.event, b.shift)}
                    >
                      View details
                    </button>
                  </article>
                ))
              ) : (
                <>
                  <p>
                    No shifts yet. Browse events to choose a task
                    and time.
                  </p>
                  <button
                    className={`${button} mt-5`}
                    onClick={() => navigate('Find events')}
                  >
                    Find events
                  </button>
                </>
              )}
            </section>
          ) : view === 'Messages' ? (
            <section className="mt-8 max-w-2xl">
              <h2 className="font-semibold">
                Coordinator · demo conversation
              </h2>
              <p className="mt-3 text-sm text-neutral-600">
                Messages below are local previews. Nothing is sent.
              </p>

              <div aria-live="polite">
                {messages.map((m, i) => (
                  <p
                    key={i}
                    className="my-5 border-b border-neutral-200 py-4 whitespace-pre-wrap break-words"
                  >
                    {m}
                  </p>
                ))}
              </div>

              <form
                className="mt-6"
                onSubmit={e => {
                  e.preventDefault();
                  if (message.trim()) {
                    setMessages([...messages, message.trim()]);
                    setMessage('');
                  }
                }}
              >
                <label
                  className="block text-sm"
                  htmlFor="message"
                >
                  Your message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-sm border border-neutral-300 p-3 focus:outline-2 focus:outline-[#FF0000]"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <button
                  className={`${button} mt-4`}
                  disabled={!message.trim()}
                >
                  Preview message
                </button>
              </form>
            </section>
          ) : (
            <section className="mt-8">
              <h2 className="font-semibold">
                Account details
              </h2>
              <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
                <dt>Email</dt>
                <dd className="break-all">{profile.email}</dd>
                <dt>Role</dt>
                <dd>{profile.role}</dd>
              </dl>
              <p className="mt-5 text-sm text-neutral-600">
                Profile editing and club membership are not yet
                available in this project.
              </p>
            </section>
          )}
        </main>

        <footer className="border-t border-neutral-200 py-5 text-xs text-neutral-600">
          Volunteer Portal · Event data is for demonstration only.
        </footer>
      </div>
    </div>
  );
}
