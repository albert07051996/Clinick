import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang, type Translation } from '../i18n/translations';
import { formatMoney as fmt, type RateMap } from '../utils/money';
import { pickI18n as pick } from '../utils/i18nField';
import { ratesService } from '../services/api/ratesService';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translation;
  rates: RateMap | null;
  formatMoney: (amountGel: number) => string;
  /** Picks the backend-sourced translation (ru/en) for the current lang, or
      falls back to the Georgian canonical when the override is empty. */
  pickI18n: (ka: string | null | undefined, ru: string | null | undefined, en: string | null | undefined) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'aurea_lang';
const RATES_KEY = 'aurea_rates_v1';
const RATES_TTL_MS = 60 * 60 * 1000; // 1 hour; matches server-side NBG cache

type CachedRates = { at: number; map: RateMap };

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

function readCachedRates(): RateMap | null {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (!parsed?.map || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > RATES_TTL_MS) return null;
    return parsed.map;
  } catch { return null; }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);
  const [rates, setRates] = useState<RateMap | null>(readCachedRates);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Only hit the backend when the UI is NOT in Georgian — ka keeps GEL and
  // skips the network entirely. Non-ka languages reuse the cached rates when
  // fresh; otherwise we fetch once and cache the result.
  useEffect(() => {
    if (lang === 'ka') return;
    if (rates) return;

    let cancelled = false;
    ratesService.get(['USD', 'RUB'])
      .then((data) => {
        if (cancelled || !data) return;
        const map: RateMap = {};
        for (const r of data.rates) {
          if (r.code === 'USD' && r.rate > 0) map.usd = r.rate;
          if (r.code === 'RUB' && r.rate > 0) map.rub = r.rate;
        }
        setRates(map);
        try {
          localStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), map } satisfies CachedRates));
        } catch { /* ignore */ }
      })
      .catch(() => { /* fall back to money.ts constants */ });

    return () => { cancelled = true; };
  }, [lang, rates]);

  const formatMoney = useCallback(
    (amountGel: number) => fmt(amountGel, lang, rates ?? undefined),
    [lang, rates],
  );

  const pickI18n = useCallback(
    (ka: string | null | undefined, ru: string | null | undefined, en: string | null | undefined) =>
      pick(ka, ru, en, lang),
    [lang],
  );

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: translations[lang], rates, formatMoney, pickI18n }),
    [lang, rates, formatMoney, pickI18n],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
