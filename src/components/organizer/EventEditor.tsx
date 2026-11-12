'use client';
import { useEffect, useRef, useState } from 'react';
import { affectedShifts, ClubEvent, FieldErrors, Shift, validateEvent } from '@/services/eventService';
import { button, primary, panel, dateLabel } from './ui';

type Props = { initial: ClubEvent; existing: boolean; onSave: (event: ClubEvent) => void; onCancel: () => void; onDirty: (dirty: boolean) => void };
export default function EventEditor({ initial, existing, onSave, onCancel, onDirty }: Props) {
  const [event, setEvent] = useState<ClubEvent>(() => structuredClone(initial));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(event) !== JSON.stringify(initial);
  const affected = affectedShifts(existing ? initial : undefined, event);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function update(next: ClubEvent) { setEvent(next); onDirty(JSON.stringify(next) !== JSON.stringify(initial)); setAcknowledged(false); }
  function updateShift(id: string, patch: Partial<Shift>) { update({ ...event, shifts: event.shifts.map(s => s.id === id ? { ...s, ...patch } : s) }); }
  function go(next: number) { setStep(next); setTimeout(() => heading.current?.focus(), 0); }
  function checkNext() {
    const all = validateEvent(event, true);
    const relevant = Object.fromEntries(Object.entries(all).filter(([key]) => step === 0 ? !key.startsWith('shift') : key.startsWith('shift')));
    setErrors(relevant);
    if (!Object.keys(relevant).length) go(step + 1);
    else setFailure('Ret de markerede felter for at fortsætte.');
  }
  function save(status: ClubEvent['status']) {
    const next = { ...event, status };
    const validation = validateEvent(next, status === 'published');
    setErrors(validation);
    if (Object.keys(validation).length) {
      setFailure('Ret de markerede felter før du gemmer.');
      go(Object.keys(validation).some(key => !key.startsWith('shift')) ? 0 : 1);
      return;
    }
    if (affected.length && !acknowledged) { setFailure('Bekræft, at du har gennemgået de berørte tilmeldinger.'); go(2); return; }
    try { onSave(next); } catch (error) { setFailure(error instanceof Error ? error.message : 'Kunne ikke gemme. Prøv igen.'); }
  }
  function field(key: string, label: string, value: string | number, change: (value: string) => void, type = 'text') {
    return <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label htmlFor={key} className="mb-2 block text-sm">{label}</label>
      {type === 'textarea' ? <textarea id={key} rows={4} value={value} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => change(e.target.value)} className="w-full rounded-sm border border-neutral-300 p-3 focus:outline-2 focus:outline-[#FF0000]" /> : <input id={key} type={type} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined} value={Number.isNaN(value) ? '' : value} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => change(e.target.value)} className="min-h-11 w-full rounded-sm border border-neutral-300 bg-white p-3 focus:outline-2 focus:outline-[#FF0000]" />}
      {errors[key] && <p id={`${key}-error`} className="mt-2 text-sm text-red-800">{errors[key]}</p>}
    </div>;
  }
  return <form className="max-w-3xl" noValidate onSubmit={e => { e.preventDefault(); if (step < 2) checkNext(); else save('published'); }}>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight">{existing ? 'Redigér arrangement' : 'Opret arrangement'}</h1></div><button type="button" className={button} onClick={onCancel}>Luk formular</button></div>
    <ol aria-label="Oprettelsens trin" className="mb-8 flex flex-wrap gap-6 border-b border-neutral-200">{['Grundoplysninger', 'Vagter', 'Gennemse'].map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined} className={`border-b-2 py-3 text-sm ${step === i ? 'border-[#FF0000] font-semibold' : 'border-transparent text-neutral-600'}`}>{i + 1}. {label}</li>)}</ol>
    {failure && <p role="alert" className="mb-5 border-b border-neutral-300 py-4 text-red-800">{failure}</p>}
    <section className={panel}>
      {step === 0 ? <><h2 className="mb-5 text-lg font-semibold">Grundoplysninger</h2><p className="mb-5 text-sm text-neutral-600">Alle felter kræves ved offentliggørelse. En kladde kan være ufuldstændig, men skal have et navn og gyldige udfyldte datoer og vagter.</p><div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Navn', event.name, name => update({ ...event, name }))}
        {field('location', 'Sted', event.location, location => update({ ...event, location }))}
        {field('description', 'Beskrivelse og instruktioner', event.description, description => update({ ...event, description }), 'textarea')}
        {field('startDate', 'Startdato (første dag, inklusive)', event.startDate, startDate => update({ ...event, startDate }), 'date')}
        {field('endDate', 'Slutdato (sidste dag, inklusive)', event.endDate, endDate => update({ ...event, endDate }), 'date')}
        {field('deadline', 'Tilmeldingsfrist', event.deadline, deadline => update({ ...event, deadline }), 'date')}
        {field('contact', 'Kontaktperson (navn og kontaktoplysning)', event.contact, contact => update({ ...event, contact }))}
      </div></> : step === 1 ? <><h2 className="text-lg font-semibold">Planlæg vagter</h2><p className="my-3 text-sm text-neutral-600">En vagt starter og slutter samme dag. Opret to vagter, hvis opgaven går over midnat. Alle tider er lokale danske tider.</p>
        {errors.shifts && <p role="alert" className="text-red-800">{errors.shifts}</p>}
        {event.shifts.map((s, i) => <fieldset key={s.id} className="my-6 rounded-xl border border-[#FF0000]/40 p-5"><legend className="px-2 font-semibold">Vagt {i + 1} · {s.registrations.length} tilmeldte</legend><div className="grid gap-5 sm:grid-cols-2">
          {field(`shift.${s.id}.task`, 'Opgavebeskrivelse', s.task, task => updateShift(s.id, { task }))}
          {field(`shift.${s.id}.location`, 'Lokation', s.location, location => updateShift(s.id, { location }))}
          {field(`shift.${s.id}.date`, 'Dato', s.date, date => updateShift(s.id, { date }), 'date')}
          {field(`shift.${s.id}.capacity`, 'Nødvendigt antal frivillige', s.capacity, value => updateShift(s.id, { capacity: value === '' ? NaN : Number(value) }), 'number')}
          {field(`shift.${s.id}.start`, 'Starttid', s.start, start => updateShift(s.id, { start }), 'time')}
          {field(`shift.${s.id}.end`, 'Sluttid', s.end, end => updateShift(s.id, { end }), 'time')}
        </div><button type="button" disabled={s.registrations.length > 0} className={`${button} mt-5`} onClick={() => update({ ...event, shifts: event.shifts.filter(other => other.id !== s.id) })}>Fjern vagt {i + 1}</button>{s.registrations.length > 0 && <p className="mt-2 text-sm text-neutral-600">Vagten har tilmeldinger og kræver en særskilt aflysningsfunktion. Den kan ikke fjernes her.</p>}</fieldset>)}
        <button type="button" className={`${button} mt-3`} onClick={() => update({ ...event, shifts: [...event.shifts, { id: crypto.randomUUID(), task: '', location: event.location, date: event.startDate, start: '', end: '', capacity: 1, registrations: [] }] })}>+ Tilføj vagt</button>
      </> : <><h2 className="mb-5 text-lg font-semibold">Gennemse før du gemmer</h2><h3 className="text-lg font-semibold">{event.name}</h3><p className="mt-3 whitespace-pre-wrap">{event.description}</p><p className="mt-4">{event.location} · {dateLabel(event.startDate)} – {dateLabel(event.endDate)}</p><p className="mt-2">Tilmeldingsfrist: {dateLabel(event.deadline)}</p><p className="mt-2">Kontakt: {event.contact}</p><ul className="mt-5 divide-y divide-neutral-200">{event.shifts.map(s => <li key={s.id} className="py-4"><strong>{s.task}</strong><p className="mt-1 text-sm">{s.location} · {dateLabel(s.date)} · {s.start}–{s.end}</p><p className="mt-1 text-sm">{s.registrations.length} tilmeldte / {s.capacity} nødvendige frivillige</p></li>)}</ul>{!event.shifts.length && <p className="mt-4">Ingen vagter endnu.</p>}<p className="mt-5 text-sm text-neutral-600">{event.status === 'draft' ? 'Kladder vises kun i denne administratorside.' : 'Arrangementet er allerede offentliggjort i demoen.'} Gemning og offentliggørelse gælder kun denne demo.</p></>}
    </section>
    {affected.length > 0 && <aside className="mt-6 border-l-2 border-[#FF0000] py-2 pl-5"><h2 className="font-semibold">Tilmeldinger bliver berørt</h2><p className="mt-2 text-sm">Du ændrer tid, sted eller opgave på følgende vagter. Eksisterende tilmeldinger bevares. Ingen beskeder sendes automatisk.</p><ul className="my-3 list-inside list-disc text-sm">{affected.map(s => <li key={s.id}>{s.task}: {s.registrations.length} tilmeldinger</li>)}</ul><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-1 size-4 accent-[#FF0000]" />Jeg har gennemgået ændringerne og sørger selv for at informere de berørte frivillige.</label></aside>}
    <div className="mt-6 flex flex-wrap gap-3">{step > 0 && <button type="button" className={button} onClick={() => go(step - 1)}>Tilbage</button>}{initial.status === 'draft' && <button type="button" className={button} onClick={() => save('draft')}>Gem kladde i demo</button>}<button className={`${primary} sm:ml-auto`} type="submit">{step < 2 ? 'Fortsæt' : initial.status === 'published' ? 'Gem ændringer i demo' : 'Offentliggør i demo'}</button></div>
  </form>;
}
