
'use client';
import { useLanguage } from '@/components/LanguageProvider';
import ExpandedCalendar from '@/components/ExpandedCalendar';
import { useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { AccountIdentity } from '@/components/AccountIdentity';
import { Logo } from '@/components/Logo';
import { navTab, portalNav, portalButton as button } from '@/components/portalStyles';

export default function VolunteerCalendarPage() {
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

              {/* Header */}
              <header className="flex flex-wrap items-center gap-4 py-7">
                <Link
                  href="/volunteer-dashboard"
                  onClick={() => setLogoSpin(c => c + 1)}
                  className="flex cursor-pointer items-center gap-3 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF0000]"
                >
                  <Logo
                    variant="symbol"
                    hoverAnimation="none"
                    spinTrigger={logoSpin}
                    className="h-9 w-9 shrink-0"
                  />

                  <span className="text-lg font-semibold">
                    <span className="text-[#262E40]">
                      Volunteer
                    </span>
                    <span className="text-[#D7142A]">
                      Portal
                    </span>
                  </span>
                </Link>

                <span className="text-sm text-neutral-600">
                  Triton Swim Ballerup · demo club
                </span>

                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 border-r border-border-subtle pr-3 text-[#262E40]">
                    <AccountIdentity
                      email={profile.email}
                      username={profile.username}
                      roleLabel="Volunteer"
                    />
                  </div>

                  <Link
                    href="/volunteer-dashboard?view=My%20profile"
                    className={button}
                  >
                    {t('My profile')}
                  </Link>

                  <button
                    type="button"
                    className={button}
                    disabled={loggingOut}
                    onClick={logout}
                  >
                    {loggingOut ? 'Logging out…' : 'Log out'}
                  </button>
                </div>
              </header>

              {/* Navigation */}
              <nav
                aria-label={t('Main navigation')}
                className={portalNav}
              >
                {[
                  'Overview',
                  'Find events',
                  'My shifts',
                  'Calendar',
                  'Messages',
                ].map(item => (
                  <Link
                    key={item}
                    href={item === 'Calendar' ? '/volunteer-calendar' : `/volunteer-dashboard?view=${encodeURIComponent(item)}`}
                    aria-current={item === 'Calendar' ? 'page' : undefined}
                    className={navTab(item === 'Calendar')}
                  >
                    {t(item)}
                  </Link>
                ))}
              </nav>

              {/* Calendar page content */}
           <main className="pt-3 pb-4">
  {error && <p role="alert" className="mb-4 text-sm text-red-800">{t(error)}</p>}
  <h1 className="sr-only">{t("Calendar")}</h1>

  <div className="mt-2">
    <ExpandedCalendar />
  </div>
</main>
            </div>
          </div>
        );
      }}
    </RoleGuard>
  );
}
