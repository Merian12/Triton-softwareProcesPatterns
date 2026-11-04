'use client';

import { useEffect, useState, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, UserProfile, UserRole } from '@/services/authService';
import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: (profile: UserProfile, handleLogout: () => Promise<void>) => ReactNode;
}

export const RoleGuard = ({ allowedRole, children }: RoleGuardProps) => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  const authService = useMemo(() => {
    return new AuthService(new SupabaseAuthRepository());
  }, []);

  useEffect(() => {
    let isMounted = true;

    authService.authorize(allowedRole).then((result) => {
      if (!isMounted) return;

      if (!result.authorized && result.redirectUrl) {
        router.replace(result.redirectUrl);
      } else {
        setProfile(result.profile);
        setChecking(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [allowedRole, authService, router]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  if (checking || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-8 font-sans">
        <p className="text-sm text-gray-500">Checking permissions...</p>
      </main>
    );
  }

  return <>{children(profile, handleLogout)}</>;
};

export default RoleGuard;