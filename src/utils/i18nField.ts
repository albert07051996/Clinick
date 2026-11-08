import type { Lang } from '../i18n/translations';

/* Picks the correct translation for a backend-sourced string.

   Backend entities (Procedure, Specialization, BeforeAfterCase) store the
   Georgian value in the canonical field and optional ru/en overrides alongside.
   Translation fields are nullable — if the admin hasn't filled them in yet, we
   fall back to the Georgian canonical rather than show an empty string. */

export function pickI18n(
  ka: string | null | undefined,
  ru: string | null | undefined,
  en: string | null | undefined,
  lang: Lang,
): string {
  const fallback = (ka ?? '').trim();

  if (lang === 'ru') {
    const v = (ru ?? '').trim();
    return v || fallback;
  }
  if (lang === 'en') {
    const v = (en ?? '').trim();
    return v || fallback;
  }
  return fallback;
}
