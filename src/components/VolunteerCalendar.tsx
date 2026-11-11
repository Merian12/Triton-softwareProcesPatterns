
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Shift = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
};

type Registration = {
  shift_id: string;
  status: string;
};

export default function VolunteerCalendar() {
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Always display 6 weeks to maintain a square calendar.
  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (days.length < 42) {
    days.push(null);
  }

  useEffect(() => {
    let active = true;

    async function fetchShifts() {
      setLoading(true);
      setError(null);

      // Identify the currently signed-in volunteer.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (userError || !userData.user) {
        setShifts([]);
        setError('Unable to identify the signed-in volunteer.');
        setLoading(false);
        return;
      }

      // Fetch the volunteer's active registrations.
      const { data: registrations, error: registrationError } =
        await supabase
          .from('registrations')
          .select('shift_id, status')
          .eq('volunteer_id', userData.user.id)
          .in('status', ['registered', 'confirmed']);

      if (!active) return;

      if (registrationError) {
        setError(registrationError.message);
        setShifts([]);
        setLoading(false);
        return;
      }

      const shiftIds = [
        ...new Set(
          ((registrations ?? []) as Registration[]).map(
            (registration) => registration.shift_id
          )
        ),
      ];

      if (shiftIds.length === 0) {
        setShifts([]);
        setLoading(false);
        return;
      }

      // Fetch the details of the accepted shifts.
      const { data: shiftData, error: shiftError } =
        await supabase
          .from('shifts')
          .select('id, title, location, starts_at, ends_at')
          .in('id', shiftIds)
          .order('starts_at', { ascending: true });

      if (!active) return;

      if (shiftError) {
        setError(shiftError.message);
        setShifts([]);
      } else {
        setShifts((shiftData ?? []) as Shift[]);
      }

      setLoading(false);
    }

    fetchShifts();

    // Refresh when the volunteer returns to the browser tab.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchShifts();
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      active = false;
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, []);

  function changeMonth(offset: number) {
    setCurrentMonth(new Date(year, month + offset, 1));
    setSelectedDate(null);
  }

  function getShiftsForDay(day: number): Shift[] {
    return shifts.filter((shift) => {
      const date = new Date(shift.starts_at);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const selectedShifts =
    selectedDate !== null ? getShiftsForDay(selectedDate) : [];

  return (
    <div className="flex aspect-square w-full max-w-[400px] min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:p-6">

      {/* Month navigation */}
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-7 gap-1 text-center">

        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div
            key={`weekday-${i}`}
            className="flex min-h-0 items-center justify-center text-xs font-medium text-gray-400"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          const isSelected =
            day !== null && selectedDate === day;

          const dayShifts =
            day !== null ? getShiftsForDay(day) : [];

          return (
            <div
              key={index}
              className="flex min-h-0 min-w-0 items-center justify-center"
            >
              {day !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  aria-label={`${day} ${currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}${dayShifts.length ? `, ${dayShifts.length} shifts` : ''}`}
                  aria-pressed={isSelected}
                  className={`relative flex aspect-square w-full max-w-230 flex-col items-center justify-center rounded-full text-sm transition-colors
                    ${isToday ? 'bg-red-500 text-white' : ''}
                    ${isSelected && !isToday ? 'bg-blue-100 text-blue-700' : ''}
                    ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                  `}
                >
                  <span>{day}</span>

                  {dayShifts.length > 0 && (
                    <span
                      className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                        isToday ? 'bg-white' : 'bg-blue-500'
                      }`}
                    />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date and shifts */}
      <div className="mt-2 shrink-0 border-t border-gray-100 pt-3">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : loading ? (
          <p className="text-xs text-gray-500">
            Loading shifts...
          </p>
        ) : selectedDate === null ? (
          <p className="text-xs text-gray-500">
            Select a date to view volunteer shifts
          </p>
        ) : selectedShifts.length === 0 ? (
          <p className="text-xs text-gray-500">
            No shifts on {selectedDate}{' '}
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
            })}
          </p>
        ) : (
          <div className="max-h-20 space-y-2 overflow-y-auto">
            {selectedShifts.map((shift) => (
              <div key={shift.id} className="text-xs">
                <p className="font-semibold text-gray-900">
                  {shift.title}
                </p>
                <p className="text-gray-500">
                  {formatTime(shift.starts_at)} –{' '}
                  {formatTime(shift.ends_at)}
                  {shift.location ? ` · ${shift.location}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
