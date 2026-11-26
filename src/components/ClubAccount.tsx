'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { FormEvent, useState } from 'react';
import { input, portalButton as button, portalPrimary as primary } from '@/components/portalStyles';

interface ClubAccountProps {
  club: string;
  creditsPerEvent: number;
  attendedEventsCount: number;
}

export default function ClubAccount({ club, creditsPerEvent, attendedEventsCount }: ClubAccountProps) {
  const { t } = useLanguage();
  const [accountNumber, setAccountNumber] = useState('');
  const [linkedAccount, setLinkedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const earnedCredits = creditsPerEvent * attendedEventsCount;

  function linkAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAccountNumber = accountNumber.trim();

    if (!cleanAccountNumber) {
      setError("Enter a club account number.");
      return;
    }

    setLinkedAccount(cleanAccountNumber);
    setAccountNumber('');
    setError(null);
  }

  return (
    <div>
      <p className="text-sm text-neutral-600">
        {t('You earn {credits} credits for each event you attend. You can use them at {club}.', { credits: creditsPerEvent, club })}
      </p>

      {linkedAccount ? (
        <>
          <dl className="mt-5 grid max-w-xl grid-cols-[90px_1fr] gap-4 text-sm">
            <dt>{t("Club account")}</dt>
            <dd className="break-all">{linkedAccount}</dd>
            <dt>{t("Balance")}</dt>
            <dd className="font-semibold">{t('{credits} credits', { credits: earnedCredits })}</dd>
          </dl>
          <button type="button" onClick={() => setLinkedAccount(null)} className={`mt-4 ${button}`}>
            {t("Remove club account")}
          </button>
        </>
      ) : (
        <form onSubmit={linkAccount} noValidate className="mt-4">
          <label htmlFor="club-account" className="block text-sm font-medium">
            {t("Club account number")}
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
              {t(error)}
            </p>
          )}
          <button type="submit" className={`mt-3 ${primary}`}>
            {t("Link club account")}
          </button>
        </form>
      )}

      <p className="mt-3 text-xs text-neutral-600">
        {t("Prototype: use sample account details. The account and balance are for demonstration and won’t be saved.")}
      </p>
    </div>
  );
}
