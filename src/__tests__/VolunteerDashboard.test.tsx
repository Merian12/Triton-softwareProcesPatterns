import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import VolunteerDashboard from '@/components/VolunteerDashboard';

type MockRegistration = {
  id: string;
  shift_id: string;
  volunteer_id: string;
  status: string;
};

const mockEvents = [
  {
    id: 'e1',
    title: 'CPH Marathon',
    description: 'Annual city marathon',
    location: 'Østerbro',
    starts_at: '2099-05-16T08:00:00.000Z',
  },
];

const mockShifts = [
  {
    id: 's-full',
    event_id: 'e1',
    title: 'Baggage and welcome',
    description: 'Welcome runners and manage baggage.',
    location: 'Start area',
    starts_at: '2099-05-16T08:00:00.000Z',
    ends_at: '2099-05-16T11:00:00.000Z',
    capacity: 2,
    registered_count: 2,
    status: 'open',
  },
  {
    id: 's-open',
    event_id: 'e1',
    title: 'Water station',
    description: 'Hand out water cups to runners.',
    location: 'Km 10',
    starts_at: '2099-05-16T09:00:00.000Z',
    ends_at: '2099-05-16T13:00:00.000Z',
    capacity: 5,
    registered_count: 1,
    status: 'open',
  },
];

let mockRegistrations: MockRegistration[] = [];

function createQuery(getData: () => unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (
      onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve({ data: getData(), error: null }).then(onFulfilled, onRejected),
  };
  return query;
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'v1', email: 'volunteer@example.org' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'events') return createQuery(() => mockEvents);
      if (table === 'shifts') return createQuery(() => mockShifts);
      if (table === 'registrations') {
        const query = createQuery(() => mockRegistrations);
        return {
          ...query,
          insert: vi.fn((row: Omit<MockRegistration, 'id'>) => {
            const created: MockRegistration = {
              id: `reg-${mockRegistrations.length + 1}`,
              ...row,
            };
            mockRegistrations = [...mockRegistrations, created];
            return {
              select: vi.fn().mockResolvedValue({ data: [created], error: null }),
            };
          }),
        };
      }
      if (table === 'volunteer_calendar_notes') return createQuery(() => []);
      return createQuery(() => []);
    }),
  },
}));

describe('Volunteer dashboard', () => {
  beforeEach(() => {
    mockRegistrations = [];
  });

  it('uses the authenticated profile and registers a shift only after acknowledgement', async () => {
    render(
      <VolunteerDashboard
        profile={{ id: 'v1', email: 'volunteer@example.org', role: 'volunteer' }}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText(/Signed in as volunteer@example.org/)).toBeInTheDocument();

    const viewShiftsButtons = await screen.findAllByRole('button', { name: 'View shifts' });
    fireEvent.click(viewShiftsButtons[0]);

    expect(screen.getByRole('button', { name: 'Fully booked' })).toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Choose shift' })[0]);
    expect(screen.getByRole('button', { name: 'Confirm registration' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm registration' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registration confirmed');

    fireEvent.click(screen.getByRole('button', { name: 'Find events' }));
    fireEvent.click((await screen.findAllByRole('button', { name: 'View shifts' }))[0]);
    expect(screen.getByRole('button', { name: 'Registered' })).toBeDisabled();
  });

  it.each([
    {
      date: '2026-11-11T12:00:00',
      label: 'November 2026',
      weekday: 'WEDNESDAY',
      yearMonth: '2026-11',
      today: 11,
      days: 30,
      offset: 6,
    },
    {
      date: '2028-02-15T12:00:00',
      label: 'February 2028',
      weekday: 'TUESDAY',
      yearMonth: '2028-02',
      today: 15,
      days: 29,
      offset: 1,
    },
  ])(
    'shows $label with the correct weekday alignment and today highlighted',
    async ({ date, label, weekday, yearMonth, today, days, offset }) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(date));
      try {
        render(
          <VolunteerDashboard
            profile={{ id: 'v1', email: 'volunteer@example.org', role: 'volunteer' }}
            onLogout={vi.fn()}
          />
        );

        const openCalendarButton = await screen.findByRole('button', { name: 'Open calendar' });
        expect(openCalendarButton).toHaveTextContent(weekday);
        expect(openCalendarButton).toHaveTextContent(String(today));

        fireEvent.click(openCalendarButton);

        expect(await screen.findByRole('heading', { name: label })).toBeInTheDocument();

        const todayKey = `${yearMonth}-${String(today).padStart(2, '0')}`;
        const currentDayButton = screen.getByRole('button', { name: `Select ${todayKey}` });
        const currentDayBadge = currentDayButton.querySelector('span');
        expect(currentDayBadge).toHaveTextContent(String(today));
        expect(currentDayBadge).toHaveClass('bg-[#D7142A]');

        expect(
          screen.getByRole('button', { name: `Select ${yearMonth}-${String(days).padStart(2, '0')}` })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: `Select ${yearMonth}-${String(days + 1).padStart(2, '0')}` })
        ).not.toBeInTheDocument();

        const firstDayButton = screen.getByRole('button', { name: `Select ${yearMonth}-01` });
        await waitFor(() => {
          expect(Array.from(firstDayButton.parentElement!.children).indexOf(firstDayButton)).toBe(offset);
        });
      } finally {
        vi.useRealTimers();
      }
    }
  );
});
