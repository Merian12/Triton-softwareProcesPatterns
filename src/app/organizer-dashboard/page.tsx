'use client';
import RoleGuard from '@/components/RoleGuard';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';
export default function OrganizerDashboardPage() {
  return <RoleGuard allowedRole="organizer">{(profile, handleLogout) => <OrganizerDashboard profile={profile} onLogout={handleLogout} />}</RoleGuard>;
}
