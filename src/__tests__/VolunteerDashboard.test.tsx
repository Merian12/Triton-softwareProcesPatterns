import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import VolunteerDashboard from '@/components/volunteer/VolunteerDashboard';

type MockRegistration = {
  id: string;
  shift_id: string;
  volunteer_id: string;
  status: string;
};

type MockGuest = {
  id: string;
  registration_id: string;
  full_name: string;
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

function createInitialShifts() {
  return [
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
}

let mockShifts = createInitialShifts();
let mockRegistrations: MockRegistration[] = [];
let mockGuests: MockGuest[] = [];
let mockEventsError: Error | null = null;
let mockSearchParams = new URLSearchParams();

function createQuery(getData: () => unknown[], getError?: () => Error | null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (
      onFulfilled?: (value: { data: unknown[]; error: Error | null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve({ data: getData(), error: getError?.() ?? null }).then(onFulfilled, onRejected),
  };
  return query;
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'v1', email: 'volunteer@example.org' } },
        error: null,
      }),
    },
    rpc: vi.fn(async (fn: string, params: Record<string, unknown>) => {
      if (fn === 'register_shift_with_guests') {
        const shiftId = String(params.p_shift_id);
        const guestNames = (params.p_guest_names as string[]) ?? [];
        const created: MockRegistration = {
          id: `reg-${mockRegistrations.length + 1}`,
          shift_id: shiftId,
          volunteer_id: 'v1',
          status: 'registered',
        };
        mockRegistrations = [...mockRegistrations, created];
        guestNames.forEach((full_name) => {
          mockGuests = [
            ...mockGuests,
            { id: `g-${mockGuests.length + 1}`, registration_id: created.id, full_name },
          ];
        });
        mockShifts = mockShifts.map((shift) =>
          shift.id === shiftId
            ? { ...shift, registered_count: shift.registered_count + 1 + guestNames.length }
            : shift
        );
        return { data: created.id, error: null };
      }

      if (fn === 'add_registration_guests') {
        const registrationId = String(params.p_registration_id);
        const guestNames = (params.p_guest_names as string[]) ?? [];
        const registration = mockRegistrations.find((r) => r.id === registrationId);
        guestNames.forEach((full_name) => {
          mockGuests = [
            ...mockGuests,
            { id: `g-${mockGuests.length + 1}`, registration_id: registrationId, full_name },
          ];
        });
        if (registration) {
          mockShifts = mockShifts.map((shift) =>
            shift.id === registration.shift_id
              ? { ...shift, registered_count: shift.registered_count + guestNames.length }
              : shift
          );
        }
        return { data: null, error: null };
      }

      return { data: null, error: null };
    }),
    from: vi.fn((table: string) => {
      if (table === 'events') return createQuery(() => mockEvents, () => mockEventsError);
      if (table === 'shifts') return createQuery(() => mockShifts);
      if (table === 'registrations') return createQuery(() => mockRegistrations);
      if (table === 'registration_guests') return createQuery(() => mockGuests);
      if (table === 'volunteer_calendar_notes') return createQuery(() => []);
      return createQuery(() => []);
    }),
  },
}));

describe('Volunteer dashboard', () => {
  beforeEach(() => {
    mockShifts = createInitialShifts();
    mockRegistrations = [];
    mockGuests = [];
    mockEventsError = null;
    mockSearchParams = new URLSearchParams();
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
        const firstDayButton = screen.getByRole('button', { name: `Select ${yearMonth}-01` });
        const currentDayBadge = currentDayButton.querySelector('span');
        const firstDayBadge = firstDayButton.querySelector('span');
        expect(currentDayBadge).toHaveTextContent(String(today));
        expect(currentDayBadge?.className).not.toBe(firstDayBadge?.className);

        expect(
          screen.getByRole('button', { name: `Select ${yearMonth}-${String(days).padStart(2, '0')}` })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: `Select ${yearMonth}-${String(days + 1).padStart(2, '0')}` })
        ).not.toBeInTheDocument();

        await waitFor(() => {
          expect(Array.from(firstDayButton.parentElement!.children).indexOf(firstDayButton)).toBe(offset);
        });
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('displays the upcoming registered shift on Overview and opens its details', async () => {
    mockRegistrations = [
      { id: 'reg-existing', shift_id: 's-open', volunteer_id: 'v1', status: 'registered' },
    ];

    render(
      <VolunteerDashboard
        profile={{ id: 'v1', email: 'volunteer@example.org', role: 'volunteer' }}
        onLogout={vi.fn()}
      />
    );

    const viewShiftButton = await screen.findByRole('button', { name: 'View shift' });
    expect(screen.getByText(/Water station/)).toBeInTheDocument();

    fireEvent.click(viewShiftButton);
    expect(screen.getByText('You are registered for this shift.')).toBeInTheDocument();
  });

  it('opens the requested view from search params and shows errors when data loading or logout fails', async () => {
    mockSearchParams = new URLSearchParams('view=Find+events');
    mockEventsError = new Error('Events unavailable');
    const onLogout = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <VolunteerDashboard
        profile={{ id: 'v1', email: 'volunteer@example.org', role: 'volunteer' }}
        onLogout={onLogout}
      />
    );

    expect(await screen.findByRole('heading', { name: 'Find events' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Events unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not log out. Please try again.');
  });

  it('registers with guests and allows adding another guest after registration', async () => {
    render(
      <VolunteerDashboard
        profile={{ id: 'v1', email: 'volunteer@example.org', role: 'volunteer' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click((await screen.findAllByRole('button', { name: 'View shifts' }))[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose shift' })[0]);

    fireEvent.click(screen.getByRole('button', { name: '+ Add guest' }));
    expect(screen.getByText('Total spots: 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm registration' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a name for each guest.');

    fireEvent.change(screen.getByLabelText('Guest 1 name'), { target: { value: 'Emil Hansen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm registration' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registration confirmed');
    expect(await screen.findByText(/Emil Hansen/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View details' }));
    expect(screen.getByText('Emil Hansen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Add guest' }));
    fireEvent.change(screen.getByLabelText('Guest 2 name'), { target: { value: 'Sofia Holm' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add guests' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Guests added to your registration.');
    expect(await screen.findByText('Sofia Holm')).toBeInTheDocument();
  });
});
