import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PortalTopbar from '@/components/PortalTopbar';

describe('PortalTopbar', () => {
  it('derives a capitalized fallback display name from email and uses username when set', () => {
    const { rerender } = render(
      <PortalTopbar
        email="anna.smith@example.org"
        activeView="Overview"
        loggingOut={false}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Organizer')).toBeInTheDocument();

    rerender(
      <PortalTopbar
        email="anna.smith@example.org"
        username="Coach Anna"
        roleLabel="Admin"
        activeView="Overview"
        loggingOut={false}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText('Coach Anna')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('navigates home via logo, triggers profile/logout actions, and closes dropdown on Escape or outside pointerdown', () => {
    const onNavigate = vi.fn();
    const onProfile = vi.fn();
    const onLogout = vi.fn();

    const { container } = render(
      <PortalTopbar
        email="organizer@example.org"
        activeView="Find events"
        loggingOut={false}
        onNavigate={onNavigate}
        onProfile={onProfile}
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volunteer Portal home' }));
    expect(onNavigate).toHaveBeenCalledWith('Overview');

    const details = container.querySelector('details')!;
    details.open = true;

    fireEvent.keyDown(details, { key: 'Escape' });
    expect(details.open).toBe(false);

    details.open = true;
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);

    details.open = true;
    fireEvent.click(screen.getByRole('button', { name: 'My profile' }));
    expect(onProfile).toHaveBeenCalledTimes(1);
    expect(details.open).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('disables the logout button while logging out', () => {
    render(
      <PortalTopbar
        email="organizer@example.org"
        activeView="Overview"
        loggingOut={true}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Logging out…' })).toBeDisabled();
  });
});
