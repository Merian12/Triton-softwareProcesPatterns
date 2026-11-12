import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';
const profile = { id: 'admin', email: 'admin@example.com', role: 'organizer' as const };
describe('Organizer dashboard', () => {
  it('shows registrations, filters full shifts and retains form values between steps', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<OrganizerDashboard profile={profile} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arrangementer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Se vagter for CPH Marathon' }));
    const shifts = screen.getByRole('region', { name: 'CPH Marathon' });
    expect(within(shifts).getByText('Bagage og modtagelse')).toBeInTheDocument();
    fireEvent.click(within(shifts).getByLabelText('Kun vagter med ledige pladser'));
    expect(within(shifts).queryByText('Bagage og modtagelse')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Redigér CPH Marathon' }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'CPH nyt navn' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fortsæt' }));
    expect(screen.getByLabelText('Nødvendigt antal frivillige', { selector: 'input[id="shift.water.capacity"]' })).toHaveValue(6);
    expect(screen.getByRole('button', { name: 'Fjern vagt 1' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(screen.getByLabelText('Navn')).toHaveValue('CPH nyt navn');
    fireEvent.click(screen.getByRole('button', { name: 'Fortsæt' }));
    fireEvent.change(screen.getByLabelText('Lokation', { selector: 'input[id="shift.water.location"]' }), { target: { value: 'Ny vandpost' } });
    expect(screen.getByRole('heading', { name: 'Tilmeldinger bliver berørt' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fortsæt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gem ændringer i demo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Bekræft');
    fireEvent.click(screen.getByRole('checkbox', { name: /Jeg har gennemgået/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gem ændringer i demo' }));
    expect(screen.getByRole('status')).toHaveTextContent('offentliggjort i denne demo');
    fireEvent.click(screen.getByRole('button', { name: 'Se vagter for CPH nyt navn' }));
    expect(screen.getByText('Ny vandpost')).toBeInTheDocument();
    expect(screen.getByText('Se tilmeldte (3)')).toBeInTheDocument();
  });
  it('asks before discarding and saves drafts explicitly in the demo', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<OrganizerDashboard profile={profile} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Opret arrangement/ }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Nyt klubstævne' } });
    fireEvent.click(screen.getByRole('button', { name: 'Luk formular' }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText('Navn')).toHaveValue('Nyt klubstævne');
    fireEvent.click(screen.getByRole('button', { name: 'Gem kladde i demo' }));
    expect(screen.getByRole('status')).toHaveTextContent('Kladde gemt i denne demo');
    expect(screen.getByRole('heading', { name: 'Nyt klubstævne' })).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});


