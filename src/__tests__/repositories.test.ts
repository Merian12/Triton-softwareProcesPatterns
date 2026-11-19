import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DummyProfileRepository } from '@/repositories/dummyProfileRepo';
import { SupabaseAdminRepository } from '@/repositories/supabaseAdminRepo';
import { SupabaseMessageRepository } from '@/repositories/supabaseMessageRepo';
import { SupabaseRegistrationRepository } from '@/repositories/supabaseRegistrationRepo';

const mockRpc = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('SupabaseMessageRepository', () => {
  const repo = new SupabaseMessageRepository();

  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('lists messages from RPC and defaults null data to empty array', async () => {
    const messages = [
      {
        id: 'm1',
        sender_id: 'u1',
        sender_email: 'a@example.com',
        recipient_id: 'u2',
        recipient_email: 'b@example.com',
        body: 'Hello',
        created_at: '2026-05-01T10:00:00Z',
      },
    ];
    mockRpc.mockResolvedValueOnce({ data: messages, error: null });
    await expect(repo.list()).resolves.toEqual(messages);
    expect(mockRpc).toHaveBeenCalledWith('list_my_messages');

    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(repo.list()).resolves.toEqual([]);
  });

  it('throws a friendly error when listing messages fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'db down' } });
    await expect(repo.list()).rejects.toThrow('Could not load messages. Please try again.');
  });

  it('sends a message via RPC', async () => {
    mockRpc.mockResolvedValueOnce({ error: null });
    await expect(repo.send('user@example.com', 'Hi there')).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith('send_message', {
      recipient_email: 'user@example.com',
      message_body: 'Hi there',
    });
  });

  it('maps RPC send errors to user-friendly messages', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'Recipient not found' } });
    await expect(repo.send('missing@example.com', 'Hi')).rejects.toThrow(
      'No registered user has that email address.'
    );

    mockRpc.mockResolvedValueOnce({ error: { message: 'Cannot message yourself' } });
    await expect(repo.send('me@example.com', 'Hi')).rejects.toThrow(
      'Choose another user to message.'
    );

    mockRpc.mockResolvedValueOnce({ error: { message: 'Unexpected failure' } });
    await expect(repo.send('other@example.com', 'Hi')).rejects.toThrow(
      'Could not send your message. Please try again.'
    );
  });
});

describe('SupabaseAdminRepository', () => {
  it('lists organizers and defaults null data to empty array', async () => {
    const clientRpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 'o1', email: 'org@example.com', role: 'organizer' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    const repo = new SupabaseAdminRepository({ rpc: clientRpc } as unknown as SupabaseClient);

    await expect(repo.listOrganizers()).resolves.toEqual([
      { id: 'o1', email: 'org@example.com', role: 'organizer' },
    ]);
    expect(clientRpc).toHaveBeenCalledWith('admin_list_organizers');

    await expect(repo.listOrganizers()).resolves.toEqual([]);
  });

  it('throws RPC error when listing or removing organizers fails', async () => {
    const clientRpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Forbidden' } })
      .mockResolvedValueOnce({ error: { message: 'Cannot remove organizer' } });
    const repo = new SupabaseAdminRepository({ rpc: clientRpc } as unknown as SupabaseClient);

    await expect(repo.listOrganizers()).rejects.toThrow('Forbidden');
    await expect(repo.removeOrganizer('o1')).rejects.toThrow('Cannot remove organizer');
    expect(clientRpc).toHaveBeenLastCalledWith('admin_remove_organizer', { organizer_id: 'o1' });
  });

  it('removes an organizer via RPC', async () => {
    const clientRpc = vi.fn().mockResolvedValueOnce({ error: null });
    const repo = new SupabaseAdminRepository({ rpc: clientRpc } as unknown as SupabaseClient);

    await expect(repo.removeOrganizer('o2')).resolves.toBeUndefined();
    expect(clientRpc).toHaveBeenCalledWith('admin_remove_organizer', { organizer_id: 'o2' });
  });
});

describe('DummyProfileRepository', () => {
  const repo = new DummyProfileRepository();

  it('returns volunteer profile, clubs, credits, and event lists', async () => {
    const volunteer = await repo.getCurrentVolunteer();
    expect(volunteer).toMatchObject({
      role: 'volunteer',
      club: 'Triton Swim Ballerup',
    });

    const clubs = await repo.getClubs();
    expect(clubs).toContain(volunteer.club);

    expect(await repo.getCreditsPerEvent()).toBeGreaterThan(0);
    expect((await repo.getMyEvents()).length).toBeGreaterThan(0);
    expect((await repo.getUpcomingEvents()).length).toBeGreaterThan(0);
  });
});

describe('SupabaseRegistrationRepository', () => {
  it('registers a shift with guests and maps RPC errors', async () => {
    const clientRpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 'reg-42', error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Not enough places available for everyone.' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'unknown db error' } });
    const repo = new SupabaseRegistrationRepository({ rpc: clientRpc } as unknown as SupabaseClient);

    await expect(repo.registerShiftWithGuests('s1', ['Emil'])).resolves.toBe('reg-42');
    expect(clientRpc).toHaveBeenNthCalledWith(1, 'register_shift_with_guests', {
      p_shift_id: 's1',
      p_guest_names: ['Emil'],
    });

    await expect(repo.registerShiftWithGuests('s1', ['Emil'])).rejects.toThrow(
      'Not enough places available for everyone.'
    );
    await expect(repo.registerShiftWithGuests('s1', ['Emil'])).rejects.toThrow(
      'Could not complete your registration. Please try again.'
    );
  });

  it('adds guests to an existing registration and maps RPC errors', async () => {
    const clientRpc = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'You can bring at most 5 guests per shift.' } })
      .mockResolvedValueOnce({ error: { message: 'unexpected' } });
    const repo = new SupabaseRegistrationRepository({ rpc: clientRpc } as unknown as SupabaseClient);

    await expect(repo.addGuestsToRegistration('reg-42', ['Sofia'])).resolves.toBeUndefined();
    expect(clientRpc).toHaveBeenNthCalledWith(1, 'add_registration_guests', {
      p_registration_id: 'reg-42',
      p_guest_names: ['Sofia'],
    });

    await expect(repo.addGuestsToRegistration('reg-42', ['Sofia'])).rejects.toThrow(
      'You can bring at most 5 guests per shift.'
    );
    await expect(repo.addGuestsToRegistration('reg-42', ['Sofia'])).rejects.toThrow(
      'Could not add guests. Please try again.'
    );
  });

  it('lists guests for registration IDs and throws on query error', async () => {
    const order = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 'g1', registration_id: 'reg-42', full_name: 'Emil' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: 'RLS denied' } });
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({ order })),
      })),
    }));
    const repo = new SupabaseRegistrationRepository({ from } as unknown as SupabaseClient);

    await expect(repo.listGuestsForRegistrations([])).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();

    await expect(repo.listGuestsForRegistrations(['reg-42'])).resolves.toEqual([
      { id: 'g1', registration_id: 'reg-42', full_name: 'Emil' },
    ]);
    await expect(repo.listGuestsForRegistrations(['reg-42'])).rejects.toThrow('RLS denied');
  });
});
