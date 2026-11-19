'use client';

import { FormEvent, useState } from 'react';

interface ClubAccountProps {
  club: string;
  creditsPerEvent: number;
  attendedEventsCount: number;
}

export default function ClubAccount({ club, creditsPerEvent, attendedEventsCount }: ClubAccountProps) {
  const [accountNumber, setAccountNumber] = useState('');
  const [linkedAccount, setLinkedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const earnedCredits = creditsPerEvent * attendedEventsCount;

  function linkAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAccountNumber = accountNumber.trim();

    if (!cleanAccountNumber) {
      setError('Skriv et klubkontonummer.');
      return;
    }

    setLinkedAccount(cleanAccountNumber);
    setAccountNumber('');
    setError(null);
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        Du får {creditsPerEvent} credits for hvert event, du deltager i. Dem kan du bruge i {club}.
      </p>

      {linkedAccount ? (
        <>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-sm text-gray-500">Klubkonto</dt>
            <dd className="text-sm font-medium text-gray-800">{linkedAccount}</dd>
            <dt className="text-sm text-gray-500">Saldo</dt>
            <dd className="text-sm font-medium text-gray-800">{earnedCredits} credits</dd>
          </dl>
          <button
            onClick={() => setLinkedAccount(null)}
            className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
          >
            Fjern klubkonto
          </button>
        </>
      ) : (
        <form onSubmit={linkAccount} noValidate className="mt-4">
          <label htmlFor="club-account" className="block text-sm font-medium text-gray-800">
            Klubkontonummer
          </label>
          <input
            id="club-account"
            type="text"
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-800"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Tilknyt klubkonto
          </button>
        </form>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Prototype: skriv ikke rigtige kontooplysninger. Kontoen og saldoen er dummy og bliver ikke gemt.
      </p>
    </div>
  );
}
