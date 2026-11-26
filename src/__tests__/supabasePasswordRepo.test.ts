import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import { SupabasePasswordRepository } from '@/repositories/supabasePasswordRepo';

function clientWith(
  signInError: { message: string } | null,
  updateError: { message: string } | null = null
) {
  const signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: signInError });
  const updateUser = vi.fn().mockResolvedValue({ data: {}, error: updateError });
  const client = { auth: { signInWithPassword, updateUser } } as unknown as SupabaseClient;
  return { client, signInWithPassword, updateUser };
}

describe('SupabasePasswordRepository', () => {
  it('checks the current password and saves the new one', async () => {
    const { client, signInWithPassword, updateUser } = clientWith(null);
    const repo = new SupabasePasswordRepository(client);

    await repo.changePassword('anna@example.com', 'old-secret', 'new-secret');

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'anna@example.com', password: 'old-secret' });
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-secret', current_password: 'old-secret' });
  });

  it('does not change the password when the current password is wrong', async () => {
    const { client, updateUser } = clientWith({ message: 'Invalid login credentials' });
    const repo = new SupabasePasswordRepository(client);

    await expect(repo.changePassword('anna@example.com', 'wrong', 'new-secret')).rejects.toThrow(
      'Current password is incorrect.'
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('passes on errors from Supabase when saving fails', async () => {
    const { client } = clientWith(null, { message: 'New password should be different from the old password.' });
    const repo = new SupabasePasswordRepository(client);

    await expect(repo.changePassword('anna@example.com', 'old-secret', 'old-secret2')).rejects.toThrow(
      'New password should be different from the old password.'
    );
  });
});
