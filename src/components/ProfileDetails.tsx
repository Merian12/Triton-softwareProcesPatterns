'use client';

import { ReactNode, useState } from 'react';
import { Volunteer } from '@/services/profileService';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ClubAccount from '@/components/ClubAccount';

interface ProfileDetailsProps {
  user: Volunteer;
  clubs: string[];
  creditsPerEvent: number;
  attendedEventsCount: number;
  children: ReactNode;
}

function Dropdown({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-lg bg-white p-4 shadow">
      <summary className="cursor-pointer font-semibold text-gray-800">{title}</summary>
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
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-white p-4 shadow">
        <dt className="text-sm text-gray-500">Mail</dt>
        <dd className="text-sm font-medium text-gray-800">{user.email}</dd>
        <dt className="text-sm text-gray-500">Telefon</dt>
        <dd className="text-sm font-medium text-gray-800">{user.phone}</dd>
        <dt className="text-sm text-gray-500">Klub</dt>
        <dd className="text-sm font-medium text-gray-800">{club}</dd>
      </dl>

      {children}

      <div className="mt-6 space-y-2">
        <Dropdown title="Skift klub">
          <label htmlFor="club" className="block text-sm font-medium text-gray-800">
            Vælg klub
          </label>
          <select
            id="club"
            value={selectedClub}
            onChange={(event) => setSelectedClub(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-800"
          >
            {clubs.map((clubName) => (
              <option key={clubName} value={clubName}>
                {clubName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Prototype: valget bliver ikke gemt.</p>
          <button
            onClick={() => setClub(selectedClub)}
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
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
