'use client';

import { useEffect, useRef } from 'react';

type Props = {
  email: string;
  activeView: 'Overblik' | 'Arrangementer' | null;
  loggingOut: boolean;
  onNavigate: (view: 'Overblik' | 'Arrangementer') => void;
  onLogout: () => void;
};

export default function OrganizerTopbar({ email, activeView, loggingOut, onNavigate, onLogout }: Props) {
  const dropdown = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  // Profiles currently contain email and role, but no display name.
  const emailName = email.split('@')[0].split(/[._+-]/)[0];
  const name = emailName ? emailName[0].toLocaleUpperCase('da-DK') + emailName.slice(1) : 'Min konto';

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return <header className="bg-[#b70f2b] text-white">
    <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-9 lg:grid-cols-[auto_1fr_auto] lg:gap-x-12 lg:py-5">
      <span className="text-xl font-extrabold tracking-tight sm:text-3xl">TRITON SWIM</span>
      <nav aria-label="Administration" className="order-last col-span-2 flex flex-wrap gap-6 lg:order-none lg:col-span-1 lg:gap-9">
        {(['Overblik', 'Arrangementer'] as const).map(view => <button
          key={view}
          aria-current={activeView === view ? 'page' : undefined}
          onClick={() => onNavigate(view)}
          className={`relative min-h-11 cursor-pointer px-1 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-lg ${activeView === view ? 'after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-white' : 'hover:bg-white/10'}`}
        >{view}</button>)}
      </nav>
      <details ref={dropdown} className="group relative border-l border-white/60 pl-4 sm:pl-6"
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
        <summary ref={trigger} className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [&::-webkit-details-marker]:hidden">
          <svg aria-hidden="true" viewBox="0 0 32 40" className="hidden h-9 w-8 fill-current sm:block"><circle cx="16" cy="10" r="8" /><path d="M1 36a15 15 0 0 1 30 0v2H1Z" /></svg>
          <span className="text-left"><span className="block max-w-36 truncate font-semibold sm:text-lg">{name}</span><span className="block text-xs sm:text-base">Administrator</span></span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 size-5 transition-transform group-open:rotate-180"><path d="m4 8 8 8 8-8" /></svg>
        </summary>
        <div className="absolute right-0 top-full z-20 mt-4 w-64 max-w-[calc(100vw-2.5rem)] rounded-lg border border-neutral-200 bg-white py-2 text-neutral-900 shadow-lg">
          <p className="break-all border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">{email}</p>
          <button disabled={loggingOut} onClick={onLogout} className="min-h-11 w-full cursor-pointer px-4 py-3 text-left text-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#b70f2b] disabled:cursor-not-allowed disabled:opacity-40">{loggingOut ? 'Logger ud…' : 'Log ud'}</button>
        </div>
      </details>
    </div>
  </header>;
}
