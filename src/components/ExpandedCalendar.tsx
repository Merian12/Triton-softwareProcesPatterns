
'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CalendarNote = {
  id: string;
  note_date: string;
  content: string;
};

const weekdays = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function makeDate(year: number, month: number, day: number) {
  return new Date(year, month, day);
}

export default function ExpandedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return makeDate(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayKey = dateKey(new Date());

  const monthTitle = currentMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const firstWeekday =
    (makeDate(year, month, 1).getDay() + 6) % 7;

  const daysInMonth =
    makeDate(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError('You must be signed in to view your notes.');
      setNotes([]);
      setLoading(false);
      return;
    }

    const startDate = dateKey(makeDate(year, month, 1));
    const endDate = dateKey(makeDate(year, month + 1, 1));

    const { data, error: fetchError } = await supabase
      .from('volunteer_calendar_notes')
      .select('id, note_date, content')
      .eq('user_id', authData.user.id)
      .gte('note_date', startDate)
      .lt('note_date', endDate)
      .order('note_date');

    if (fetchError) {
      setError(fetchError.message);
      setNotes([]);
    } else {
      setNotes(data ?? []);
    }

    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  function changeMonth(direction: number) {
    setCurrentMonth(makeDate(year, month + direction, 1));
    setSelectedDate(null);
    setNoteText('');
    setMessage('');
    setError('');
  }

  function selectDay(day: number) {
    const key = dateKey(makeDate(year, month, day));

    const existingNote = notes.find(
      note => note.note_date === key
    );

    setSelectedDate(key);
    setNoteText(existingNote?.content ?? '');
    setMessage('');
    setError('');
  }

  async function saveNote() {
    if (!selectedDate) return;

    setSaving(true);
    setError('');
    setMessage('');

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError('You must be signed in to save notes.');
      setSaving(false);
      return;
    }

    const content = noteText.trim();

    if (!content) {
      setError('Write a note before saving.');
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from('volunteer_calendar_notes')
      .upsert(
        {
          user_id: authData.user.id,
          note_date: selectedDate,
          content,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,note_date',
        }
      );

    if (saveError) {
      setError(saveError.message);
    } else {
      await loadNotes();
      setMessage('Note saved successfully.');
    }

    setSaving(false);
  }

  async function deleteNote() {
    if (!selectedDate) return;

    setSaving(true);
    setError('');
    setMessage('');

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError('You must be signed in to delete notes.');
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from('volunteer_calendar_notes')
      .delete()
      .eq('user_id', authData.user.id)
      .eq('note_date', selectedDate);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setNoteText('');
      await loadNotes();
      setMessage('Note deleted.');
    }

    setSaving(false);
  }

  const selectedNote = notes.find(
    note => note.note_date === selectedDate
  );

  return (
    <div className="w-full">

      {/* Month navigation */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {monthTitle}
          </h2>

          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Select a date to view or add a note.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const today = new Date();

              setCurrentMonth(
                makeDate(
                  today.getFullYear(),
                  today.getMonth(),
                  1
                )
              );

              setSelectedDate(null);
              setNoteText('');
              setMessage('');
              setError('');
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50 sm:px-4 sm:text-sm"
          >
            Today
          </button>

          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="rounded-md border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
          >
            ←
          </button>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="rounded-md border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar and notes layout */}
      <div
        className={
          selectedDate
            ? 'grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]'
            : 'grid grid-cols-1'
        }
      >

        {/* Calendar - left side */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200">

          {/* Weekdays */}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {weekdays.map(day => (
              <div
                key={day}
                className="min-w-0 py-2 text-center text-[10px] font-semibold text-neutral-600 sm:py-3 sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar dates */}
          <div className="grid grid-cols-7">
            {calendarCells.map((day, index) => {

              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[55px] min-w-0 border-b border-r border-neutral-100 bg-neutral-50/50 sm:h-[65px] lg:h-[75px]"
                  />
                );
              }

              const key = dateKey(
                makeDate(year, month, day)
              );

              const note = notes.find(
                item => item.note_date === key
              );

              const isToday = key === todayKey;
              const isSelected = key === selectedDate;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-label={`Select ${key}${note ? ', has note' : ''}`}
                  aria-pressed={isSelected}
                  className={`h-[55px] min-w-0 overflow-hidden border-b border-r border-neutral-100 p-1.5 text-left transition-colors hover:bg-neutral-50 sm:h-[65px] sm:p-2 lg:h-[75px] ${
                    isSelected
                      ? 'bg-red-50 ring-2 ring-inset ring-[#D7142A]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs sm:h-8 sm:w-8 sm:text-sm ${
                        isToday
                          ? 'bg-[#D7142A] font-semibold text-white'
                          : 'text-neutral-800'
                      }`}
                    >
                      {day}
                    </span>

                    {note && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#D7142A]" />
                    )}
                  </div>

                  {note && (
                    <p className="mt-1 hidden truncate rounded bg-neutral-100 px-1 py-0.5 text-[10px] text-neutral-700 sm:block">
                      {note.content}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes editor - right side on desktop */}
        {selectedDate && (
          <section className="min-w-0 rounded-xl border border-neutral-200 p-4 sm:p-5">

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">
                  {makeDate(
                    Number(selectedDate.slice(0, 4)),
                    Number(selectedDate.slice(5, 7)) - 1,
                    Number(selectedDate.slice(8, 10))
                  ).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  {selectedNote ? 'Edit your note' : 'Add a note'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="shrink-0 text-sm text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={event =>
                setNoteText(event.target.value)
              }
              placeholder="Write your notes for this day..."
              rows={6}
              maxLength={5000}
              className="mt-5 w-full resize-y rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-[#D7142A]"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving || !noteText.trim()}
                onClick={saveNote}
                className="rounded-md bg-[#D7142A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B61024] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save note'}
              </button>

              {selectedNote && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={deleteNote}
                  className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  Delete note
                </button>
              )}
            </div>
          </section>
        )}

      </div>

      {/* Status messages outside the grid */}
      {loading && (
        <p className="mt-3 text-sm text-neutral-500">
          Loading notes...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}

    </div>
  );
}
