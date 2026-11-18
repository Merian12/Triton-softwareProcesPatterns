import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
const profile = { id: 'admin', email: 'admin@example.com', role: 'organizer' as const };
describe('Organizer dashboard', () => {
  it('shows registrations, filters full shifts and retains form values between steps', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<OrganizerDashboard profile={profile} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find events' }));
    fireEvent.click(screen.getByRole('button', { name: 'View shifts for CPH Marathon' }));
    const shifts = screen.getByRole('region', { name: 'CPH Marathon' });
    expect(within(shifts).getByText('Baggage and welcome')).toBeInTheDocument();
    fireEvent.click(within(shifts).getByLabelText('Only shifts with available places'));
    expect(within(shifts).queryByText('Baggage and welcome')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit CPH Marathon' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'CPH nyt navn' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Volunteers needed', { selector: 'input[id="shift.water.capacity"]' })).toHaveValue(6);
    expect(screen.getByRole('button', { name: 'Remove shift 1' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Name')).toHaveValue('CPH nyt navn');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Location', { selector: 'input[id="shift.water.location"]' }), { target: { value: 'Ny vandpost' } });
    expect(screen.getByRole('heading', { name: 'Changes affect registrations' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm');
    fireEvent.click(screen.getByRole('checkbox', { name: /I have reviewed/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('status')).toHaveTextContent('Event updated.');
    fireEvent.click(screen.getByRole('button', { name: 'View shifts for CPH nyt navn' }));
    expect(screen.getByText('Ny vandpost')).toBeInTheDocument();
    expect(screen.getByText('View volunteers (3)')).toBeInTheDocument();
  });
  it('asks before discarding and saves drafts', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<OrganizerDashboard profile={profile} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Create event/ }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nyt klubstævne' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close form' }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('Nyt klubstævne');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(screen.getByRole('status')).toHaveTextContent('Draft updated.');
    expect(screen.getByRole('heading', { name: 'Nyt klubstævne' })).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});



describe('Organizer navigation and calendar', () => {
  it('reuses the calendar, links every tab and shows one person per volunteer place', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-05-01T12:00:00'));
    try {
      render(<OrganizerDashboard profile={profile} onLogout={vi.fn()} />);
      const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(within(navigation).getAllByRole('button').map(button => button.textContent)).toEqual(['Overview', 'Find events', 'My shifts', 'Messages']);
      const occupancy = screen.getByRole('img', { name: 'CPH Marathon volunteer places: 5 of 8 filled' });
      expect(occupancy.querySelectorAll('svg')).toHaveLength(8);
      expect(Array.from(occupancy.querySelectorAll('svg')).filter(icon => icon.classList.contains('fill-[#86efac]'))).toHaveLength(5);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      const calendar = screen.getByRole('region', { name: 'May 2027 shift calendar' });
      fireEvent.click(within(calendar).getByRole('button', { name: '16 May 2027, 2 shifts' }));
      expect(within(calendar).getByText('Water station')).toBeInTheDocument();
      fireEvent.click(within(calendar).getByRole('button', { name: 'Next month' }));
      expect(screen.getByRole('region', { name: 'June 2027 shift calendar' })).toBeInTheDocument();
      fireEvent.click(within(navigation).getByRole('button', { name: 'My shifts' }));
      expect(screen.getByRole('region', { name: 'Shift management' })).toBeInTheDocument();
      fireEvent.click(within(navigation).getByRole('button', { name: 'Messages' }));
      expect(screen.getByText('No messages yet.')).toBeInTheDocument();
      expect(screen.queryByText(/Eksempeldata|lokal demo|Offentliggjort/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
