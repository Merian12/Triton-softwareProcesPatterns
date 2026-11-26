import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService, displayNameFor, IAuthRepository, UserProfile } from '@/services/authService';

describe('AuthService', () => {
  let mockAuthRepo: IAuthRepository;
  let authService: AuthService;

  beforeEach(() => {
    mockAuthRepo = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      getCurrentUser: vi.fn(),
      signOut: vi.fn(),
    };
    authService = new AuthService(mockAuthRepo);
  });

  describe('register()', () => {
    it('throws an error when username is empty or whitespace', async () => {
      await expect(
        authService.register('user@example.com', 'password123', 'password123', 'volunteer', '')
      ).rejects.toThrow('Please enter a username.');
      await expect(
        authService.register('user@example.com', 'password123', 'password123', 'volunteer', '   ')
      ).rejects.toThrow('Please enter a username.');
      expect(mockAuthRepo.signUp).not.toHaveBeenCalled();
    });

    it('throws validation errors for invalid email, short password, and mismatched passwords', async () => {
      await expect(
        authService.register('invalid-email', 'password123', 'password123', 'volunteer', 'alice')
      ).rejects.toThrow('Please enter a valid email address.');
      await expect(
        authService.register('user@example.com', '12345', '12345', 'volunteer', 'alice')
      ).rejects.toThrow('Password must be at least 6 characters.');
      await expect(
        authService.register('user@example.com', 'password123', 'different123', 'volunteer', 'alice')
      ).rejects.toThrow('Passwords do not match.');
      expect(mockAuthRepo.signUp).not.toHaveBeenCalled();
    });

    it('throws an error when age 15+ declaration is not confirmed', async () => {
      await expect(
        authService.register('user@example.com', 'password123', 'password123', 'volunteer', 'alice', false)
      ).rejects.toThrow('You must confirm that you are 15 years or older.');
      await expect(
        authService.register('user@example.com', 'password123', 'password123', 'volunteer', 'alice')
      ).rejects.toThrow('You must confirm that you are 15 years or older.');
      expect(mockAuthRepo.signUp).not.toHaveBeenCalled();
    });

    it('trims username and email, calls signUp, and returns profile with redirectUrl', async () => {
      const profile: UserProfile = {
        id: 'vol-1',
        email: 'vol@example.com',
        role: 'volunteer',
        username: 'alice_v',
      };
      vi.mocked(mockAuthRepo.signUp).mockResolvedValue(profile);

      const result = await authService.register(
        '  vol@example.com  ',
        'password123',
        'password123',
        'volunteer',
        '  alice_v  ',
        true
      );

      expect(mockAuthRepo.signUp).toHaveBeenCalledWith(
        'vol@example.com',
        'password123',
        'volunteer',
        'alice_v'
      );
      expect(result).toEqual({
        profile,
        redirectUrl: '/volunteer-dashboard',
      });
    });
  });

  describe('login()', () => {
    it('throws an error when email is empty or whitespace', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow(
        'Please enter a valid email address.'
      );
      await expect(authService.login('   ', 'password123')).rejects.toThrow(
        'Please enter a valid email address.'
      );
      expect(mockAuthRepo.signIn).not.toHaveBeenCalled();
    });

    it('throws an error when email does not contain "@"', async () => {
      await expect(authService.login('invalidemail.com', 'password123')).rejects.toThrow(
        'Please enter a valid email address.'
      );
      expect(mockAuthRepo.signIn).not.toHaveBeenCalled();
    });

    it('throws an error when password is empty or shorter than 6 characters', async () => {
      await expect(authService.login('user@example.com', '')).rejects.toThrow(
        'Password must be at least 6 characters.'
      );
      await expect(authService.login('user@example.com', '12345')).rejects.toThrow(
        'Password must be at least 6 characters.'
      );
      expect(mockAuthRepo.signIn).not.toHaveBeenCalled();
    });

    it('trims email and returns organizer redirect URL when user role is organizer', async () => {
      const organizerProfile: UserProfile = {
        id: 'org-1',
        email: 'org@example.com',
        role: 'organizer',
      };
      vi.mocked(mockAuthRepo.signIn).mockResolvedValue(organizerProfile);

      const result = await authService.login('  org@example.com  ', 'password123');

      expect(mockAuthRepo.signIn).toHaveBeenCalledWith('org@example.com', 'password123');
      expect(result).toEqual({
        profile: organizerProfile,
        redirectUrl: '/organizer-dashboard',
      });
    });

    it('returns volunteer redirect URL when user role is volunteer', async () => {
      const volunteerProfile: UserProfile = {
        id: 'vol-1',
        email: 'vol@example.com',
        role: 'volunteer',
      };
      vi.mocked(mockAuthRepo.signIn).mockResolvedValue(volunteerProfile);

      const result = await authService.login('vol@example.com', 'password123');

      expect(mockAuthRepo.signIn).toHaveBeenCalledWith('vol@example.com', 'password123');
      expect(result).toEqual({
        profile: volunteerProfile,
        redirectUrl: '/volunteer-dashboard',
      });
    });

    it('propagates errors from the auth repository', async () => {
      vi.mocked(mockAuthRepo.signIn).mockRejectedValue(
        new Error('Invalid login credentials.')
      );

      await expect(
        authService.login('user@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid login credentials.');
    });
  });

  describe('authorize()', () => {
    it('returns unauthorized and redirects to /login when no user is logged in', async () => {
      vi.mocked(mockAuthRepo.getCurrentUser).mockResolvedValue(null);

      const result = await authService.authorize('organizer');

      expect(result).toEqual({
        authorized: false,
        profile: null,
        redirectUrl: '/login',
      });
    });

    it('returns authorized when user role matches allowedRole', async () => {
      const profile: UserProfile = {
        id: 'org-1',
        email: 'org@example.com',
        role: 'organizer',
      };
      vi.mocked(mockAuthRepo.getCurrentUser).mockResolvedValue(profile);

      const result = await authService.authorize('organizer');

      expect(result).toEqual({
        authorized: true,
        profile,
        redirectUrl: null,
      });
    });

    it('redirects a volunteer trying to access an organizer route to /volunteer-dashboard', async () => {
      const profile: UserProfile = {
        id: 'vol-1',
        email: 'vol@example.com',
        role: 'volunteer',
      };
      vi.mocked(mockAuthRepo.getCurrentUser).mockResolvedValue(profile);

      const result = await authService.authorize('organizer');

      expect(result).toEqual({
        authorized: false,
        profile,
        redirectUrl: '/volunteer-dashboard',
      });
    });

    it('redirects an organizer trying to access a volunteer route to /organizer-dashboard', async () => {
      const profile: UserProfile = {
        id: 'org-1',
        email: 'org@example.com',
        role: 'organizer',
      };
      vi.mocked(mockAuthRepo.getCurrentUser).mockResolvedValue(profile);

      const result = await authService.authorize('volunteer');

      expect(result).toEqual({
        authorized: false,
        profile,
        redirectUrl: '/organizer-dashboard',
      });
    });
  });

  describe('logout()', () => {
    it('calls signOut on the repository', async () => {
      vi.mocked(mockAuthRepo.signOut).mockResolvedValue(undefined);

      await authService.logout();

      expect(mockAuthRepo.signOut).toHaveBeenCalledTimes(1);
    });
  });
});

describe('displayNameFor()', () => {
  it('prefers the trimmed username when provided', () => {
    expect(displayNameFor('alice.smith@example.com', '  swim_alice  ')).toBe('swim_alice');
  });

  it('falls back to the capitalized email prefix when username is empty or missing', () => {
    expect(displayNameFor('alice.smith@example.com')).toBe('Alice');
    expect(displayNameFor('bob@example.com', '   ')).toBe('Bob');
    expect(displayNameFor('')).toBe('My account');
  });
});
