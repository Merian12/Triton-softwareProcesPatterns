'use client';
import RoleGuard from '@/components/RoleGuard';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';

export default function AdminDashboardPage() {
  return <RoleGuard allowedRole="admin">{(profile, handleLogout) => <OrganizerDashboard profile={profile} onLogout={handleLogout} />}</RoleGuard>;
}
