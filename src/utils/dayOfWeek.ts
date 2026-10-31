/* Backend serializes `DayOfWeek` as the enum NAME ("Monday", "Tuesday"...)
   because System.Text.Json is configured with JsonStringEnumConverter.
   The frontend therefore needs to convert back to a number (0..6, Sun..Sat)
   when it wants to use it as an index — e.g. to look up translated day
   labels or match against JavaScript's Date#getDay(). */

export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

const BY_NAME: Record<DayOfWeek, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

/** Convert the string the backend sends into a number matching Date#getDay(). */
export function dayOfWeekToNumber(dow: DayOfWeek | number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  if (typeof dow === 'number') return (dow % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return BY_NAME[dow] ?? 0;
}
