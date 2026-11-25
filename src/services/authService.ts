export type UserRole = 'volunteer' | 'organizer' | 'admin';

export function dashboardFor(role: UserRole): string {
  return role === 'admin' ? '/admin-dashboard' : role === 'organizer' ? '/organizer-dashboard' : '/volunteer-dashboard';
}

/**
 * Resolves the display name for a user, preferring their trimmed username
 * and falling back to the capitalized local-part prefix of their email.
 */
export function displayNameFor(email: string, username?: string): string {
  const cleanUsername = username?.trim();
  if (cleanUsername) return cleanUsername;
  const emailName = email.split('@')[0].split(/[._+-]/)[0];
  return emailName ? emailName[0].toLocaleUpperCase('en-GB') + emailName.slice(1) : 'My account';
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
}

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<UserProfile>;
  signUp(email: string, password: string, role: UserRole, username: string): Promise<UserProfile>;
  getCurrentUser(): Promise<UserProfile | null>;
  signOut(): Promise<void>;
}

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  async register(
    email: string,
    password: string,
    confirmPassword: string,
    role: UserRole,
    username: string = '',
  ): Promise<{ profile: UserProfile; redirectUrl: string }> {
    if (role !== 'volunteer' && role !== 'organizer') throw new Error('Admin accounts must be assigned by an administrator.');
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      throw new Error('Please enter a username.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const profile = await this.authRepo.signUp(cleanEmail, password, role, cleanUsername);

    const redirectUrl = dashboardFor(profile.role);

    return { profile, redirectUrl };
  }

  async login(email: string, password: string): Promise<{ profile: UserProfile; redirectUrl: string }> {
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const profile = await this.authRepo.signIn(cleanEmail, password);

    const redirectUrl = dashboardFor(profile.role);

    return { profile, redirectUrl };
  }
  
  async authorize(allowedRole: UserRole): Promise<{
    authorized: boolean;
    profile: UserProfile | null;
    redirectUrl: string | null;
  }> {
    const profile = await this.authRepo.getCurrentUser();

    if (!profile) {
      return { authorized: false, profile: null, redirectUrl: '/login' };
    }

    if (profile.role !== allowedRole) {
      const fallbackUrl = dashboardFor(profile.role);
      return { authorized: false, profile, redirectUrl: fallbackUrl };
    }

    return { authorized: true, profile, redirectUrl: null };
  }

  async logout(): Promise<void> {
    await this.authRepo.signOut();
  }
}