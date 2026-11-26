'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { RegisteredEvents, Volunteer } from '@/services/profileService';
import { SupabaseProfileEventRepository } from '@/repositories/supabaseProfileEventRepo';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ClubAccount from '@/components/ClubAccount';
import MyEvents from '@/components/MyEvents';
import { useSignedInProfile } from '@/components/ProfileShell';
import { card } from '@/components/portalStyles';

interface ProfileDetailsProps {
  user: Volunteer;
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

export default function ProfileDetails({ user, creditsPerEvent }: ProfileDetailsProps) {
  const { t } = useLanguage();
  const profile = useSignedInProfile();
  const eventRepo = useMemo(() => new SupabaseProfileEventRepository(), []);

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
        if (!ignore) setEventsError(err instanceof Error ? err.message : "Unknown error.");
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
        <h2 className="font-semibold">{t("My details")}</h2>
        <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
          <dt>{t("Email")}</dt>
          <dd className="break-all">{user.email}</dd>
          <dt>{t("Phone")}</dt>
          <dd>{user.phone}</dd>
          <dt>{t("Club")}</dt>
          <dd>{user.club}</dd>
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
        <Dropdown title={t("Change password")}>
          <ChangePasswordForm />
        </Dropdown>

        <Dropdown title={t("Club account")}>
          <ClubAccount
            club={user.club}
            creditsPerEvent={creditsPerEvent}
            attendedEventsCount={events.past.length}
          />
        </Dropdown>
      </div>
    </>
  );
}
