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
    if (!Object.keys(relevant).length) { setFailure(''); go(step + 1); }
    else setFailure('Fix the highlighted fields to continue.');
  }
  function save(status: ClubEvent['status']) {
    const next = { ...event, status };
    const validation = validateEvent(next, status === 'published');
    setErrors(validation);
    if (Object.keys(validation).length) {
      setFailure('Fix the highlighted fields before saving.');
      go(Object.keys(validation).some(key => !key.startsWith('shift')) ? 0 : 1);
      return;
    }
    if (affected.length && !acknowledged) { setFailure('Confirm that you have reviewed the affected registrations.'); go(2); return; }
    try { onSave(next); } catch (error) { setFailure(error instanceof Error ? error.message : 'Could not save. Please try again.'); }
  }
  function field(key: string, label: string, value: string | number, change: (value: string) => void, type = 'text') {
    return <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label htmlFor={key} className="mb-2 block text-sm">{label}</label>
      {type === 'textarea' ? <textarea id={key} rows={4} value={value} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => change(e.target.value)} className="w-full rounded-sm border border-neutral-300 p-3 focus:outline-2 focus:outline-[#FF0000]" /> : <input id={key} type={type} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined} value={Number.isNaN(value) ? '' : value} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => change(e.target.value)} className="min-h-11 w-full rounded-sm border border-neutral-300 bg-white p-3 focus:outline-2 focus:outline-[#FF0000]" />}
      {errors[key] && <p id={`${key}-error`} className="mt-2 text-sm text-red-800">{errors[key]}</p>}
    </div>;
  }
  return <form className="max-w-3xl" noValidate onSubmit={e => { e.preventDefault(); if (step < 2) checkNext(); else save('published'); }}>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight">{existing ? 'Edit event' : 'Create event'}</h1></div><button type="button" className={button} onClick={onCancel}>Close form</button></div>
    <ol aria-label="Event setup steps" className="mb-8 flex flex-wrap gap-6 border-b border-neutral-200">{['Event details', 'Shifts', 'Review'].map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined} className={`border-b-2 py-3 text-sm ${step === i ? 'border-[#FF0000] font-semibold' : 'border-transparent text-neutral-600'}`}>{i + 1}. {label}</li>)}</ol>
    {failure && <p role="alert" className="mb-5 border-b border-neutral-300 py-4 text-red-800">{failure}</p>}
    <section className={panel}>
      {step === 0 ? <><h2 className="mb-5 text-lg font-semibold">Event details</h2><div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Name', event.name, name => update({ ...event, name }))}
        {field('location', 'Location', event.location, location => update({ ...event, location }))}
        {field('description', 'Description and instructions', event.description, description => update({ ...event, description }), 'textarea')}
        {field('startDate', 'Start date', event.startDate, startDate => update({ ...event, startDate }), 'date')}
        {field('endDate', 'End date', event.endDate, endDate => update({ ...event, endDate }), 'date')}
        {field('deadline', 'Registration deadline', event.deadline, deadline => update({ ...event, deadline }), 'date')}
        {field('contact', 'Contact person', event.contact, contact => update({ ...event, contact }))}
      </div></> : step === 1 ? <><h2 className="text-lg font-semibold">Plan shifts</h2>
        {errors.shifts && <p role="alert" className="text-red-800">{errors.shifts}</p>}
        {event.shifts.map((s, i) => <fieldset key={s.id} className="my-6 rounded-xl border border-[#FF0000]/40 p-5"><legend className="px-2 font-semibold">Shift {i + 1} · {s.registrations.length} signed up</legend><div className="grid gap-5 sm:grid-cols-2">
          {field(`shift.${s.id}.task`, 'Task description', s.task, task => updateShift(s.id, { task }))}
          {field(`shift.${s.id}.location`, 'Location', s.location, location => updateShift(s.id, { location }))}
          {field(`shift.${s.id}.date`, 'Date', s.date, date => updateShift(s.id, { date }), 'date')}
          {field(`shift.${s.id}.capacity`, 'Volunteers needed', s.capacity, value => updateShift(s.id, { capacity: value === '' ? NaN : Number(value) }), 'number')}
          {field(`shift.${s.id}.start`, 'Start time', s.start, start => updateShift(s.id, { start }), 'time')}
          {field(`shift.${s.id}.end`, 'End time', s.end, end => updateShift(s.id, { end }), 'time')}
        </div><button type="button" disabled={s.registrations.length > 0} className={`${button} mt-5`} onClick={() => update({ ...event, shifts: event.shifts.filter(other => other.id !== s.id) })}>Remove shift {i + 1}</button>{s.registrations.length > 0 && <p className="mt-2 text-sm text-neutral-600">A shift with registrations cannot be removed.</p>}</fieldset>)}
        <button type="button" className={`${button} mt-3`} onClick={() => update({ ...event, shifts: [...event.shifts, { id: crypto.randomUUID(), task: '', location: event.location, date: event.startDate, start: '', end: '', capacity: 1, registrations: [] }] })}>+ Add shift</button>
      </> : <><h2 className="mb-5 text-lg font-semibold">Review before saving</h2><h3 className="text-lg font-semibold">{event.name}</h3><p className="mt-3 whitespace-pre-wrap">{event.description}</p><p className="mt-4">{event.location} · {dateLabel(event.startDate)} – {dateLabel(event.endDate)}</p><p className="mt-2">Registration deadline: {dateLabel(event.deadline)}</p><p className="mt-2">Contact: {event.contact}</p><ul className="mt-5 divide-y divide-neutral-200">{event.shifts.map(s => <li key={s.id} className="py-4"><strong>{s.task}</strong><p className="mt-1 text-sm">{s.location} · {dateLabel(s.date)} · {s.start}–{s.end}</p><p className="mt-1 text-sm">{s.registrations.length} signed up / {s.capacity} volunteers needed</p></li>)}</ul>{!event.shifts.length && <p className="mt-4">No shifts yet.</p>}</>}
    </section>
    {affected.length > 0 && <aside className="mt-6 border-l-2 border-[#FF0000] py-2 pl-5"><h2 className="font-semibold">Changes affect registrations</h2><p className="mt-2 text-sm">Review the volunteers affected by these changes.</p><ul className="my-3 list-inside list-disc text-sm">{affected.map(s => <li key={s.id}>{s.task}: {s.registrations.length} registrations</li>)}</ul><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-1 size-4 accent-[#FF0000]" />I have reviewed the changes and will inform the affected volunteers.</label></aside>}
    <div className="mt-6 flex flex-wrap gap-3">{step > 0 && <button type="button" className={button} onClick={() => go(step - 1)}>Back</button>}{initial.status === 'draft' && <button type="button" className={button} onClick={() => save('draft')}>Save draft</button>}<button className={`${primary} sm:ml-auto`} type="submit">{step < 2 ? 'Continue' : initial.status === 'published' ? 'Save changes' : 'Publish event'}</button></div>
  </form>;
}
