import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyShiftNotes, { type ShiftBooking } from '@/components/volunteer/MyShiftNotes';

let notesResponse: { data: { note_date: string; content: string }[] | null; error: { message: string } | null };

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => notesResponse),
      })),
    })),
  },
}));

describe('MyShiftNotes', () => {
  beforeEach(() => {
    notesResponse = { data: [], error: null };
  });

  it('shows empty state and triggers onFindEvents when there are no bookings', async () => {
    const onFindEvents = vi.fn();
    render(
      <MyShiftNotes
        bookings={[]}
        userId="v1"
        onViewDetails={vi.fn()}
        onFindEvents={onFindEvents}
      />
    );

    expect(await screen.findByText(/No shifts yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Find events' }));
    expect(onFindEvents).toHaveBeenCalledTimes(1);
  });

  it('sorts bookings chronologically, displays matching calendar notes, and opens shift details', async () => {
    notesResponse = {
      data: [{ note_date: '2026-11-10', content: 'Meet at main entrance' }],
      error: null,
    };

    const bookings: ShiftBooking[] = [
      {
        id: 'b-later',
        shift_id: 's2',
        status: 'registered',
        event: { id: 'e2', title: 'Later Event' },
        shift: {
          id: 's2',
          event_id: 'e2',
          title: 'Afternoon shift',
          starts_at: '2026-11-20T14:00:00',
          ends_at: '2026-11-20T17:00:00',
        },
      },
      {
        id: 'b-earlier',
        shift_id: 's1',
        status: 'registered',
        guests: [
          { id: 'g1', full_name: 'Emil Hansen' },
          { id: 'g2', full_name: 'Sofia Holm' },
        ],
        event: { id: 'e1', title: 'Earlier Event' },
        shift: {
          id: 's1',
          event_id: 'e1',
          title: 'Morning shift',
          starts_at: '2026-11-10T08:00:00',
          ends_at: '2026-11-10T11:00:00',
        },
      },
    ];

    const onViewDetails = vi.fn();
    render(
      <MyShiftNotes
        bookings={bookings}
        userId="v1"
        onViewDetails={onViewDetails}
        onFindEvents={vi.fn()}
      />
    );

    expect(await screen.findByText('Meet at main entrance')).toBeInTheDocument();
    expect(screen.getByText(/Emil Hansen, Sofia Holm/)).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Earlier Event', 'Later Event']);

    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[0]);
    expect(onViewDetails).toHaveBeenCalledWith('b-earlier');
  });

  it('shows an error alert when loading calendar notes fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    notesResponse = { data: null, error: { message: 'DB error' } };

    render(
      <MyShiftNotes
        bookings={[]}
        userId="v1"
        onViewDetails={vi.fn()}
        onFindEvents={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your calendar notes.');
    vi.restoreAllMocks();
  });
});
