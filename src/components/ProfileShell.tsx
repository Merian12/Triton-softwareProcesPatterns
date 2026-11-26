'use client';

import { LanguageSwitcher, useLanguage } from '@/components/LanguageProvider';

import { createContext, ReactNode, useContext, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import type { UserProfile } from '@/services/authService';
import { Logo } from '@/components/Logo';
import { navTab, portalNav, portalButton as button } from '@/components/portalStyles';

const navItems = ['Overview', 'Find events', 'My shifts', 'Calendar', 'Messages'] as const;

function navHref(item: (typeof navItems)[number]) {
  return item === 'Calendar'
    ? '/volunteer-calendar'
    : `/volunteer-dashboard?view=${encodeURIComponent(item)}`;
}

// Giver komponenterne på profilsiden adgang til den bruger, der er logget ind.
const SignedInProfileContext = createContext<UserProfile | null>(null);

export function useSignedInProfile() {
  const profile = useContext(SignedInProfileContext);
  if (!profile) throw new Error('useSignedInProfile must be used inside ProfileShell.');
  return profile;
}

// Samme header, navigation og footer som volunteer-dashboardet og kalenderen.
export default function ProfileShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [logoSpin, setLogoSpin] = useState(0);

  return (
    <RoleGuard allowedRole="volunteer">
      {(profile, handleLogout) => {
        async function logout() {
          setLoggingOut(true);
          setError('');

          try {
            await handleLogout();
          } catch {
            setError('Could not log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        }

        return (
          <div className="min-h-screen bg-white text-neutral-900">
            <div className="mx-auto max-w-6xl px-5 sm:px-9">
              <header className="flex flex-wrap items-center gap-4 py-7">
                <Link
                  href="/volunteer-dashboard"
                  onClick={() => setLogoSpin((count) => count + 1)}
                  className="flex cursor-pointer items-center gap-3 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  <Logo
                    variant="symbol"
                    hoverAnimation="none"
                    spinTrigger={logoSpin}
                    className="h-9 w-9 shrink-0"
                  />
                  <span className="text-lg font-semibold">
                    <span className="text-brand-navy">Volunteer</span>
                    <span className="text-brand">Portal</span>
                  </span>
                </Link>

                <span className="text-sm text-neutral-600">{t("Triton Swim Ballerup · demo club")}</span>

                <div className="ml-auto flex gap-3">
                  <LanguageSwitcher />
                  <Link href="/profile" aria-current="page" className={button}>
                    {t("My profile")}
                  </Link>
                  <button type="button" className={button} disabled={loggingOut} onClick={logout}>
                    {t(loggingOut ? 'Logging out…' : 'Log out')}
                  </button>
                </div>
              </header>

              <nav aria-label={t("Main navigation")} className={portalNav}>
                {navItems.map((item) => (
                  <Link key={item} href={navHref(item)} className={navTab(false)}>
                    {t(item)}
                  </Link>
                ))}
              </nav>

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {t(error)}
                </p>
              )}

              <main className="py-9">
                <SignedInProfileContext value={profile}>{children}</SignedInProfileContext>
              </main>

              <footer className="border-t border-neutral-200 py-5 text-xs text-neutral-600">
                Volunteer Portal
              </footer>
            </div>
          </div>
        );
      }}
    </RoleGuard>
  );
}
