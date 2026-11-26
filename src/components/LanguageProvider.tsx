'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type Language, type TranslationParams } from '@/lib/translations';

type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (value: string | number | null | undefined, params?: TranslationParams) => string;
};
// Components also work in isolated tests/stories without the app layout.
const LanguageContext = createContext<LanguageContextValue>({ language: 'en', locale: 'en-GB', setLanguage: () => {}, t: (value, params) => translate('en', value, params) });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, locale: language === 'da' ? 'da-DK' : 'en-GB', setLanguage,
    t: (text: string | number | null | undefined, params?: TranslationParams) => translate(language, text, params),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === 'en' ? 'da' : 'en';

  return (
    <button
      type="button"
      lang={nextLanguage}
      onClick={() => setLanguage(nextLanguage)}
      className={`min-h-11 shrink-0 cursor-pointer rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ${onDark ? 'text-white focus-visible:outline-white' : 'text-brand-navy focus-visible:outline-brand'}`}
    >
      {nextLanguage === 'da' ? 'Dansk' : 'English'}
    </button>
  );
}
