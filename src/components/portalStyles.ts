// Unified UI style system for the Triton Event Portal.
// All color tokens (bg-brand, border-brand, bg-background, text-foreground, etc.)
// are backed by CSS variables in `src/app/globals.css` (:root).

const baseAction =
  'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40';

export const button = `${baseAction} border-border-default bg-surface-card text-foreground hover:bg-neutral-50`;
export const primary = `${baseAction} border-brand bg-surface-card font-semibold text-foreground hover:bg-brand/5`;
export const primarySolid = `${baseAction} border-brand bg-brand font-semibold text-white hover:bg-brand-hover`;

// Backwards-compatible aliases
export const portalButton = button;
export const portalPrimary = primarySolid;

// Layout & structural classes
export const portalShell = 'min-h-screen bg-background text-foreground';
export const portalContainer = 'mx-auto max-w-6xl px-5 sm:px-9';
export const portalTopbar = 'bg-brand text-white';
export const portalNav = 'flex flex-wrap items-center gap-4 border-b border-border-subtle px-2 py-3';
export const panel = 'border-b border-border-subtle pb-7';
export const card = 'rounded-xl border border-brand/40 p-5';

// Form controls
export const input =
  'min-h-11 w-full rounded-sm border border-border-default bg-surface-card p-3 focus:outline-2 focus:outline-brand';
export const textarea =
  'w-full rounded-sm border border-border-default bg-surface-card p-3 focus:outline-2 focus:outline-brand';
export const checkbox = 'size-4 accent-brand';

// Navigation tab helper
export function navTab(active: boolean) {
  return `inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-brand px-4 py-2 text-sm transition-[scale,background-color,color] duration-200 ease-out hover:scale-[1.08] hover:bg-brand/5 hover:text-foreground focus-visible:scale-[1.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${
    active ? 'scale-[1.08] bg-brand/5 font-semibold text-foreground' : 'text-muted'
  }`;
}

// Date formatting helper
export function dateLabel(value: string) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not specified';
}
