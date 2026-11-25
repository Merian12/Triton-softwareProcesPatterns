import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExpandedCalendar from '@/components/volunteer/ExpandedCalendar';

type MockNote = {
  id: string;
  note_date: string;
  content: string;
};

let currentUser: { id: string } | null = { id: 'v1' };
let mockNotes: MockNote[] = [];
let mockRegistrations: { shift_id: string }[] = [];
let mockShifts: {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
}[] = [];

const upsertSpy = vi.fn();
const deleteSpy = vi.fn();

function createQuery(getData: () => unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
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
      getUser: vi.fn(async () => ({ data: { user: currentUser }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === 'volunteer_calendar_notes') {
        const query = createQuery(() => mockNotes);
        return {
          ...query,
          upsert: vi.fn(async (payload: { note_date: string; content: string }) => {
            upsertSpy(payload);
            const existing = mockNotes.find((n) => n.note_date === payload.note_date);
            if (existing) {
              existing.content = payload.content;
            } else {
              mockNotes = [
                ...mockNotes,
                { id: `n-${mockNotes.length + 1}`, note_date: payload.note_date, content: payload.content },
              ];
            }
            return { error: null };
          }),
          delete: vi.fn(() => {
            let targetDate: string | null = null;
            const chain = {
              eq: vi.fn((col: string, val: string) => {
                if (col === 'note_date') targetDate = val;
                return chain;
              }),
              then: (
                onFulfilled?: (value: { error: null }) => unknown,
                onRejected?: (reason: unknown) => unknown
              ) => {
                deleteSpy(targetDate);
                mockNotes = mockNotes.filter((n) => n.note_date !== targetDate);
                return Promise.resolve({ error: null }).then(onFulfilled, onRejected);
              },
            };
            return chain;
          }),
        };
      }
      if (table === 'registrations') return createQuery(() => mockRegistrations);
      if (table === 'shifts') return createQuery(() => mockShifts);
      return createQuery(() => []);
    }),
  },
}));

describe('ExpandedCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-11T12:00:00'));
    currentUser = { id: 'v1' };
    mockNotes = [];
    mockRegistrations = [{ shift_id: 's1' }];
    mockShifts = [
      {
        id: 's1',
        title: 'Water station',
        description: 'Hand out cups',
        location: 'Km 10',
        starts_at: '2026-11-15T09:00:00',
        ends_at: '2026-11-15T12:00:00',
      },
    ];
    upsertSpy.mockClear();
    deleteSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('displays registered shifts for a selected date and lets the volunteer save, edit, and delete a note', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ExpandedCalendar />);

    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select 2026-11-15' }));

    expect(screen.getByRole('heading', { name: 'Registered shifts' })).toBeInTheDocument();
    expect(screen.getAllByText('Water station').length).toBeGreaterThan(0);
    expect(screen.getByText('Km 10')).toBeInTheDocument();
    expect(screen.getByText('Hand out cups')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Write your notes for this day...');
    expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '  Bring warm jacket  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ note_date: '2026-11-15', content: 'Bring warm jacket' })
    );
    expect(textarea).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    expect(textarea).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/deleted/i);
    expect(deleteSpy).toHaveBeenCalledWith('2026-11-15');
    expect(textarea).toHaveValue('');
  });

  it('navigates between months and returns to the current month via Today', async () => {
    render(<ExpandedCalendar />);
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(await screen.findByRole('heading', { name: 'December 2026' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(await screen.findByRole('heading', { name: 'October 2026' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
  });

  it('shows an alert when the user is not signed in', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    currentUser = null;

    render(<ExpandedCalendar />);

    expect(await screen.findByRole('alert')).toHaveTextContent('You must be signed in.');
  });
});
