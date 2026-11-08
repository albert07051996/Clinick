import type { Lang } from '../i18n/translations';

/* Backend stores every price as a single `decimal` with no currency tag —
   the clinic quotes everything in GEL. For non-Georgian UIs we convert at the
   latest NBG rate (fetched by LanguageContext). If that fetch failed, the
   fallback constants below keep prices in roughly the right order of
   magnitude rather than crashing the page. */

export type RateMap = {
  usd?: number;   // GEL per 1 USD, e.g. 2.75
  rub?: number;   // GEL per 1 RUB, e.g. 0.030
};

const FALLBACK: Required<RateMap> = {
  usd: 2.75,
  rub: 0.030,
};

export function formatMoney(amountGel: number, lang: Lang, rates?: RateMap): string {
  if (lang === 'ka') {
    return `${Math.round(amountGel).toLocaleString('en-US')} ₾`;
  }

  if (lang === 'ru') {
    const r = rates?.rub && rates.rub > 0 ? rates.rub : FALLBACK.rub;
    return `${Math.round(amountGel / r).toLocaleString('en-US')} ₽`;
  }

  const r = rates?.usd && rates.usd > 0 ? rates.usd : FALLBACK.usd;
  return `$${Math.round(amountGel / r).toLocaleString('en-US')}`;
}
