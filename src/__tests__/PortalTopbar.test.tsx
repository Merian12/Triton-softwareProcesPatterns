import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PortalTopbar from '@/components/PortalTopbar';

afterEach(cleanup);

function renderTopbar() {
  const onLogout = vi.fn();
  render(<PortalTopbar email="coordinator@example.com" activeView="Overview" loggingOut={false} onNavigate={vi.fn()} onLogout={onLogout} />);
  const trigger = screen.getByText('Organizer').closest('summary')!;
  const menu = trigger.closest('details')!;
  fireEvent.click(trigger);
  expect(menu.open).toBe(true);
  return { trigger, menu, onLogout };
}

describe('account menu logout clicks', () => {
  it('keeps logout clickable when the summary loses focus without a new focus target', () => {
    const { trigger, menu, onLogout } = renderTopbar();
    // Some browsers do not focus buttons on pointer clicks. Blur then has no relatedTarget.
    fireEvent.blur(trigger, { relatedTarget: null });
    expect(menu.open).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('closes when keyboard focus moves outside the account menu', () => {
    const { menu } = renderTopbar();
    fireEvent.focusIn(screen.getByRole('button', { name: 'Overview' }));
    expect(menu.open).toBe(false);
  });

  it('closes on an outside pointer click', () => {
    const { menu } = renderTopbar();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Overview' }));
    expect(menu.open).toBe(false);
  });
});
