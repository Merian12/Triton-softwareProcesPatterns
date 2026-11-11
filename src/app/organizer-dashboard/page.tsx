'use client';

import { useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Logo } from '@/components/Logo';

export default function OrganizerDashboardPage() {
  const [logoSpin, setLogoSpin] = useState(0);

  return (
    <RoleGuard allowedRole="organizer">
      {(profile, handleLogout) => (
        <div className="min-h-screen bg-gray-50 font-sans">
          <header className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-6 sm:px-9">
            <button
              type="button"
              onClick={() => setLogoSpin((c) => c + 1)}
              className="flex cursor-pointer items-center gap-3 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF0000]"
            >
              <Logo
                variant="symbol"
                hoverAnimation="none"
                spinTrigger={logoSpin}
                className="h-9 w-9 shrink-0"
              />
              <span className="text-lg font-semibold">
                <span className="text-[#262E40]">Volunteer</span>
                <span className="text-[#D7142A]">Portal</span>
              </span>
            </button>
          </header>
          <main className="px-8 pb-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Organizer Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Signed in as: {profile.email} ({profile.role})
              </p>
              <button
                onClick={handleLogout}
                className="mt-6 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </main>
        </div>
      )}
    </RoleGuard>
  );
}