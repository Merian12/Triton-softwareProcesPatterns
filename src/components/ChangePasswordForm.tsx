'use client';

import { FormEvent, useState } from 'react';
import { input, portalPrimary as primary } from '@/components/portalStyles';

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('De to adgangskoder er ikke ens.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage('Prototype: adgangskoden er ikke blevet ændret.');
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium">
          Ny adgangskode
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className={`mt-1 ${input}`}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium">
          Gentag ny adgangskode
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={`mt-1 ${input}`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <p className="text-xs text-neutral-600">Prototype: adgangskoden bliver ikke ændret eller gemt.</p>

      <button type="submit" className={primary}>
        Gem adgangskode
      </button>
    </form>
  );
}
