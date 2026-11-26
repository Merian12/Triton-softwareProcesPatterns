'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { FormEvent, useState } from 'react';
import { input, portalPrimary as primary } from '@/components/portalStyles';

export default function ChangePasswordForm() {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage("Prototype: your password was not changed.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium">
          {t("New password")}
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
          {t("Repeat new password")}
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
          {t(error)}
        </p>
      )}
      {message && <p className="text-sm text-neutral-600">{t(message)}</p>}

      <p className="text-xs text-neutral-600">{t("Prototype: your password won’t be changed or saved.")}</p>

      <button type="submit" className={primary}>
        {t("Save password")}
      </button>
    </form>
  );
}
