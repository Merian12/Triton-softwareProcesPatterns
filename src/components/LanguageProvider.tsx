'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { translate, type Language, type TranslationParams } from '@/lib/translations';

const storageKey = 'triton-language';
let currentLanguage: Language | undefined;
const listeners = new Set<() => void>();
function snapshot(): Language {
  if (currentLanguage) return currentLanguage;
  try { currentLanguage = localStorage.getItem(storageKey) === 'en' ? 'en' : 'da'; }
  catch { currentLanguage = 'da'; }
  return currentLanguage;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) { currentLanguage = undefined; listeners.forEach(notify => notify()); }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}
function setLanguage(language: Language) {
  currentLanguage = language;
  try { localStorage.setItem(storageKey, language); } catch { /* Keep working when storage is unavailable. */ }
  listeners.forEach(notify => notify());
}
type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (value: string | number | null | undefined, params?: TranslationParams) => string;
};
// Components also work in isolated tests/stories without the app layout.
const LanguageContext = createContext<LanguageContextValue>({ language: 'en', locale: 'en-GB', setLanguage, t: (value, params) => translate('en', value, params) });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, snapshot, () => 'da' as const);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, locale: language === 'da' ? 'da-DK' : 'en-GB', setLanguage,
    t: (text: string | number | null | undefined, params?: TranslationParams) => translate(language, text, params),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <div role="group" aria-label={language === 'da' ? 'Vælg sprog' : 'Choose language'} className="inline-flex rounded-lg border border-border-default bg-surface-card p-1 text-sm text-foreground">
    {(['da', 'en'] as const).map(value => <button type="button" key={value} lang={value} aria-pressed={language === value} onClick={() => setLanguage(value)}
      className={`min-h-9 cursor-pointer rounded-md px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${language === value ? 'bg-brand/10 font-semibold text-brand' : 'hover:bg-surface-muted'}`}>{value === 'da' ? 'Dansk' : 'English'}</button>)}
  </div>;
}
