import { useEffect, useMemo, useState } from 'react';
import { doctorsService } from '../../services/api/doctorsService';
import { schedulesService } from '../../services/api/schedulesService';
import { useLang } from '../../contexts/LanguageContext';
import type { Doctor, Schedule } from '../../types';
import { dayOfWeekToNumber } from '../../utils/dayOfWeek';
import ZoomableImage from '../shared/ZoomableImage';

/* Weekly availability grid shown on the public homepage. Reads active
   doctors + their published schedules through the public endpoints so
   anonymous visitors can decide *when* a doctor is in before trying to
   book. No PHI leaks here — just dayOfWeek + HH:mm windows. */
export default function DoctorsAvailabilitySection() {
  const { t } = useLang();
  const copy = t.availability;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedulesByDoctor, setSchedulesByDoctor] = useState<Record<string, Schedule[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const page = await doctorsService.list({ isActive: true, pageSize: 24 });
        if (cancelled) return;
        setDoctors(page.items);

        // Fetch each doctor's schedules in parallel.
        const results = await Promise.all(
          page.items.map(async (d) => [d.id, await schedulesService.listForDoctor(d.id)] as const),
        );
        if (cancelled) return;
        const map: Record<string, Schedule[]> = {};
        for (const [id, items] of results) map[id] = items;
        setSchedulesByDoctor(map);
      } catch {
        /* silent — section just hides when backend is unreachable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // When there's genuinely nothing to show, don't render the section at all —
  // avoids a sad "no data" state polluting the marketing homepage.
  if (!loading && doctors.length === 0) return null;

  return (
    <section id="availability" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
            {copy.tag}
          </span>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-stone-600">{copy.subtitle}</p>
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-stone-100" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorAvailabilityCard
                key={d.id}
                doctor={d}
                schedules={schedulesByDoctor[d.id] ?? []}
                copy={copy}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DoctorAvailabilityCard({
  doctor, schedules, copy,
}: {
  doctor: Doctor;
  schedules: Schedule[];
  copy: ReturnType<typeof useLang>['t']['availability'];
}) {
  // Group the (possibly multiple) active windows per day of week.
  const byDay = useMemo(() => {
    const map: Record<number, { start: string; end: string }[]> = {};
    for (const s of schedules) {
      if (!s.isActive) continue;
      // Filter out windows whose EffectiveTo is in the past.
      if (s.effectiveTo && new Date(s.effectiveTo) < new Date()) continue;
      const dayNum = dayOfWeekToNumber(s.dayOfWeek);
      (map[dayNum] ??= []).push({ start: s.startTime, end: s.endTime });
    }
    // Sort each day's windows by start time.
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.start.localeCompare(b.start));
    }
    return map;
  }, [schedules]);

  const days = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <header className="bg-gradient-to-br from-rose-50 via-amber-50 to-white px-6 py-5">
        <div className="flex items-center gap-3">
          {doctor.photoUrl ? (
            <ZoomableImage
              src={doctor.photoUrl}
              alt={doctor.fullName}
              caption={`${doctor.fullName} — ${doctor.specializationName}`}
              loading="lazy"
              className="h-11 w-11 flex-shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"
            />
          ) : (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold uppercase text-white">
              {initials(doctor)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg font-medium">{doctor.fullName}</h3>
            <p className="truncate text-xs text-stone-500">{doctor.specializationName}</p>
          </div>
        </div>
      </header>

      <ul className="divide-y divide-stone-100 px-6 py-2 text-sm">
        {days.map((d) => {
          const windows = byDay[d] ?? [];
          const open = windows.length > 0;
          return (
            <li key={d} className="flex items-center justify-between py-2.5">
              <span className={`font-medium ${open ? 'text-stone-900' : 'text-stone-400'}`}>
                {copy.dayShort[d]}
              </span>
              {open ? (
                <span className="text-stone-700">
                  {windows.map((w) => `${w.start}–${w.end}`).join(', ')}
                </span>
              ) : (
                <span className="text-stone-400">{copy.closed}</span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-stone-100 px-6 py-3 text-xs text-stone-500">
        {copy.hint}
      </footer>
    </article>
  );
}

function initials(d: Doctor): string {
  const a = d.firstName?.[0] ?? '';
  const b = d.lastName?.[0]  ?? '';
  return (a + b).toUpperCase() || 'DR';
}
