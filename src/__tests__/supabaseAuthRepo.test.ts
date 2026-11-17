import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {},
}));

import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';

describe('SupabaseAuthRepository', () => {
  let mockSignUp: ReturnType<typeof vi.fn>;
  let mockSignInWithPassword: ReturnType<typeof vi.fn>;
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockUpsert: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabaseClient: SupabaseClient;
  let repo: SupabaseAuthRepository;

  beforeEach(() => {
    mockSignUp = vi.fn();
    mockSignInWithPassword = vi.fn();
    mockGetSession = vi.fn();
    mockSignOut = vi.fn();
    mockSingle = vi.fn();
    mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom = vi.fn().mockReturnValue({ select: mockSelect, upsert: mockUpsert });

    mockSupabaseClient = {
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
      from: mockFrom,
    } as unknown as SupabaseClient;

    repo = new SupabaseAuthRepository(mockSupabaseClient);
  });

  describe('signUp()', () => {
    it('signs up the user with username metadata and upserts the profile', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-789',
          email: 'new@example.com',
          role: 'volunteer',
          username: 'new_user',
        },
        error: null,
      });

      const profile = await repo.signUp('new@example.com', 'password123', 'volunteer', 'new_user');

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { username: 'new_user' },
        },
      });
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpsert).toHaveBeenCalledWith(
        { id: 'user-789', email: 'new@example.com', role: 'volunteer', username: 'new_user' },
        { onConflict: 'id' }
      );
      expect(mockSelect).toHaveBeenCalledWith('id, email, role, username');
      expect(profile).toEqual({
        id: 'user-789',
        email: 'new@example.com',
        role: 'volunteer',
        username: 'new_user',
      });
    });

    it('throws error when auth.signUp fails', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(
        repo.signUp('new@example.com', 'password123', 'volunteer', 'new_user')
      ).rejects.toThrow('User already registered');
    });

    it('throws error when profile upsert fails', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert violation' },
      });

      await expect(
        repo.signUp('new@example.com', 'password123', 'volunteer', 'new_user')
      ).rejects.toThrow('Insert violation');
    });
  });

  describe('signIn()', () => {
    it('authenticates and returns the user profile on success', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com', role: 'volunteer', username: 'tester' },
        error: null,
      });

      const profile = await repo.signIn('test@example.com', 'password123');

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id, email, role, username');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(profile).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'volunteer',
        username: 'tester',
      });
    });

    it('throws the Supabase auth error message when signInWithPassword fails', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });

      await expect(repo.signIn('test@example.com', 'password123')).rejects.toThrow(
        'Email not confirmed'
      );
    });

    it('throws default error message when user is null and no error message is returned', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(repo.signIn('test@example.com', 'password123')).rejects.toThrow(
        'Invalid login credentials.'
      );
    });

    it('throws error when fetching the profile fails or returns no data', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });

      await expect(repo.signIn('test@example.com', 'password123')).rejects.toThrow(
        'Could not load user role profile.'
      );
    });
  });

  describe('getCurrentUser()', () => {
    it('returns the user profile when an active session and profile exist', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'org-456' } } },
      });
      mockSingle.mockResolvedValue({
        data: { id: 'org-456', email: 'org@example.com', role: 'organizer', username: 'org_lead' },
        error: null,
      });

      const profile = await repo.getCurrentUser();

      expect(mockGetSession).toHaveBeenCalledTimes(1);
      expect(mockSelect).toHaveBeenCalledWith('id, email, role, username');
      expect(mockEq).toHaveBeenCalledWith('id', 'org-456');
      expect(profile).toEqual({
        id: 'org-456',
        email: 'org@example.com',
        role: 'organizer',
        username: 'org_lead',
      });
    });

    it('returns null when there is no active session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const profile = await repo.getCurrentUser();

      expect(profile).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns null when the profile lookup fails', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const profile = await repo.getCurrentUser();

      expect(profile).toBeNull();
    });
  });

  describe('signOut()', () => {
    it('calls supabase.auth.signOut()', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await repo.signOut();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
