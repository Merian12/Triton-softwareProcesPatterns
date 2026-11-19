import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VolunteerDashboard from '@/components/VolunteerDashboard';
import PortalTopbar from '@/components/PortalTopbar';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/VolunteerCalendar', () => ({
  default: () => <div data-testid="volunteer-calendar" />,
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: async () => ({ data: [], error: null }),
        eq: async () => ({ data: [], error: null }),
        then: (resolve: (value: { data: never[]; error: null }) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(resolve),
      }),
    }),
  },
}));

describe('Volunteer dashboard username display', () => {
  it('displays the volunteer username in the header and My profile without the organizer red bar', async () => {
    render(
      <VolunteerDashboard
        profile={{
          id: 'v1',
          email: 'volunteer@example.org',
          role: 'volunteer',
          username: 'swim_alex',
        }}
        onLogout={vi.fn()}
      />
    );

    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('bg-brand');
    expect(within(header).getByText('swim_alex')).toBeInTheDocument();
    expect(within(header).getAllByText('Volunteer')).toHaveLength(2);

    fireEvent.click(within(header).getByRole('button', { name: 'My profile' }));
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getAllByText('swim_alex').length).toBeGreaterThanOrEqual(2);

    await waitFor(() => {
      expect(screen.queryByText('Loading events and registrations...')).not.toBeInTheDocument();
    });
  });

  it('falls back to the capitalized email prefix when username is not set', async () => {
    render(
      <VolunteerDashboard
        profile={{
          id: 'v2',
          email: 'jane.doe@example.org',
          role: 'volunteer',
        }}
        onLogout={vi.fn()}
      />
    );

    const header = screen.getByRole('banner');
    expect(within(header).getByText('Jane')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading events and registrations...')).not.toBeInTheDocument();
    });
  });

  it('keeps the red bar on the organizer PortalTopbar', () => {
    render(
      <PortalTopbar
        email="org@example.org"
        username="lead_org"
        roleLabel="Organizer"
        activeView="Overview"
        loggingOut={false}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-brand');
    expect(within(header).getByText('lead_org')).toBeInTheDocument();
  });
});
