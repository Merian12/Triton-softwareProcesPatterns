'use client';

import { ReactNode, useState } from 'react';
import { Volunteer } from '@/services/profileService';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ClubAccount from '@/components/ClubAccount';
import { card, input, portalPrimary as primary } from '@/components/portalStyles';

interface ProfileDetailsProps {
  user: Volunteer;
  clubs: string[];
  creditsPerEvent: number;
  attendedEventsCount: number;
  children: ReactNode;
}

function Dropdown({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={card}>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default function ProfileDetails({
  user,
  clubs,
  creditsPerEvent,
  attendedEventsCount,
  children,
}: ProfileDetailsProps) {
  const [club, setClub] = useState(user.club);
  const [selectedClub, setSelectedClub] = useState(user.club);

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

      {children}

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
            attendedEventsCount={attendedEventsCount}
          />
        </Dropdown>
      </div>
    </>
  );
}
