'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { FormEvent, useMemo, useState } from 'react';
import { SupabasePasswordRepository } from '@/repositories/supabasePasswordRepo';
import { useSignedInProfile } from '@/components/ProfileShell';
import { input, portalPrimary as primary } from '@/components/portalStyles';

export default function ChangePasswordForm() {
  const { t } = useLanguage();
  const profile = useSignedInProfile();
  const passwordRepo = useMemo(() => new SupabasePasswordRepository(), []);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must be different from the current password.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await passwordRepo.changePassword(profile.email, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Your password has been changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium">
          {t('Current password')}
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={`mt-1 ${input}`}
        />
      </div>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium">
          {t('New password')}
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
          {t('Repeat new password')}
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
      {message && (
        <p role="status" className="text-sm text-green-700">
          {t(message)}
        </p>
      )}

      <button type="submit" disabled={saving} className={primary}>
        {saving ? t('Saving password...') : t('Save password')}
      </button>
    </form>
  );
}
