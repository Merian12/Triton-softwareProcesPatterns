'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';
import { dashboardFor } from '@/services/authService';
import { useLanguage } from '@/components/LanguageProvider';
import { button } from '@/components/portalStyles';

export default function RootPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    new SupabaseAuthRepository().getCurrentUser().then(profile => {
      if (active) router.replace(profile ? dashboardFor(profile.role) : '/login');
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [router, attempt]);

  return <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
    {failed ? <>
      <p role="alert" className="text-sm text-red-800">{language === 'da' ? 'Kunne ikke åbne forsiden. Prøv igen.' : 'Could not open your home page. Please try again.'}</p>
      <button className={button} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>{t('Retry')}</button>
    </> : <p role="status" className="text-sm text-muted">{t('Checking permissions...')}</p>}
  </main>;
}
