'use client';
import { useLanguage } from '@/components/LanguageProvider';
import { useMemo, useState } from 'react';
import type { UserProfile } from '@/services/authService';
import { ClubEvent, EventService, overview, staffing } from '@/services/eventService';
import { DemoEventRepository } from '@/repositories/demoEventRepo';
import Messages from '@/components/Messages';
import OrganizerManagement from '@/components/OrganizerManagement';
import ShiftCalendar from '@/components/ShiftCalendar';
import EventEditor from './EventEditor';
import OrganizerTopbar, { type OrganizerView } from './OrganizerTopbar';
import StaffingIcons from './StaffingIcons';
import { button, card, checkbox, dateLabel as formatDateLabel, panel, portalContainer, portalShell, primary } from '@/components/portalStyles';

export default function OrganizerDashboard({ profile, onLogout }: { profile: UserProfile; onLogout: () => Promise<void> }) {
  const { t, locale, language } = useLanguage();
  const dateLabel = (value: string) => value ? formatDateLabel(value, locale) : t("Not specified");
  const service = useMemo(() => new EventService(new DemoEventRepository()), []);
  const [events, setEvents] = useState(() => service.list());
  const [view, setView] = useState<OrganizerView>('Overview');
  const [editor, setEditor] = useState<ClubEvent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date()));
  const stats = overview(events, today);
  const selectedEvent = events.find(event => event.id === selected);
  const displayed = events.filter(event => view === 'Find events' || (event.status === 'published' && event.startDate >= today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const calendarShifts = events.flatMap(event => event.shifts.map(shift => ({
    id: `${event.id}-${shift.id}`, title: shift.task, location: shift.location,
    starts_at: `${shift.date}T${shift.start}:00`, ends_at: `${shift.date}T${shift.end}:00`,
  })));

  function canLeave() { return !dirty || window.confirm(t("Discard your unsaved changes?")); }
  function navigate(next: OrganizerView) {
    if (!canLeave()) return;
    setEditor(null); setDirty(false); setView(next); setSelected(null); setOnlyOpen(false); setNotice('');
  }
  function edit(event: ClubEvent) {
    if (!canLeave()) return;
    setEditor(event); setDirty(false); setNotice(''); window.scrollTo({ top: 0 });
  }
  function create() { edit({ id: crypto.randomUUID(), name: '', description: '', location: '', startDate: '', endDate: '', deadline: '', contact: '', status: 'draft', shifts: [] }); }
  function save(event: ClubEvent) {
    service.save(event); setEvents(service.list()); setEditor(null); setDirty(false); setView('Find events');
    setNotice(event.status === 'draft' ? 'Draft updated.' : 'Event updated.');
  }
  function showShifts(event: ClubEvent) {
    setSelected(event.id); setOnlyOpen(false);
    setTimeout(() => document.getElementById('shifts-heading')?.focus(), 0);
  }
  async function logout() {
    if (!canLeave()) return;
    setLoggingOut(true); setError('');
    try { await onLogout(); } catch { setError('Could not log out. Please try again.'); } finally { setLoggingOut(false); }
  }
  function openFilter() {
    return <label className="my-5 flex items-center gap-3 text-sm">
      <input type="checkbox" checked={onlyOpen} onChange={event => setOnlyOpen(event.target.checked)} className={checkbox} />
      {t("Only shifts with available places")} </label>;
  }
  function shiftList(event: ClubEvent) {
    const shifts = event.shifts.filter(shift => !onlyOpen || shift.capacity > shift.registrations.length);
    return <>
      {shifts.map(shift => <article key={shift.id} className="border-b border-neutral-200 py-5 last:border-b-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">{shift.task}</h3>
            <p className="mt-1 text-sm text-neutral-600">{shift.location}</p>
            <p className="mt-1 text-sm text-neutral-600">{dateLabel(shift.date)} · {shift.start}–{shift.end}</p>
          </div>
          <StaffingIcons filled={shift.registrations.length} capacity={shift.capacity} label={t("{value0} volunteer places", { value0: shift.task })} />
        </div>
        <details className="mt-3">
          <summary className="min-h-10 cursor-pointer py-2 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-brand">{t("View volunteers (")}{shift.registrations.length})</summary>
          {shift.registrations.length ? <ul className="divide-y divide-neutral-200">
            {shift.registrations.map(registration => <li key={registration.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <span>{registration.name}</span><span className="break-all text-neutral-600">{registration.email}</span>
            </li>)}
          </ul> : <p className="py-3 text-sm text-neutral-600">{t("No volunteers signed up yet.")}</p>}
        </details>
      </article>)}
      {!shifts.length && <p className="py-4 text-sm text-neutral-600">{onlyOpen ? t("No shifts with available places.") : t("No shifts yet.")}</p>}
    </>;
  }

  return <div lang={language} className={portalShell}>
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-4">{t("Skip to content")}</a>
    <OrganizerTopbar roleLabel={profile.role === 'admin' ? 'Admin' : 'Organizer'} email={profile.email} username={profile.username} activeView={editor ? null : view} loggingOut={loggingOut} onNavigate={navigate} onLogout={logout} />
    <div className={portalContainer}>
      <main id="admin-main" className="py-7 sm:py-8">
        {error && <p role="alert" className="mb-5 text-sm text-red-800">{t(error)}</p>}
        {notice && <p role="status" className="mb-5 text-sm text-neutral-700">{t(notice)}</p>}
        {profile.role === 'admin' && !editor && view === 'Overview' && <OrganizerManagement />}
        {editor ? <EventEditor key={editor.id} initial={editor} existing={events.some(event => event.id === editor.id)} onSave={save}
          onCancel={() => { if (canLeave()) { setEditor(null); setDirty(false); } }} onDirty={setDirty} /> : <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">{t(view)}</h1>
            {(view === 'Overview' || view === 'Find events') && <button className={primary} onClick={create}>{t("+ Create event")}</button>}
          </div>

          {(view === 'Overview' || view === 'Find events') && <>
            <div className={`mt-7 grid gap-10 ${view === 'Overview' ? 'lg:grid-cols-[minmax(0,1fr)_400px]' : ''}`}>
              <section aria-labelledby="events-heading" className="min-w-0 max-w-3xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="events-heading" className="text-base font-semibold">{view === 'Overview' ? t("Upcoming events") : t("All events")}</h2>
                  <span className="text-xs text-neutral-500">{displayed.length} {displayed.length === 1 ? t("event") : t("events")}</span>
                </div>
                {displayed.map(event => {
                  const staff = staffing(event);
                  const date = event.startDate ? new Date(`${event.startDate}T12:00:00`) : null;
                  return <article key={event.id} className={`mt-4 grid grid-cols-[36px_minmax(0,1fr)] items-start gap-4 ${card} p-4 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:p-5`}>
                    <div className="tabular-nums" aria-hidden="true">
                      <span className="block text-xl">{date ? date.getDate() : '–'}</span>
                      <span className="text-xs text-neutral-500">{date ? date.toLocaleDateString(locale, { month: 'short' }) : t("Draft")}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{event.name}</h3>
                        {event.status === 'draft' && <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{t("Draft")}</span>}
                      </div>
                      <p className="mt-1 text-sm text-neutral-600">{event.location || t("Location not specified")}</p>
                      <p className="mt-1 text-xs text-neutral-500">{dateLabel(event.startDate)}{event.endDate !== event.startDate && ` – ${dateLabel(event.endDate)}`}</p>
                      <StaffingIcons filled={staff.filled} capacity={staff.capacity} label={t("{value0} volunteer places", { value0: event.name })} />
                    </div>
                    <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:flex-col">
                      <button aria-label={t("View shifts for {value0}", { value0: event.name })} className={button} onClick={() => showShifts(event)}>{t("View shifts")}</button>
                      <button aria-label={t("Edit {value0}", { value0: event.name })} className={button} onClick={() => edit(event)}>{t("Edit")}</button>
                    </div>
                  </article>;
                })}
                {!displayed.length && <p className="mt-5 text-sm text-neutral-600">{t("No upcoming events.")}</p>}
              </section>
              {view === 'Overview' && <aside className="min-w-0" aria-label={t("Event calendar and staffing")}>
                <h2 className="mb-4 text-base font-semibold">{t("Your calendar")}</h2>
                <ShiftCalendar shifts={calendarShifts} />
                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-200 pt-5">
                  {[[stats.upcoming, 'Events'], [stats.openShifts, 'Open shifts'], [stats.vacancies, 'Open places']].map(([value, label]) => <div key={label}>
                    <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
                    <dt className="mt-1 text-xs text-neutral-500">{t(label)}</dt>
                  </div>)}
                </dl>
              </aside>}
            </div>
            {selectedEvent && <section className={`${panel} mt-8 max-w-3xl`} aria-labelledby="shifts-heading">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="shifts-heading" tabIndex={-1} className="text-lg font-semibold">{selectedEvent.name}</h2>
                <button className={button} onClick={() => edit(selectedEvent)}>{t("Edit event")}</button>
              </div>
              {openFilter()}{shiftList(selectedEvent)}
            </section>}
          </>}

          {view === 'My shifts' && <section className="mt-6 max-w-3xl" aria-label={t("Shift management")}>
            {openFilter()}
            {[...events].sort((a, b) => a.startDate.localeCompare(b.startDate)).filter(event => event.shifts.length > 0).map(event => <section key={event.id} className={`mb-7 ${card}`} aria-label={event.name}>
              <div className="flex items-center justify-between gap-4"><h2 className="font-semibold">{event.name}</h2><button className={button} onClick={() => edit(event)}>{t("Edit event")}</button></div>
              {shiftList(event)}
            </section>)}
            {!events.some(event => event.shifts.length) && <p className="text-sm text-neutral-600">{t("No shifts yet.")}</p>}
          </section>}
          {view === 'Messages' && <Messages userId={profile.id} />}
        </>}
      </main>
    </div>
  </div>;
}
