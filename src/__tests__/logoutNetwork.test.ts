import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabaseFetch, LOGOUT_REQUEST_TIMEOUT_MS } from '@/lib/supabaseFetch';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function signedInClient() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const storage = new Map<string, string>([['logout-test-session', JSON.stringify({
    access_token: 'test-access-token', refresh_token: 'test-refresh-token',
    expires_at: expiresAt, expires_in: 3600, token_type: 'bearer',
    user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
  })]]);
  const client = createClient('https://logout-test.supabase.co', 'test-public-key', {
    global: { fetch: supabaseFetch },
    auth: {
      autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'logout-test-session',
      storage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => { storage.set(key, value); },
        removeItem: key => { storage.delete(key); },
      },
    },
  });
  expect((await client.auth.getSession()).data.session).not.toBeNull();
  return { client, storage };
}

describe('logout with the real Supabase SDK', () => {
  it('aborts a stalled logout request and clears the saved session', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { client, storage } = await signedInClient();
    vi.useFakeTimers();
    const logout = new SupabaseAuthRepository(client).signOut();
    await vi.advanceTimersByTimeAsync(LOGOUT_REQUEST_TIMEOUT_MS);
    await expect(logout).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/logout?scope=local');
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect(storage.has('logout-test-session')).toBe(false);
  });

  it('clears the saved session when the logout server responds successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const { client, storage } = await signedInClient();
    await new SupabaseAuthRepository(client).signOut();
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect(storage.has('logout-test-session')).toBe(false);
  });

  it('passes database requests through without changing their cancellation signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetchMock);
    const options = { signal: new AbortController().signal };
    await supabaseFetch('https://logout-test.supabase.co/rest/v1/events', options);
    expect(fetchMock).toHaveBeenCalledWith('https://logout-test.supabase.co/rest/v1/events', options);
  });
});
