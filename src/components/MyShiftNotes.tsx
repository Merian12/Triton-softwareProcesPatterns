'use client';
import { useLanguage } from '@/components/LanguageProvider';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { portalButton as button } from './portalStyles';

export type ShiftBooking = {
  id: string;
  shift_id: string;
  status: string;
  guests?: { id: string; full_name: string }[];
  event: {
    id: string;
    title?: string | null;
    name?: string | null;
    location?: string | null;
  };
  shift: {
    id: string;
    event_id: string;
    title: string | null;
    starts_at: string;
    ends_at: string;
  };
};

type CalendarNote = {
  note_date: string;
  content: string;
};

type MyShiftsProps = {
  bookings: ShiftBooking[];
  userId: string;
  onViewDetails:  (bookingId: string) => void;
  onFindEvents: () => void;
};

function localDateKey(value: string) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function MyShifts({
  bookings,
  userId,
  onViewDetails,
  onFindEvents,
}: MyShiftsProps) {
  const { t, locale } = useLanguage();
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
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState('');

  const loadNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }

    setLoadingNotes(true);
    setNotesError('');

    const { data, error } = await supabase
      .from('volunteer_calendar_notes')
      .select('note_date, content')
      .eq('user_id', userId);

    if (error) {
      console.error('Could not load calendar notes:', error);
      setNotesError('Could not load your calendar notes.');
    } else {
      setNotes((data ?? []) as CalendarNote[]);
    }

    setLoadingNotes(false);
  }, [userId]);

  useEffect(() => {
    void loadNotes();

    const handleFocus = () => {
      void loadNotes();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotes]);

  const sortedBookings = [...bookings].sort(
    (a, b) =>
      new Date(a.shift.starts_at).getTime() -
      new Date(b.shift.starts_at).getTime()
  );

  return (
    <section className="mt-8 max-w-3xl">
      {notesError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {t(notesError)}
        </p>
      )}

      {sortedBookings.length > 0 ? (
        sortedBookings.map(booking => {
          const noteDate = localDateKey(
            booking.shift.starts_at
          );

          const note = notes.find(
            item => item.note_date === noteDate
          );

          return (
            <article
              key={booking.id}
              className="border-b border-neutral-200 py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    {booking.event.title ||
                      booking.event.name ||
                      t("Untitled event")}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-600">
                    {formatDate(booking.shift.starts_at)}
                    {' · '}
                    {formatTime(booking.shift.starts_at)}
                    {' – '}
                    {formatTime(booking.shift.ends_at)}
                    {' · '}
                    {booking.shift.title || t("Volunteer shift")}
                  </p>

                  {booking.guests && booking.guests.length > 0 && (
                    <p className="mt-1 text-sm text-neutral-700">
                      <span className="font-medium">{t("Bringing")}:</span>{' '}
                      {booking.guests.map(guest => guest.full_name).join(', ')}
                    </p>
                  )}
                </div>

              <button
  type="button"
  className={button}
  onClick={() => onViewDetails(booking.id)}
>
  {t("View details")} </button>
              </div>

              {note?.content?.trim() && (
                <div className="mt-4 rounded-lg border border-[#D7142A]/20 bg-[#D7142A]/5 p-4">
                  <p className="mb-2 text-sm font-semibold text-[#D7142A]">
                    {t("My notes")} </p>

                  <p className="whitespace-pre-wrap break-words text-sm text-neutral-700">
                    {note.content}
                  </p>
                </div>
              )}

              {loadingNotes && (
                <p className="mt-3 text-xs text-neutral-400">
                  {t("Loading notes...")} </p>
              )}
            </article>
          );
        })
      ) : (
        <>
          <p>
            {t("No shifts yet. Browse events to choose a task and time.")} </p>

          <button
            type="button"
            className={`${button} mt-5`}
            onClick={onFindEvents}
          >
            {t("Find events")} </button>
        </>
      )}
    </section>
  );
}
