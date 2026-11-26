import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import { SupabaseProfileEventRepository } from '@/repositories/supabaseProfileEventRepo';

type Result = { data: unknown; error: { message: string } | null };

interface Query {
  select: () => Query;
  eq: () => Query;
  in: () => Query;
  delete: () => Query;
  then: (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
}

// En falsk Supabase-forespørgsel, der giver det samme svar uanset filtre.
function query(result: Result): Query {
  const chain: Query = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    delete: () => chain,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

function clientWith(results: Record<string, Result>) {
  return { from: vi.fn((table: string) => query(results[table])) } as unknown as SupabaseClient;
}

describe('SupabaseProfileEventRepository', () => {
  it('splits registrations into upcoming and past events', async () => {
    const client = clientWith({
      registrations: {
        data: [
          { id: 'r1', shift_id: 's1', status: 'registered' },
          { id: 'r2', shift_id: 's2', status: 'registered' },
        ],
        error: null,
      },
      shifts: {
        data: [
          { id: 's1', event_id: 'e1', title: 'Water station', location: 'Østerbro', starts_at: '2026-12-06T08:00:00Z', ends_at: '2026-12-06T12:00:00Z' },
          { id: 's2', event_id: 'e2', title: null, location: null, starts_at: '2026-10-18T08:00:00Z', ends_at: '2026-10-18T12:00:00Z' },
        ],
        error: null,
      },
      events: {
        data: [
          { id: 'e1', title: 'Julestævne', location: 'Ballerup' },
          { id: 'e2', name: 'Efterårsstævne', location: 'Herlev' },
        ],
        error: null,
      },
    });

    const repo = new SupabaseProfileEventRepository(client);
    const result = await repo.getRegisteredEvents('v1', new Date('2026-11-19T12:00:00Z'));

    expect(result.upcoming).toEqual([
      { id: 'r1', name: 'Julestævne', shift: 'Water station', date: '2026-12-06', location: 'Østerbro' },
    ]);
    expect(result.past).toEqual([
      { id: 'r2', name: 'Efterårsstævne', shift: 'Volunteer shift', date: '2026-10-18', location: 'Herlev' },
    ]);
  });

  it('returns empty lists when the volunteer has no registrations', async () => {
    const client = clientWith({ registrations: { data: [], error: null } });
    const repo = new SupabaseProfileEventRepository(client);

    await expect(repo.getRegisteredEvents('v1')).resolves.toEqual({ upcoming: [], past: [] });
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('throws the database error message', async () => {
    const client = clientWith({ registrations: { data: null, error: { message: 'permission denied' } } });
    const repo = new SupabaseProfileEventRepository(client);

    await expect(repo.getRegisteredEvents('v1')).rejects.toThrow('permission denied');
  });

  it('cancels a registration that the database deletes', async () => {
    const client = clientWith({ registrations: { data: [{ id: 'r1' }], error: null } });
    const repo = new SupabaseProfileEventRepository(client);

    await expect(repo.cancelRegistration('v1', 'r1')).resolves.toBeUndefined();
  });

  it('fails when the database deletes nothing', async () => {
    const client = clientWith({ registrations: { data: [], error: null } });
    const repo = new SupabaseProfileEventRepository(client);

    await expect(repo.cancelRegistration('v1', 'r1')).rejects.toThrow('Could not cancel your registration');
  });
});
