'use client';
import { useLanguage } from '@/components/LanguageProvider';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CalendarNote = {
  id: string;
  note_date: string;
  content: string;
};

type RegisteredShift = {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Pencil({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
    </svg>
  );
}

function Trash2({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

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
  const { t, locale } = useLanguage();
  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return makeDate(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [shifts, setShifts] = useState<RegisteredShift[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayKey = dateKey(new Date());

  const monthTitle = currentMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const firstWeekday = (makeDate(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = makeDate(year, month + 1, 0).getDate();

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error('You must be signed in.');
      }

      const userId = authData.user.id;

      const startDate = dateKey(makeDate(year, month, 1));
      const endDate = dateKey(makeDate(year, month + 1, 1));

      const notesResult = await supabase
        .from('volunteer_calendar_notes')
        .select('id, note_date, content')
        .eq('user_id', userId)
        .gte('note_date', startDate)
        .lt('note_date', endDate)
        .order('note_date');

      if (notesResult.error) {
        throw notesResult.error;
      }

      setNotes(notesResult.data ?? []);

      const registrationsResult = await supabase
        .from('registrations')
        .select('shift_id')
        .eq('volunteer_id', userId)
        .eq('status', 'registered');

      if (registrationsResult.error) {
        throw registrationsResult.error;
      }

      const shiftIds = [
        ...new Set(
          (registrationsResult.data ?? []).map(
            registration => registration.shift_id
          )
        ),
      ];

      if (shiftIds.length === 0) {
        setShifts([]);
        return;
      }

      const shiftsResult = await supabase
        .from('shifts')
        .select(
          'id, title, description, location, starts_at, ends_at'
        )
        .in('id', shiftIds)
        .order('starts_at', { ascending: true });

      if (shiftsResult.error) {
        throw shiftsResult.error;
      }

      setShifts(shiftsResult.data ?? []);
    } catch (err) {
      console.error('CALENDAR LOAD ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load calendar.'
      );
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function changeMonth(direction: number) {
    setCurrentMonth(makeDate(year, month + direction, 1));
    setSelectedDate(null);
    setNoteText('');
    setIsEditing(true);
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
    setIsEditing(!existingNote);
    setMessage('');
    setError('');
  }

  async function saveNote() {
    if (!selectedDate || saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error('You must be signed in to save notes.');
      }

      const content = noteText.trim();

      if (!content) {
        throw new Error('Write a note before saving.');
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
        throw saveError;
      }

      await loadData();

      setMessage('Note has been saved under My shifts.');
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save note.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!selectedDate || saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error('You must be signed in to delete notes.');
      }

      const { error: deleteError } = await supabase
        .from('volunteer_calendar_notes')
        .delete()
        .eq('user_id', authData.user.id)
        .eq('note_date', selectedDate);

      if (deleteError) {
        throw deleteError;
      }

      setNoteText('');
      setIsEditing(true);

      await loadData();

      setMessage('Note deleted.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete note.'
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedNote = notes.find(
    note => note.note_date === selectedDate
  );

  const selectedShifts = shifts.filter(
    shift =>
      selectedDate !== null &&
      dateKey(new Date(shift.starts_at)) === selectedDate
  );

  const selectedDateLabel = selectedDate
    ? makeDate(
        Number(selectedDate.slice(0, 4)),
        Number(selectedDate.slice(5, 7)) - 1,
        Number(selectedDate.slice(8, 10))
      ).toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {monthTitle}
          </h2>

          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            {t("Select a date to view shifts or add a note.")} </p>
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
              setIsEditing(true);
              setMessage('');
              setError('');
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50 sm:px-4 sm:text-sm"
          >
            {t("Today")} </button>

          <button
            type="button"
            aria-label={t("Previous month")}
            onClick={() => changeMonth(-1)}
            className="rounded-md border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
          >
            ←
          </button>

          <button
            type="button"
            aria-label={t("Next month")}
            onClick={() => changeMonth(1)}
            className="rounded-md border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar and notes side by side */}
      <div
        className={
          selectedDate
            ? 'grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]'
            : 'grid grid-cols-1'
        }
      >
        {/* Calendar */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200">
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

          <div className="grid grid-cols-7">
            {calendarCells.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[50px] min-w-0 border-b border-r border-neutral-100 bg-neutral-50/50 sm:h-[60px] lg:h-[70px]"
                  />
                );
              }

              const key = dateKey(makeDate(year, month, day));

              const note = notes.find(
                item => item.note_date === key
              );

              const dayShifts = shifts.filter(
                shift =>
                  dateKey(new Date(shift.starts_at)) === key
              );

              const isToday = key === todayKey;
              const isSelected = key === selectedDate;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-label={t("Select {value0}", { value0: key })}
                  aria-pressed={isSelected}
                  className={`h-[50px] min-w-0 overflow-hidden border-b border-r border-neutral-100 p-1 text-left transition-colors hover:bg-neutral-50 sm:h-[60px] sm:p-1.5 lg:h-[70px] ${
                    isSelected
                      ? 'bg-red-50 ring-2 ring-inset ring-[#D7142A]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm ${
                        isToday
                          ? 'bg-[#D7142A] font-semibold text-white'
                          : 'text-neutral-800'
                      }`}
                    >
                      {day}
                    </span>

                    <div className="flex items-center gap-1">
                      {note && (
                        <Pencil
                          size={12}
                          className="text-[#D7142A]"
                        />
                      )}

                      {dayShifts.length > 0 && (
                        <span
                          title={t("Registered shift")}
                          className="h-2 w-2 shrink-0 rounded-full bg-[#D7142A]"
                        />
                      )}
                    </div>
                  </div>

                  {dayShifts.length > 0 && (
                   <p className="mt-1 hidden truncate rounded bg-[#F3F4F6] px-1 py-0.5 text-[10px] font-medium text-neutral-700 sm:block">
                      {dayShifts[0].title || t("Volunteer shift")}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right-hand details panel */}
        {selectedDate && (
          <section className="flex min-w-0 flex-col rounded-xl border border-neutral-200 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 text-base font-semibold sm:text-lg">
                {selectedDateLabel}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="shrink-0 text-sm text-neutral-500 hover:text-neutral-900"
              >
                {t("Close")} </button>
            </div>

            {/* Registered shifts */}
            {selectedShifts.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold">
                  {t("Registered shifts")} </h4>

                {selectedShifts.map(shift => (
                  <div
                    key={shift.id}
                    className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {shift.title || t("Volunteer shift")}
                    </p>

                    <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
                      {formatTime(shift.starts_at)}
                      {' – '}
                      {formatTime(shift.ends_at)}
                    </p>

                    {shift.location && (
                      <p className="mt-2 break-words text-xs text-neutral-700 sm:text-sm">
                        <span className="font-semibold text-neutral-500">
                          {t("Location:")} </span>{' '}
                        {shift.location}
                      </p>
                    )}

                    {shift.description && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs text-neutral-700 sm:text-sm">
                        <span className="font-semibold text-neutral-500">
                          {t("Description:")} </span>{' '}
                        {shift.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes - fills remaining height */}
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  {t("My notes")} </h4>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMessage('');
                    }}
                    aria-label={t("Edit note")}
                    title={t("Edit note")}
                    className="text-neutral-500 hover:text-[#D7142A]"
                  >
                    <Pencil size={17} />
                  </button>

                  {selectedNote && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(t("Delete this note?"))) {
                          return;
                        }

                        await deleteNote();
                      }}
                      aria-label={t("Delete note")}
                      title={t("Delete note")}
                      disabled={saving}
                      className="text-neutral-500 hover:text-[#D7142A] disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={noteText}
                onChange={event => {
                  setNoteText(event.target.value);
                  setMessage('');
                }}
                placeholder={t("Write your notes for this day...")}
                rows={3}
                maxLength={5000}
                disabled={!!selectedNote && !isEditing}
                className={`w-full min-h-[100px] flex-1 resize-none rounded-md border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#D7142A] ${
                  selectedNote && !isEditing
                    ? 'cursor-default bg-neutral-50 text-neutral-800 opacity-100 disabled:opacity-100'
                    : 'bg-white'
                }`}
              />

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={saving || !noteText.trim()}
                    className="rounded-md bg-[#D7142A] px-4 py-2 text-xs font-medium text-white hover:bg-[#B91023] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    {saving ? t("Saving...") : t("Save note")}
                  </button>
                )}

                {message && (
                  <p
                    role="status"
                    className="text-xs text-[#D7142A] sm:text-sm"
                  >
                    ✓ {t(message)}
                  </p>
                )}

                {error && (
                  <p role="alert" className="text-xs text-red-600">
                    {t(error)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Loading and calendar errors */}
      {loading && (
        <p className="mt-3 text-sm text-neutral-500">
          {t("Loading calendar...")} </p>
      )}

      {!selectedDate && error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {t(error)}
        </p>
      )}
    </div>
  );
}
