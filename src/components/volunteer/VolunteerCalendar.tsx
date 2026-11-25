'use client';
import { useLanguage } from '@/components/LanguageProvider';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type VolunteerCalendarProps = {
  onOpenCalendar?: () => void;
};

type Shift = {
  id: string;
  starts_at: string;
  ends_at: string;
};

export default function VolunteerCalendar({
  onOpenCalendar,
}: VolunteerCalendarProps) {
  const { t, locale } = useLanguage();
  const [today, setToday] = useState<Date | null>(null);
  const [shiftsToday, setShiftsToday] = useState<Shift[]>([]);

  useEffect(() => {
    setToday(new Date());

    const interval = setInterval(() => {
      setToday(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const dateKey = today?.toDateString();

  useEffect(() => {
    if (!today) return;

    let cancelled = false;

    async function loadShifts() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        if (!cancelled) setShiftsToday([]);
        return;
      }

      const { data: registrations, error: registrationError } =
        await supabase
          .from('registrations')
          .select('shift_id')
          .eq('volunteer_id', user.id)
          .eq('status', 'registered');

      if (registrationError || !registrations) return;

      const shiftIds = registrations.map(
        registration => registration.shift_id
      );

      if (shiftIds.length === 0) {
        if (!cancelled) setShiftsToday([]);
        return;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const { data: shifts, error: shiftsError } =
        await supabase
          .from('shifts')
          .select('id, starts_at, ends_at')
          .in('id', shiftIds)
          .lte('starts_at', end.toISOString())
          .gte('ends_at', start.toISOString());

      if (!cancelled && !shiftsError) {
        setShiftsToday((shifts ?? []) as Shift[]);
      }
    }

    void loadShifts();

    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const weekday = today
    ? today
        .toLocaleDateString(locale, {
          weekday: 'long',
        })
        .toUpperCase()
    : '';

  const day = today ? today.getDate() : '';

  const shiftText =
    shiftsToday.length === 0
      ? 'No shifts today'
      : shiftsToday.length === 1
        ? '1 shift today'
        : `${shiftsToday.length} shifts today`;

  return (
    <button
      type="button"
      onClick={onOpenCalendar}
      aria-label={t("Open calendar")}
      className="
        group relative block
        h-[125px] w-[130px]
        shrink-0 overflow-hidden
        rounded-[15px]
        border border-neutral-200
        bg-white
        text-center
        transition-colors duration-200
        hover:border-[#FF0000]/40
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-[#FF0000]
      "
    >
      {/* Solid red curved header and navy swoosh */}
      <svg
        viewBox="0 0 260 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 h-[50px] w-full"
        aria-hidden="true"
      >
        {/* Flat red header */}
        <path
          d="
            M 0 0
            H 260
            V 42
            C 190 10, 100 48, 0 100
            Z
          "
          fill="#D7142A"
        />

        {/* Navy swoosh */}
        <path
          d="
            M 0 55
            C 22 67, 52 56, 100 43
            C 65 62, 25 83, 0 100
            Z
          "
          fill="#262E40"
        />

        {/* Thin red accent */}
        <path
          d="
            M 0 100
            C 38 62, 91 45, 145 34
            C 90 51, 37 75, 0 100
            Z
          "
          fill="#C8101E"
        />
      </svg>

      {/* Calendar content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center">
        <div className="mt-[39px] text-[9px] leading-[10px] font-bold tracking-[0.08em] text-[#1C1C1C]">
          {weekday}
        </div>

        <div
          className="
            mt-[-2.5px]
            font-serif
            text-[52.5px]
            font-bold
            leading-none
            tracking-[-0.07em]
            text-[#1C1C1C]
          "
        >
          {day}
        </div>

        <div className="mt-[-1.5px] text-[9px] leading-[10px] text-neutral-600">
          {t(shiftText)}
        </div>

        <div className="mt-auto mb-[5px] transition-transform duration-200 group-hover:translate-y-0.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#262E40"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </button>
  );
}
