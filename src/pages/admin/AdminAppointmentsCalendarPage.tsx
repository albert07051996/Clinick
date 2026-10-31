import { useEffect, useMemo, useState } from 'react';
import { appointmentsService, type AppointmentWithContext } from '../../services/api/appointmentsService';
import { doctorsService } from '../../services/api/doctorsService';
import { useLang } from '../../contexts/LanguageContext';
import type { Doctor } from '../../types';
import { formatDayMonth, formatDateShort, formatTime, formatDateTime } from '../../utils/dateFormat';

/* Weekly calendar for admin. 7 columns (Mon→Sun) × hourly rows.
   Each appointment positioned absolutely by (dayOfWeek, startMinutes, duration). */
export default function AdminAppointmentsCalendarPage() {
  const { t } = useLang();
  const copy = t.admin.calendar;
  const dayShort = t.availability.dayShort;   // reuse — "Mon", "Tue", …

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');  // "" = all
  const [weekStart, setWeekStart] = useState<Date>(() => startOfIsoWeek(new Date()));
  const [appts, setAppts] = useState<AppointmentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentWithContext | null>(null);

  useEffect(() => {
    doctorsService.list({ pageSize: 200 })
      .then((r) => setDoctors(r.items))
      .catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    setLoading(true);
    appointmentsService
      .mine({
        from: weekStart.toISOString(),
        to:   weekEnd.toISOString(),
        doctorId: doctorId || undefined,
        pageSize: 500,
      })
      .then((r) => setAppts(r.items))
      .catch(() => setAppts([]))
      .finally(() => setLoading(false));
  }, [weekStart, doctorId]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)),
    [weekStart]);

  // Lay out appointments by day for fast lookup.
  const byDay = useMemo(() => {
    const map: Record<number, AppointmentWithContext[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const a of appts) {
      const dt = new Date(a.scheduledDateTime);
      const idx = Math.floor((dt.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < 7) map[idx].push(a);
    }
    return map;
  }, [appts, weekStart]);

  const prevWeek = () => setWeekStart((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () => setWeekStart((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
  const today    = () => setWeekStart(startOfIsoWeek(new Date()));

  const hourStart = 7, hourEnd = 21; // 7am – 9pm
  const totalMinutes = (hourEnd - hourStart) * 60;
  const rowPx = 48; // 48px per hour

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium">{copy.title}</h1>
      <p className="mt-2 text-stone-600">{copy.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-full border border-stone-200 bg-white shadow-sm">
          <button onClick={prevWeek} className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">←</button>
          <button onClick={today} className="border-x border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">{copy.thisWeek}</button>
          <button onClick={nextWeek} className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">→</button>
        </div>
        <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold">
          {formatDayMonth(weekDays[0])} – {formatDateShort(weekDays[6])}
        </div>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        >
          <option value="">{copy.allDoctors}</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </select>
        {loading && <span className="text-xs text-stone-500">{copy.loading}</span>}
      </div>

      <div className="mt-6 overflow-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="grid min-w-[900px] grid-cols-[64px_repeat(7,_minmax(0,1fr))]">
          {/* corner */}
          <div className="border-b border-r border-stone-200 bg-stone-50" />
          {/* day headers */}
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div key={i} className={`border-b border-r border-stone-200 px-3 py-3 text-center ${isToday ? 'bg-rose-50' : 'bg-stone-50'}`}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{dayShort[d.getDay()]}</div>
                <div className={`mt-0.5 text-lg font-serif ${isToday ? 'text-rose-700 font-medium' : ''}`}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* time gutter + 7 day columns, as a single relatively-positioned grid */}
          <div className="relative border-r border-stone-200" style={{ height: totalMinutes * (rowPx / 60) }}>
            {Array.from({ length: hourEnd - hourStart + 1 }).map((_, h) => (
              <div key={h} className="absolute right-2 text-[10px] text-stone-400" style={{ top: h * rowPx - 6 }}>
                {String(hourStart + h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map((d, i) => (
            <div key={i} className="relative border-r border-stone-200" style={{ height: totalMinutes * (rowPx / 60) }}>
              {/* hour lines */}
              {Array.from({ length: hourEnd - hourStart }).map((_, h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-stone-100" style={{ top: (h + 1) * rowPx }} />
              ))}
              {/* appointments */}
              {(byDay[i] ?? []).map((a) => {
                const dt = new Date(a.scheduledDateTime);
                const mins = (dt.getHours() - hourStart) * 60 + dt.getMinutes();
                if (mins < 0 || mins > totalMinutes) return null;
                const top    = (mins / 60) * rowPx;
                const height = Math.max((a.durationMinutes / 60) * rowPx, 24);
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] shadow-sm transition-shadow hover:shadow-md ${colorForStatus(a.status)}`}
                    style={{ top, height }}
                    title={`${formatTime(dt)} ${a.patientName}`}
                  >
                    <div className="truncate font-semibold">{formatTime(dt)} · {a.patientName}</div>
                    <div className="truncate opacity-80">{a.doctorName}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <AppointmentDetailModal appt={selected} onClose={() => setSelected(null)} copy={copy} />
      )}
    </div>
  );
}

function AppointmentDetailModal({
  appt, onClose, copy,
}: {
  appt: AppointmentWithContext;
  onClose: () => void;
  copy: ReturnType<typeof useLang>['t']['admin']['calendar'];
}) {
  const dt = new Date(appt.scheduledDateTime);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl animate-fade-up">
        <header>
          <h3 className="font-serif text-xl font-medium">{appt.patientName}</h3>
          <p className="text-sm text-stone-500">{appt.doctorName} · {appt.doctorSpecialization}</p>
        </header>
        <dl className="space-y-2 text-sm">
          <KV label={copy.when}     value={formatDateTime(dt)} />
          <KV label={copy.duration} value={`${appt.durationMinutes} min`} />
          <KV label={copy.status}   value={appt.status} />
          {appt.reason && <KV label={copy.reason} value={appt.reason} />}
        </dl>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">{copy.close}</button>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="text-stone-800">{value}</dd>
    </div>
  );
}

/* ─── helpers ─── */
function startOfIsoWeek(d: Date): Date {
  // Monday = start of week.
  const day = d.getDay() || 7;      // Sunday=0 → 7
  const diff = day - 1;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return start;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function colorForStatus(status: string): string {
  switch (status) {
    case 'Scheduled':   return 'bg-indigo-100 text-indigo-900 border-l-4 border-indigo-500';
    case 'Completed':   return 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-500';
    case 'Cancelled':   return 'bg-stone-100 text-stone-600 border-l-4 border-stone-400 line-through';
    case 'NoShow':      return 'bg-amber-100 text-amber-900 border-l-4 border-amber-500';
    case 'Rescheduled': return 'bg-sky-100 text-sky-900 border-l-4 border-sky-500';
    default:            return 'bg-stone-100 text-stone-700 border-l-4 border-stone-400';
  }
}
