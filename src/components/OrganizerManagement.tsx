'use client';
import { useLanguage } from '@/components/LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import { AdminService } from '@/services/adminService';
import { SupabaseAdminRepository } from '@/repositories/supabaseAdminRepo';
import type { UserProfile } from '@/services/authService';
import { button } from '@/components/portalStyles';

export default function OrganizerManagement() {
  const { t } = useLanguage();
  const service = useMemo(() => new AdminService(new SupabaseAdminRepository()), []);
  const [organizers, setOrganizers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    service.listOrganizers().then(data => { if (active) setOrganizers(data); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Could not load organizers.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [service, reload]);
  async function remove(profile: UserProfile) {
    if (!window.confirm(t("Remove organizer access for {value0}? Their account will become a Volunteer account.", { value0: profile.email }))) return;
    setBusy(profile.id); setError(''); setNotice('');
    try {
      await service.removeOrganizer(profile.id);
      setOrganizers(current => current.filter(item => item.id !== profile.id));
      setNotice(`${profile.email} is now a Volunteer.`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not remove organizer.'); }
    finally { setBusy(null); }
  }
  return <section aria-labelledby="organizers-heading" className="mb-8 rounded-xl border border-neutral-200 p-5">
    <h2 id="organizers-heading" className="text-lg font-semibold">{t("Manage organizers")}</h2>
    <p className="mt-2 text-sm text-neutral-600">{t("Remove organizer access to change an account to Volunteer.")}</p>
    {error && <div role="alert" className="mt-3 text-red-800">{t(error)} <button className={button} disabled={loading || !!busy} onClick={() => { setError(''); setLoading(true); setReload(value => value + 1); }}>{t("Retry")}</button></div>}
    {notice && <p role="status" className="mt-3">{t(notice)}</p>}
    {loading ? <p role="status" className="mt-4">{t("Loading organizers…")}</p> : <>
      {!error && !organizers.length && <p className="mt-4 text-sm">{t("No organizers found.")}</p>}
      <ul className="mt-4 divide-y divide-neutral-200">{organizers.map(profile => <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span className="break-all text-sm">{profile.email}</span>
        <button className={button} disabled={!!busy} onClick={() => remove(profile)} aria-label={t("Remove organizer {value0}", { value0: profile.email })}>{busy === profile.id ? t("Removing…") : t("Remove organizer")}</button>
      </li>)}</ul>
    </>}
  </section>;
}
