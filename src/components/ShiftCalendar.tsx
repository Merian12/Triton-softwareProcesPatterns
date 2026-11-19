'use client';
import { useLanguage } from '@/components/LanguageProvider';
import { useState } from 'react';

export type CalendarShift = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
};

type Props = { shifts: CalendarShift[]; loading?: boolean; error?: string | null };

export default function ShiftCalendar({ shifts, loading = false, error = null }: Props) {
  const { t, locale, language } = useLanguage();
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Always display 6 weeks to keep the calendar height consistent.
  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (days.length < 42) {
    days.push(null);
  }

  function changeMonth(offset: number) {
    setCurrentMonth(new Date(year, month + offset, 1));
    setSelectedDate(null);
  }

  function getShiftsForDay(day: number): CalendarShift[] {
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
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const selectedShifts =
    selectedDate !== null ? getShiftsForDay(selectedDate) : [];

  return (
    <div role="region" aria-label={t("{value0} shift calendar", { value0: currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) })} className="relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-[30px] border border-neutral-200 bg-white px-5 pb-5 pt-[88px] sm:px-6 sm:pb-6">

      {/* Same signature curves as the volunteer calendar. */}
      <svg
        viewBox="0 0 260 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 h-[90px] w-full"
        aria-hidden="true"
      >
        <path d="M 0 0 H 260 V 42 C 190 10, 100 48, 0 100 Z" fill="#D7142A" />
        <path d="M 0 55 C 22 67, 52 56, 100 43 C 65 62, 25 83, 0 100 Z" fill="#262E40" />
        <path d="M 0 100 C 38 62, 91 45, 145 34 C 90 51, 37 75, 0 100 Z" fill="#C8101E" />
      </svg>

      {/* Month navigation */}
      <div className="relative mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">
          {currentMonth.toLocaleDateString(locale, {
            month: 'long',
            year: 'numeric',
          })}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label={t("Previous month")}
            className="flex size-9 items-center justify-center rounded-full text-xl text-[#262E40] transition-colors hover:bg-[#D7142A]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label={t("Next month")}
            className="flex size-9 items-center justify-center rounded-full text-xl text-[#262E40] transition-colors hover:bg-[#D7142A]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid min-h-[260px] grid-cols-7 grid-rows-7 gap-1 text-center">

        {(language === 'da' ? ['M', 'T', 'O', 'T', 'F', 'L', 'S'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((day, i) => (
          <div
            key={`weekday-${i}`}
            className="flex min-h-0 items-center justify-center text-xs font-medium text-muted"
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
                  aria-label={`${day} ${currentMonth.toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric',
                  })}${isToday ? t(', today') : ''}${dayShifts.length ? t(", {value0} shifts", { value0: dayShifts.length }) : ''}`}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={`relative flex aspect-square w-full max-w-10 flex-col items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
                    ${isToday ? 'bg-[#D7142A] text-white' : ''}
                    ${isSelected ? 'ring-2 ring-[#262E40] ring-offset-2' : ''}
                    ${isSelected && !isToday ? 'bg-[#D7142A]/10 text-[#1C1C1C]' : ''}
                    ${!isToday && !isSelected ? 'text-[#1C1C1C] hover:bg-[#D7142A]/10' : ''}
                  `}
                >
                  <span>{day}</span>

                  {dayShifts.length > 0 && (
                    <span
                      className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                        isToday ? 'bg-white' : 'bg-[#262E40]'
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
      <div className="mt-2 shrink-0 border-t border-neutral-200 pt-3">
        {error ? (
          <p className="text-sm text-red-600">{t(error)}</p>
        ) : loading ? (
          <p className="text-sm text-muted">
            {t("Loading shifts...")} </p>
        ) : selectedDate === null ? (
          <p className="text-sm text-muted">
            {t("Select a date to view shifts")} </p>
        ) : selectedShifts.length === 0 ? (
          <p className="text-sm text-muted">
            {t("No shifts on")} {selectedDate}{' '}
            {currentMonth.toLocaleDateString(locale, {
              month: 'long',
            })}
          </p>
        ) : (
          <div className="max-h-20 space-y-2 overflow-y-auto">
            {selectedShifts.map((shift) => (
              <div key={shift.id} className="text-sm">
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
