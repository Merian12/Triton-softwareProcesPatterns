'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { RegisteredEvents, Volunteer } from '@/services/profileService';
import { SupabaseProfileEventRepository } from '@/repositories/supabaseProfileEventRepo';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ClubAccount from '@/components/ClubAccount';
import MyEvents from '@/components/MyEvents';
import { useSignedInProfile } from '@/components/ProfileShell';
import { card, input, portalPrimary as primary } from '@/components/portalStyles';

interface ProfileDetailsProps {
  user: Volunteer;
  clubs: string[];
  creditsPerEvent: number;
}

function Dropdown({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={card}>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default function ProfileDetails({ user, clubs, creditsPerEvent }: ProfileDetailsProps) {
  const profile = useSignedInProfile();
  const eventRepo = useMemo(() => new SupabaseProfileEventRepository(), []);

  const [club, setClub] = useState(user.club);
  const [selectedClub, setSelectedClub] = useState(user.club);

  const [events, setEvents] = useState<RegisteredEvents>({ upcoming: [], past: [] });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Henter den indloggede frivilliges tilmeldinger fra Supabase.
  useEffect(() => {
    let ignore = false;

    eventRepo
      .getRegisteredEvents(profile.id)
      .then((result) => {
        if (!ignore) setEvents(result);
      })
      .catch((err: unknown) => {
        if (!ignore) setEventsError(err instanceof Error ? err.message : 'Ukendt fejl.');
      })
      .finally(() => {
        if (!ignore) setLoadingEvents(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventRepo, profile.id]);

  async function cancelRegistration(registrationId: string) {
    await eventRepo.cancelRegistration(profile.id, registrationId);
    setEvents((current) => ({
      ...current,
      upcoming: current.upcoming.filter((event) => event.id !== registrationId),
    }));
  }

  return (
    <>
      <section className="mt-8">
        <h2 className="font-semibold">Mine oplysninger</h2>
        <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
          <dt>Mail</dt>
          <dd className="break-all">{user.email}</dd>
          <dt>Telefon</dt>
          <dd>{user.phone}</dd>
          <dt>Klub</dt>
          <dd>{club}</dd>
        </dl>
      </section>

      <MyEvents
        upcoming={events.upcoming}
        past={events.past}
        loading={loadingEvents}
        error={eventsError}
        onCancel={cancelRegistration}
      />

      <div className="mt-10 space-y-3">
        <Dropdown title="Skift klub">
          <label htmlFor="club" className="block text-sm font-medium">
            Vælg klub
          </label>
          <select
            id="club"
            value={selectedClub}
            onChange={(event) => setSelectedClub(event.target.value)}
            className={`mt-1 ${input}`}
          >
            {clubs.map((clubName) => (
              <option key={clubName} value={clubName}>
                {clubName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-600">Prototype: valget bliver ikke gemt.</p>
          <button type="button" onClick={() => setClub(selectedClub)} className={`mt-3 ${primary}`}>
            Gem klub
          </button>
        </Dropdown>

        <Dropdown title="Skift adgangskode">
          <ChangePasswordForm />
        </Dropdown>

        <Dropdown title="Klubkonto">
          {/* key={club}: skifter man klub, skal kontoen tilknyttes igen. */}
          <ClubAccount
            key={club}
            club={club}
            creditsPerEvent={creditsPerEvent}
            attendedEventsCount={events.past.length}
          />
        </Dropdown>
      </div>
    </>
  );
}
