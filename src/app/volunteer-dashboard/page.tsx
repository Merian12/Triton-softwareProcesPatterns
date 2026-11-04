'use client';

import RoleGuard from '@/components/RoleGuard';

export default function VolunteerDashboardPage() {
  return (
    <RoleGuard allowedRole="volunteer">
      {(profile, handleLogout) => (
        <main className="min-h-screen bg-gray-50 p-8 font-sans">
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Volunteer Dashboard
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
      )}
    </RoleGuard>
  );
}