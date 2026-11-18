
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const [today] = useState(() => new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchShifts() {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (userError || !userData.user) {
        setShifts([]);
        setError('Unable to identify the signed-in volunteer.');
        setLoading(false);
        return;
      }

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
            registration => registration.shift_id
          )
        ),
      ];

      if (shiftIds.length === 0) {
        setShifts([]);
        setLoading(false);
        return;
      }

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

  const todayShifts = shifts.filter(shift => {
    const date = new Date(shift.starts_at);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  });

  const weekday = today.toLocaleDateString('en-GB', {
    weekday: 'long',
  });

  return (
    <div className="relative z-40 flex w-full justify-end">
      <button
        type="button"
        onClick={() => router.push('/volunteer-calendar')}
        aria-label="Open volunteer calendar"
        className="group flex w-[260px] cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white text-center transition-colors hover:border-[#FF0000] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF0000]"
      >
        {/* BLACK CALENDAR HEADER */}
        <div className="flex h-[42px] w-full shrink-0 items-center justify-center bg-black">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
            {weekday}
          </span>
        </div>

        {/* CALENDAR BODY */}
        <div className="flex h-[208px] w-full flex-col items-center justify-center px-4 py-4">
          <span className="text-7xl font-bold leading-none tracking-tight text-[#FF0000]">
            {today.getDate()}
          </span>

          <span className="mt-4 text-xs font-medium text-neutral-600">
            {loading
              ? 'Loading shifts...'
              : error
                ? 'Unable to load shifts'
                : todayShifts.length === 0
                  ? 'No shifts today'
                  : todayShifts.length === 1
                    ? '1 shift today'
                    : `${todayShifts.length} shifts today`}
          </span>

          <span className="mt-3 text-neutral-600 transition-transform group-hover:translate-y-0.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
      </button>
    </div>
  );
}
