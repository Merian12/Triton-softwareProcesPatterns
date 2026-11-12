'use client';
import { useMemo, useState } from 'react';
import type { UserProfile } from '@/services/authService';
import { ClubEvent, EventService, overview, staffing } from '@/services/eventService';
import { DemoEventRepository } from '@/repositories/demoEventRepo';
import EventEditor from './EventEditor';
import OrganizerTopbar from './OrganizerTopbar';
import { button, primary, panel, dateLabel } from './ui';

export default function OrganizerDashboard({ profile, onLogout }: { profile: UserProfile; onLogout: () => Promise<void> }) {
  const service = useMemo(() => new EventService(new DemoEventRepository()), []);
  const [events, setEvents] = useState(() => service.list());
  const [view, setView] = useState<'Overblik' | 'Arrangementer'>('Overblik');
  const [editor, setEditor] = useState<ClubEvent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date()));
  const stats = overview(events, today);
  const selectedEvent = events.find(e => e.id === selected);
  const displayed = events.filter(e => view === 'Arrangementer' || (e.status === 'published' && e.startDate >= today)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  function canLeave() { return !dirty || window.confirm('Kassér dine ændringer? De er ikke gemt.'); }
  function navigate(next: typeof view) { if (!canLeave()) return; setEditor(null); setDirty(false); setView(next); setSelected(null); setNotice(''); }
  function edit(event: ClubEvent) { if (!canLeave()) return; setEditor(event); setDirty(false); setNotice(''); window.scrollTo({ top: 0 }); }
  function create() { edit({ id: crypto.randomUUID(), name: '', description: '', location: '', startDate: '', endDate: '', deadline: '', contact: '', status: 'draft', shifts: [] }); }
  function save(event: ClubEvent) { service.save(event); setEvents(service.list()); setEditor(null); setDirty(false); setView('Arrangementer'); setNotice(event.status === 'draft' ? 'Kladde gemt i denne demo. Den forsvinder, når siden genindlæses.' : 'Arrangement gemt som offentliggjort i denne demo. Intet er sendt til Supabase eller frivillige.'); }
  async function logout() { if (!canLeave()) return; setLoggingOut(true); setError(''); try { await onLogout(); } catch { setError('Kunne ikke logge ud. Prøv igen.'); setLoggingOut(false); } }
  return <div lang="da" className="min-h-screen bg-white text-neutral-900">
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-4">Gå til indhold</a>
    <OrganizerTopbar email={profile.email} activeView={editor ? null : view} loggingOut={loggingOut} onNavigate={navigate} onLogout={logout} />
    <div className="mx-auto max-w-6xl px-5 sm:px-9">
      <main id="admin-main" className="py-9">
        {!editor && <h1 className="text-3xl font-semibold tracking-tight">{view}</h1>}
        <p className={`break-words text-sm text-neutral-600 ${editor ? 'mb-6' : 'mt-3'}`}>Logget ind som {profile.email}</p>
        {error && <p role="alert" className="mt-6 text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-6 border-b border-neutral-300 py-4">{notice}</p>}
        {editor ? <EventEditor key={editor.id} initial={editor} existing={events.some(e => e.id === editor.id)} onSave={save} onCancel={() => { if (canLeave()) { setEditor(null); setDirty(false); } }} onDirty={setDirty} /> : <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-neutral-600">{view === 'Overblik' ? 'Få overblik over bemandingen, og se hvor der er brug for flere hænder.' : 'Administrér offentliggjorte arrangementer og dine kladder.'}</p>
            <button className={primary} onClick={create}>+ Opret arrangement</button>
          </div>
          <div className={`mt-9 grid gap-10 ${view === 'Overblik' ? 'lg:grid-cols-[1fr_240px]' : ''}`}>
            <section aria-labelledby="events-heading" className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="events-heading" className="text-lg font-semibold">{view === 'Overblik' ? 'Kommende arrangementer' : 'Alle arrangementer'}</h2>
                <span className="text-sm text-neutral-600">{displayed.length} arrangementer</span>
              </div>
              {displayed.map(event => {
                const staff = staffing(event);
                const date = event.startDate ? new Date(`${event.startDate}T12:00:00`) : null;
                return <article key={event.id} className="mt-4 grid grid-cols-[44px_1fr] items-start gap-4 rounded-xl border border-[#FF0000]/40 p-5 sm:grid-cols-[44px_1fr_auto]">
                  <div className="tabular-nums" aria-hidden="true">
                    <span className="block text-xl">{date ? date.getDate() : '–'}</span>
                    <span className="text-sm text-neutral-600">{date ? date.toLocaleDateString('da-DK', { month: 'short' }) : 'Kladde'}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{event.location || 'Sted ikke angivet'}</p>
                    <p className="mt-1 text-sm text-neutral-600">{dateLabel(event.startDate)}{event.endDate !== event.startDate && ` – ${dateLabel(event.endDate)}`}</p>
                    <p className="mt-2 text-sm">{staff.filled} / {staff.capacity} vagtpladser besat</p>
                    <progress className="mt-2 h-1 w-full accent-[#FF0000]" aria-label={`Bemanding for ${event.name}`} max={staff.capacity || 1} value={staff.filled} />
                    <p className="mt-1 text-sm text-neutral-600">{event.status === 'draft' ? 'Kladde · kun admin · ikke med i oversigtstallene' : `Offentliggjort · ${Math.max(0, staff.capacity - staff.filled)} ledige vagtpladser`}</p>
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:flex-col">
                    <button aria-label={`Se vagter for ${event.name}`} className={button} onClick={() => { setSelected(event.id); setOnlyOpen(false); setTimeout(() => { document.getElementById('shifts-heading')?.focus(); }, 0); }}>Se vagter</button>
                    <button aria-label={`Redigér ${event.name}`} className={button} onClick={() => edit(event)}>Redigér</button>
                  </div>
                </article>;
              })}
              {!displayed.length && <p className="mt-5 text-sm text-neutral-600">Ingen kommende offentliggjorte arrangementer. Se kladder under Arrangementer, eller opret et arrangement.</p>}
            </section>
            {view === 'Overblik' && <aside aria-label="Bemanding i kommende offentliggjorte arrangementer">
              <h2 className="font-semibold">Bemanding</h2>
              <div className="mt-4 divide-y divide-neutral-200 rounded-xl border border-[#FF0000]/40 px-5">
                {[[stats.upcoming, 'Kommende offentliggjorte arrangementer'], [stats.openShifts, 'Vagter med ledige pladser'], [stats.vacancies, 'Ubesatte vagtpladser i alt']].map(([value, label]) => <div key={label} className="py-5">
                  <p className="text-3xl font-semibold tabular-nums">{value}</p>
                  <h3 className="mt-2 text-sm text-neutral-600">{label}</h3>
                </div>)}
              </div>
              <p className="mt-4 text-sm text-neutral-600">Arrangementer med start fra {dateLabel(today)}. En person kan besætte flere vagtpladser. Kladder er ikke medregnet.</p>
            </aside>}
          </div>
          {selectedEvent && <section className={`${panel} mt-8 max-w-3xl`} aria-labelledby="shifts-heading">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-sm text-neutral-600">Vagtoversigt</p><h2 id="shifts-heading" tabIndex={-1} className="mt-2 text-lg font-semibold">{selectedEvent.name}</h2></div>
              <button className={button} onClick={() => edit(selectedEvent)}>Redigér arrangement</button>
            </div>
            <label className="my-6 flex items-center gap-3 text-sm"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} className="size-4 accent-[#FF0000]" />Kun vagter med ledige pladser</label>
            {selectedEvent.shifts.filter(s => !onlyOpen || s.capacity > s.registrations.length).map(s => <article key={s.id} className="border-b border-neutral-200 py-5 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h3 className="font-semibold">{s.task}</h3><p className="mt-1 text-sm text-neutral-600">{s.location}</p><p className="mt-1 text-sm text-neutral-600">{dateLabel(s.date)} · {s.start}–{s.end}</p></div>
                <div className="text-sm"><p>{s.registrations.length} tilmeldte / {s.capacity} nødvendige frivillige</p><p className="mt-2">{Math.max(0, s.capacity - s.registrations.length)} ledige pladser</p></div>
              </div>
              <details className="mt-4"><summary className="min-h-11 cursor-pointer py-2 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-[#FF0000]">Se tilmeldte ({s.registrations.length})</summary>
                {s.registrations.length ? <ul className="divide-y divide-neutral-200">{s.registrations.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{r.name}</span><span className="break-all text-neutral-600">{r.email}</span></li>)}</ul> : <p className="py-3 text-sm text-neutral-600">Ingen tilmeldte endnu.</p>}
              </details>
            </article>)}
            {!selectedEvent.shifts.some(s => !onlyOpen || s.capacity > s.registrations.length) && <p className="text-sm text-neutral-600">{onlyOpen ? 'Ingen vagter med ledige pladser.' : 'Der er endnu ikke oprettet vagter.'}</p>}
          </section>}
        </>}
        <p className="mt-8 max-w-3xl text-sm text-neutral-600"><strong className="font-semibold">Eksempeldata · lokal demo.</strong> Arrangementer, vagter og tilmeldinger er fiktive. Ændringer gemmes kun i den åbne side og forsvinder ved genindlæsning. Login bruger Supabase.</p>
      </main>
      <footer className="border-t border-neutral-200 py-5 text-xs text-neutral-600">Volunteer Portal · Administration · Eksempeldata</footer>
    </div>
  </div>;
}
