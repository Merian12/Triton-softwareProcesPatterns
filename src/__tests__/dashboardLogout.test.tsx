import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VolunteerDashboard from '@/components/VolunteerDashboard';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';

vi.mock('next/navigation', () => ({ useSearchParams: () => null }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    from: () => {
      const query = {
        select: () => query, order: () => query, eq: () => query,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return query;
    },
  },
}));

const dashboards = [
  { role: 'organizer' as const, Dashboard: OrganizerDashboard },
  { role: 'volunteer' as const, Dashboard: VolunteerDashboard },
];

describe.each(dashboards)('$role logout button', ({ role, Dashboard }) => {
  it.each([false, true])('stops loading after the logout callback settles (failure: %s)', async fails => {
    let finish!: () => void;
    const logout = new Promise<void>((resolve, reject) => {
      finish = () => fails ? reject(new Error('Unavailable')) : resolve();
    });
    const onLogout = vi.fn(() => logout);
    render(<Dashboard profile={{ id: 'logout-user', email: 'logout@example.com', role }} onLogout={onLogout} />);
    if (role === 'organizer') fireEvent.click(screen.getByText('Organizer').closest('summary')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    expect(screen.getByRole('button', { name: 'Logging out…' })).toBeDisabled();
    await act(async () => finish());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Log out' })).toBeEnabled());
    expect(onLogout).toHaveBeenCalledOnce();
    if (fails) expect(screen.getByRole('alert')).toHaveTextContent('Could not log out. Please try again.');
  });
});
