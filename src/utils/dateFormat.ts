/* Project-wide date & time formatters.
   We force 24-hour time and dd/mm/yyyy dates everywhere, independent of
   the chosen UI language, so the UX is uniform for every user and matches
   the local Georgian clinic convention. */

const DATE_LOCALE = 'en-GB';   // gives dd/mm/yyyy
const TIME_LOCALE = 'en-GB';   // gives 24-hour HH:mm

type Dateish = string | number | Date;

function toDate(v: Dateish): Date {
  return v instanceof Date ? v : new Date(v);
}

/** "30/10/2026" */
export function formatDate(v: Dateish): string {
  return toDate(v).toLocaleDateString(DATE_LOCALE);
}

/** "14:30" */
export function formatTime(v: Dateish): string {
  return toDate(v).toLocaleTimeString(TIME_LOCALE, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** "30/10/2026, 14:30" */
export function formatDateTime(v: Dateish): string {
  return `${formatDate(v)}, ${formatTime(v)}`;
}

/** "30 Oct 2026" — short form for calendar headers / range labels. */
export function formatDateShort(v: Dateish): string {
  return toDate(v).toLocaleDateString(DATE_LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** "Fri, 30 Oct 2026" — weekday + short date for list rows. */
export function formatDateWithWeekday(v: Dateish): string {
  return toDate(v).toLocaleDateString(DATE_LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** "30 Oct" — compact for calendar axis. */
export function formatDayMonth(v: Dateish): string {
  return toDate(v).toLocaleDateString(DATE_LOCALE, {
    day: 'numeric', month: 'short',
  });
}
