import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventEditor from '@/components/organizer/EventEditor';
import type { ClubEvent } from '@/services/eventService';

function createDraft(overrides: Partial<ClubEvent> = {}): ClubEvent {
  return {
    id: 'e-new',
    clubId: 'test-club-id',
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    deadline: '',
    contact: '',
    status: 'draft',
    shifts: [],
    ...overrides,
  };
}

describe('EventEditor', () => {
  it('blocks advancing from step 1 when required event fields are missing', () => {
    render(
      <EventEditor
        initial={createDraft()}
        existing={false}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onDirty={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Fix the highlighted fields to continue.');
    expect(screen.getByText('Enter the event name.')).toBeInTheDocument();
  });

  it('adds and removes shifts on step 2 and publishes once valid', () => {
    const onSave = vi.fn();
    const onDirty = vi.fn();
    const initial = createDraft({
      name: 'Spring Swim Meet',
      location: 'Ballerup Pool',
      description: 'Club swim meet',
      startDate: '2027-05-16',
      endDate: '2027-05-16',
      deadline: '2027-05-10',
      contact: 'coach@triton.dk',
    });

    render(
      <EventEditor
        initial={initial}
        existing={false}
        onSave={onSave}
        onCancel={vi.fn()}
        onDirty={onDirty}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Plan shifts' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Add at least one shift before publishing.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Add shift' }));
    expect(onDirty).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: '+ Add shift' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove shift 2' }));

    fireEvent.change(screen.getByLabelText('Task description'), { target: { value: 'Timekeeping' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText('Volunteers needed'), { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Review before saving' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Publish event' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spring Swim Meet',
        status: 'published',
        shifts: [expect.objectContaining({ task: 'Timekeeping', capacity: 4 })],
      })
    );
  });

  it('surfaces an error alert when onSave throws', () => {
    const onSave = vi.fn(() => {
      throw new Error('Could not reach database.');
    });
    const initial = createDraft({
      name: 'Autumn Cup',
      location: 'Ballerup Pool',
      description: 'Autumn competition',
      startDate: '2027-09-12',
      endDate: '2027-09-12',
      deadline: '2027-09-01',
      contact: 'coach@triton.dk',
      shifts: [
        {
          id: 's1',
          task: 'Setup',
          location: 'Poolside',
          date: '2027-09-12',
          start: '08:00',
          end: '10:00',
          capacity: 2,
          registrations: [],
        },
      ],
    });

    render(
      <EventEditor
        initial={initial}
        existing={false}
        onSave={onSave}
        onCancel={vi.fn()}
        onDirty={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish event' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach database.');
  });
});
