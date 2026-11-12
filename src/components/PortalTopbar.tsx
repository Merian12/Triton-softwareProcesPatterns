'use client';

import { useEffect, useRef } from 'react';
import { Logo } from '@/components/Logo';

export type PortalView = 'Overview' | 'Find events' | 'My shifts' | 'Messages';

type Props = {
  email: string;
  roleLabel?: string;
  onProfile?: () => void;
  activeView: PortalView | null;
  loggingOut: boolean;
  onNavigate: (view: PortalView) => void;
  onLogout: () => void;
};

export default function PortalTopbar({ email, activeView, loggingOut, onNavigate, onLogout, roleLabel = 'Organizer', onProfile }: Props) {
  const dropdown = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const emailName = email.split('@')[0].split(/[._+-]/)[0];
  const name = emailName ? emailName[0].toLocaleUpperCase('en-GB') + emailName.slice(1) : 'My account';

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return <>
    <header className="bg-[#ff0000] text-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-2 sm:px-9">
        <button type="button" onClick={() => onNavigate('Overview')} aria-label="Volunteer Portal home"
          className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <Logo variant="symbol" hoverAnimation="none" className="size-8 shrink-0 brightness-0 invert" />
          <span className="text-base font-semibold tracking-tight sm:text-lg">VolunteerPortal</span>
        </button>
        <details ref={dropdown} className="group relative border-l border-white/40 pl-4 sm:pl-5"
          onKeyDown={event => {
            if (event.key === 'Escape' && dropdown.current?.open) {
              event.preventDefault();
              dropdown.current.open = false;
              trigger.current?.focus();
            }
          }}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
          }}>
          <summary ref={trigger} className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [&::-webkit-details-marker]:hidden">
            <svg aria-hidden="true" viewBox="0 0 32 40" className="hidden h-7 w-6 fill-current sm:block"><circle cx="16" cy="10" r="8" /><path d="M1 36a15 15 0 0 1 30 0v2H1Z" /></svg>
            <span className="text-left"><span className="block max-w-28 truncate text-sm font-semibold">{name}</span><span className="block text-[11px] text-white/90">{roleLabel}</span></span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1 size-4 transition-transform group-open:rotate-180"><path d="m4 8 8 8 8-8" /></svg>
          </summary>
          <div className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-lg border border-neutral-200 bg-white py-2 text-neutral-900 shadow-lg">
            <p className="break-all border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">{email}</p>
            {onProfile && <button type="button" onClick={() => {
              if (dropdown.current) dropdown.current.open = false;
              onProfile();
            }} className="min-h-11 w-full cursor-pointer px-4 py-3 text-left text-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff0000]">My profile</button>}
            <button disabled={loggingOut} onClick={onLogout} className="min-h-11 w-full cursor-pointer px-4 py-3 text-left text-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff0000] disabled:cursor-not-allowed disabled:opacity-40">{loggingOut ? 'Logging out…' : 'Log out'}</button>
          </div>
        </details>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 sm:px-9">
      <nav aria-label="Main navigation" className="flex gap-6 overflow-x-auto border-b border-neutral-200">
        {(['Overview', 'Find events', 'My shifts', 'Messages'] as const).map(view => <button
          type="button" key={view} aria-current={activeView === view ? 'page' : undefined} onClick={() => onNavigate(view)}
          className={`min-h-11 shrink-0 cursor-pointer border-b-2 py-3 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff0000] ${activeView === view ? 'border-[#ff0000] font-semibold' : 'border-transparent text-neutral-600 hover:text-neutral-900'}`}
        >{view}</button>)}
      </nav>
    </div>
  </>;
}
