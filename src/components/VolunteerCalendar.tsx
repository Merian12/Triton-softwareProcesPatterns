'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ShiftCalendar, { type CalendarShift } from './ShiftCalendar';

type Registration = { shift_id: string; status: string };

export default function VolunteerCalendar() {
  const [shifts, setShifts] = useState<CalendarShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setShifts((shiftData ?? []) as CalendarShift[]);
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


  return <ShiftCalendar shifts={shifts} loading={loading} error={error} />;
}
