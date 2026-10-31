import type { Lang } from '../i18n/translations';

/* Money renders in the user's chosen UI language.
   - Georgian (ka) → "120 ₾"   (symbol trails, as locally conventional)
   - Russian (ru) → "120 ₽"   (symbol trails, as locally conventional)
   - Everyone else → "$120"    (clinic lists USD on the English / Russian site)

   Pricing on the backend stores a single `decimal` with no currency tag;
   the clinic quotes in GEL/USD at the same numeric value. If that ever
   splits (dual pricing), add a `currency` field to Procedure/Doctor and
   switch this helper to a `(amount, currency, lang)` signature. */

export function formatMoney(amount: number, lang: Lang): string {
  const rounded = Math.round(amount);
  const n = rounded.toLocaleString('en-US');
  if (lang === 'ka') {
    return `${n} ₾`;
  } else if (lang === 'ru') {
    return `${n} ₽`;
  } else {
    return `$${n}`;
  }
}
