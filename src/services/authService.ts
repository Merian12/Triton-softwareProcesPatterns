export type UserRole = 'volunteer' | 'organizer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<UserProfile>;
}

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  async login(email: string, password: string): Promise<{ profile: UserProfile; redirectUrl: string }> {
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const profile = await this.authRepo.signIn(cleanEmail, password);

    const redirectUrl = profile.role === 'organizer'
      ? '/organizer-dashboard'
      : '/volunteer-board';

    return { profile, redirectUrl };
  }
}