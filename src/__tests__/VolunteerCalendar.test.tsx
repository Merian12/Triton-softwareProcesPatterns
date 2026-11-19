import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VolunteerCalendar from '@/components/VolunteerCalendar';

let mockUser: { id: string } | null = { id: 'v1' };
let mockRegistrations: { shift_id: string }[] = [];
let mockShifts: { id: string; starts_at: string; ends_at: string }[] = [];

function createQuery(getData: () => unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    lte: vi.fn(() => query),
    gte: vi.fn(() => query),
    then: (
      onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve({ data: getData(), error: null }).then(onFulfilled, onRejected),
  };
  return query;
}

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === 'registrations') return createQuery(() => mockRegistrations);
      if (table === 'shifts') return createQuery(() => mockShifts);
      return createQuery(() => []);
    }),
  },
}));

describe('VolunteerCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-11T12:00:00'));
    mockUser = { id: 'v1' };
    mockRegistrations = [];
    mockShifts = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "No shifts today" when unauthenticated and calls onOpenCalendar when clicked', async () => {
    mockUser = null;
    const onOpenCalendar = vi.fn();

    render(<VolunteerCalendar onOpenCalendar={onOpenCalendar} />);

    const button = await screen.findByRole('button', { name: 'Open calendar' });
    expect(button).toHaveTextContent('WEDNESDAY');
    expect(button).toHaveTextContent('11');
    expect(button).toHaveTextContent('No shifts today');

    fireEvent.click(button);
    expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  });

  it('shows "1 shift today" when the volunteer has one shift today', async () => {
    mockRegistrations = [{ shift_id: 's1' }];
    mockShifts = [
      { id: 's1', starts_at: '2026-11-11T09:00:00', ends_at: '2026-11-11T12:00:00' },
    ];

    render(<VolunteerCalendar />);

    expect(await screen.findByText('1 shift today')).toBeInTheDocument();
  });

  it('shows plural count when the volunteer has multiple shifts today', async () => {
    mockRegistrations = [{ shift_id: 's1' }, { shift_id: 's2' }];
    mockShifts = [
      { id: 's1', starts_at: '2026-11-11T09:00:00', ends_at: '2026-11-11T12:00:00' },
      { id: 's2', starts_at: '2026-11-11T14:00:00', ends_at: '2026-11-11T17:00:00' },
    ];

    render(<VolunteerCalendar />);

    expect(await screen.findByText('2 shifts today')).toBeInTheDocument();
  });
});
