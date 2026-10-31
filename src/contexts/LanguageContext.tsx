import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang, type Translation } from '../i18n/translations';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translation;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'aurea_lang';

function detectInitial(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ka' || stored === 'en' || stored === 'ru') return stored;
  } catch { /* localStorage unavailable */ }

  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ka')) return 'ka';
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
