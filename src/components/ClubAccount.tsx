'use client';

import { FormEvent, useState } from 'react';
import { input, portalButton as button, portalPrimary as primary } from '@/components/portalStyles';

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
      <p className="text-sm text-neutral-600">
        Du får {creditsPerEvent} credits for hvert event, du deltager i. Dem kan du bruge i {club}.
      </p>

      {linkedAccount ? (
        <>
          <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
            <dt>Klubkonto</dt>
            <dd className="break-all">{linkedAccount}</dd>
            <dt>Saldo</dt>
            <dd className="font-semibold">{earnedCredits} credits</dd>
          </dl>
          <button type="button" onClick={() => setLinkedAccount(null)} className={`mt-4 ${button}`}>
            Fjern klubkonto
          </button>
        </>
      ) : (
        <form onSubmit={linkAccount} noValidate className="mt-4">
          <label htmlFor="club-account" className="block text-sm font-medium">
            Klubkontonummer
          </label>
          <input
            id="club-account"
            type="text"
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            className={`mt-1 ${input}`}
          />
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="submit" className={`mt-3 ${primary}`}>
            Tilknyt klubkonto
          </button>
        </form>
      )}

      <p className="mt-3 text-xs text-neutral-600">
        Prototype: skriv ikke rigtige kontooplysninger. Kontoen og saldoen er dummy og bliver ikke gemt.
      </p>
    </div>
  );
}
