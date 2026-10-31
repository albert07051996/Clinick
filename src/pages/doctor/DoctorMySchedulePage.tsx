import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { schedulesService } from '../../services/api/schedulesService';
import { useLang } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import TimePicker from '../../components/shared/TimePicker';
import { UserRole, type CreateScheduleRequest, type Schedule } from '../../types';
import { dayOfWeekToNumber } from '../../utils/dayOfWeek';

export default function DoctorMySchedulePage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const d = t.doctor;
  const copy = d.mySchedule;

  const doctorId = useDoctorIdForCurrentUser();
  const [list, setList] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!doctorId) return;
    setLoading(true); setError(null);
    try {
      const items = await schedulesService.listForDoctor(doctorId);
      setList(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [doctorId]);

  const grouped = useMemo(() => {
    const m: Record<number, Schedule[]> = {};
    for (const s of list) {
      if (!s.isActive) continue;
      const dayNum = dayOfWeekToNumber(s.dayOfWeek);
      (m[dayNum] ??= []).push(s);
    }
    for (const items of Object.values(m)) items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [list]);

  const [modalDay, setModalDay] = useState<number | null>(null);

  const onCreated = (s: Schedule) => { setList((prev) => [...prev, s]); setModalDay(null); };
  const onDeactivate = async (id: string) => {
    try {
      await schedulesService.deactivate(id);
      setList((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.deleteError);
    }
  };

  const logout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/doctor" className="flex items-center gap-3 text-sm font-semibold text-stone-600 hover:text-rose-700">
            <span>←</span>
            <span>{d.detail.backToSchedule}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <span className="hidden text-sm text-stone-600 sm:inline">{user?.displayName}</span>
            {user?.role === UserRole.Admin && (
              <Link to="/admin" className="hidden rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 sm:inline-block">
                {t.dashboard.adminLink}
              </Link>
            )}
            <button onClick={logout} className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-serif text-4xl font-medium">{copy.title}</h1>
        <p className="mt-2 text-stone-600">{copy.subtitle}</p>

        {!doctorId ? (
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {copy.noDoctorLink}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{error}</div>
        ) : null}

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0,1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />)}
          </div>
        ) : doctorId ? (
          <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[1,2,3,4,5,6,0].map((day) => (
              <li key={day} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-medium">{copy.dayLong[day]}</h3>
                  <button
                    onClick={() => setModalDay(day)}
                    className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    + {copy.addWindow}
                  </button>
                </div>
                {(grouped[day] ?? []).length === 0 ? (
                  <p className="mt-3 text-sm text-stone-400">{copy.closed}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {grouped[day]!.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                        <span>{s.startTime} – {s.endTime} <span className="text-xs text-stone-500">· {s.slotDurationMinutes}{copy.minutes}</span></span>
                        <button
                          onClick={() => void onDeactivate(s.id)}
                          className="rounded-full px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          {copy.remove}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {modalDay !== null && doctorId !== null && (
          <AddScheduleModal
            day={modalDay}
            doctorId={doctorId}
            copy={copy}
            onClose={() => setModalDay(null)}
            onCreated={onCreated}
          />
        )}
      </main>
    </div>
  );
}

function AddScheduleModal({
  day, doctorId, copy, onClose, onCreated,
}: {
  day: number;
  doctorId: string;
  copy: ReturnType<typeof useLang>['t']['doctor']['mySchedule'];
  onClose: () => void;
  onCreated: (s: Schedule) => void;
}) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime,   setEndTime]   = useState('17:00');
  const [slotDurationMinutes, setSlot] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (startTime >= endTime) { setError(copy.badRange); return; }
    setSubmitting(true);
    try {
      const req: CreateScheduleRequest = {
        dayOfWeek: day as 0|1|2|3|4|5|6,
        startTime, endTime,
        slotDurationMinutes,
        effectiveFrom: new Date().toISOString(),
      };
      const created = await schedulesService.createForDoctor(doctorId, req);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md space-y-5 rounded-3xl bg-white p-7 shadow-2xl animate-fade-up">
        <h3 className="font-serif text-xl font-medium">{copy.addFor} <span className="text-rose-700">{copy.dayLong[day]}</span></h3>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{copy.start}</label>
            <TimePicker required value={startTime} onChange={setStartTime} step={15} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{copy.end}</label>
            <TimePicker required value={endTime} onChange={setEndTime} step={15} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{copy.slotDuration}</label>
          <select value={slotDurationMinutes} onChange={(e) => setSlot(Number(e.target.value))}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
            {[15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {copy.minutes}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" disabled={submitting} onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50">
            {copy.cancel}
          </button>
          <button type="submit" disabled={submitting}
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
            {submitting ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Reads the Doctor record linked to the current user via DoctorId on
   LoginResponse.user. Backend sets this when a user is linked to a Doctor
   row (either auto-linked on login or admin-assigned via the Users page). */
function useDoctorIdForCurrentUser(): string | null {
  return authService.getCurrentUser()?.doctorId ?? null;
}
