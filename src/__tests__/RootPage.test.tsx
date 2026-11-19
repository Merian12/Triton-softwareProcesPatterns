import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RootPage from '@/app/page';
import InformationPage from '@/components/InformationPage';

const { replace, getCurrentUser, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, getCurrentUser: vi.fn(), router: { replace } };
});
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/repositories/supabaseAuthRepo', () => ({ SupabaseAuthRepository: class { getCurrentUser = getCurrentUser; } }));
beforeEach(() => { vi.resetAllMocks(); });

describe('Home navigation', () => {
  it.each(['volunteer', 'organizer', 'admin'])('returns a signed-in %s to their dashboard', async role => {
    getCurrentUser.mockResolvedValue({ id: 'user', role });
    render(<RootPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`/${role}-dashboard`));
    expect(replace).not.toHaveBeenCalledWith('/login');
  });
  it('checks the session before sending an anonymous visitor to login', async () => {
    let resolve!: (profile: null) => void;
    getCurrentUser.mockReturnValue(new Promise(done => { resolve = done; }));
    render(<RootPage />);
    expect(replace).not.toHaveBeenCalled();
    resolve(null);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });
  it('offers a retry after a session error instead of sending the user to login', async () => {
    getCurrentUser.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValue({ role: 'organizer' });
    render(<RootPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not open your home page');
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/organizer-dashboard'));
  });
  it('uses the session-aware home destination for both information page links', () => {
    render(<InformationPage topic="faq" />);
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Go to login' })).not.toBeInTheDocument();
  });
});
