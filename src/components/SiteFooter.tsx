'use client';

import Link from 'next/link';
import { LanguageSwitcher, useLanguage } from './LanguageProvider';
import { portalContainer } from './portalStyles';

export default function SiteFooter() {
  const { language } = useLanguage();
  const da = language === 'da';
  const links = [
    ['/faq', da ? 'Ofte stillede spørgsmål' : 'Frequently asked questions'],
    ['/about', da ? 'Om Volunteerportal' : 'About Volunteerportal'],
    ['/contact', da ? 'Kontakt' : 'Contact'],
    ['/help', da ? 'Hjælp og vejledning' : 'Help and guidance'],
  ];
  return <footer className="mt-auto border-t-4 border-brand bg-brand-navy text-white">
    <div className={`${portalContainer} grid gap-9 py-10 sm:py-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}>
      <div>
        <p className="text-lg font-semibold tracking-tight">Volunteerportal</p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">{da ? 'Sammen om frivillighed. Find din plads ved sportsevents i Danmark.' : 'Volunteering together. Find your place at sporting events in Denmark.'}</p>
      </div>
      <nav aria-label={da ? 'Information og hjælp' : 'Information and help'} className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {links.map(([href, label]) => <Link key={href} href={href} className="group flex min-h-12 items-center gap-3 rounded-sm py-2 text-base font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span aria-hidden="true" className="text-xl text-white/60 transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>{label}</Link>)}
      </nav>
    </div>
    <div className="border-t border-white/15">
      <div className={`${portalContainer} flex flex-wrap items-center justify-between gap-4 py-5`}>
        <p className="text-xs text-white/65">{da ? 'Et studieprojekt med fællesskabet i centrum.' : 'A student project with community at its heart.'}</p>
        <LanguageSwitcher />
      </div>
    </div>
  </footer>;
}
