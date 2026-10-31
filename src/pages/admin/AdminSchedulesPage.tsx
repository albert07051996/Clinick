import { useEffect, useMemo, useState } from 'react';
import { doctorsService } from '../../services/api/doctorsService';
import { schedulesService } from '../../services/api/schedulesService';
import { useLang } from '../../contexts/LanguageContext';
import TimePicker from '../../components/shared/TimePicker';
import type { CreateScheduleRequest, Doctor, Schedule } from '../../types';
import { dayOfWeekToNumber } from '../../utils/dayOfWeek';

/* Admin can see & edit every doctor's weekly working hours. The schedules
   endpoints are shared with the Doctor Portal — Admin bypasses CallerOwnsDoctor. */
export default function AdminSchedulesPage() {
  const { t } = useLang();
  const copy = t.admin.schedules;
  const mycopy = t.doctor.mySchedule;   // reuse day labels + modal copy

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalDay, setModalDay] = useState<number | null>(null);

  useEffect(() => {
    setLoadingDoctors(true);
    doctorsService.list({ pageSize: 200 })
      .then((r) => { setDoctors(r.items); if (r.items[0]) setSelectedId(r.items[0].id); })
      .catch((e) => setError(e instanceof Error ? e.message : copy.loadError))
      .finally(() => setLoadingDoctors(false));
  }, [copy.loadError]);

  useEffect(() => {
    if (!selectedId) { setSchedules([]); return; }
    setLoadingSchedules(true); setError(null);
    schedulesService.listForDoctor(selectedId)
      .then(setSchedules)
      .catch((e) => setError(e instanceof Error ? e.message : copy.loadError))
      .finally(() => setLoadingSchedules(false));
  }, [selectedId, copy.loadError]);

  const grouped = useMemo(() => {
    const m: Record<number, Schedule[]> = {};
    for (const s of schedules) {
      if (!s.isActive) continue;
      const dayNum = dayOfWeekToNumber(s.dayOfWeek);
      (m[dayNum] ??= []).push(s);
    }
    for (const items of Object.values(m)) items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [schedules]);

  const onCreated = (s: Schedule) => { setSchedules((prev) => [...prev, s]); setModalDay(null); };
  const onDeactivate = async (id: string) => {
    try {
      await schedulesService.deactivate(id);
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : mycopy.deleteError);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedId);

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium">{copy.title}</h1>
      <p className="mt-2 text-stone-600">{copy.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Doctor picker */}
        <aside className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500">{copy.pickDoctor}</label>
          {loadingDoctors ? (
            <div className="h-10 animate-pulse rounded-xl bg-stone-100" />
          ) : doctors.length === 0 ? (
            <p className="text-sm text-stone-500">{copy.noDoctors}</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {doctors.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedId === d.id ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-medium">{d.fullName}</div>
                    <div className={`text-xs ${selectedId === d.id ? 'text-stone-300' : 'text-stone-500'}`}>{d.specializationName}</div>
                    {!d.isActive && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedId === d.id ? 'bg-stone-700' : 'bg-stone-200 text-stone-700'}`}>
                        {copy.inactive}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Weekly grid */}
        <section>
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}
          {!selectedId ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-stone-500">
              {copy.pickHint}
            </div>
          ) : loadingSchedules ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[0,1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />)}
            </div>
          ) : (
            <>
              {selectedDoctor && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50 to-white px-5 py-4">
                  <div>
                    <h2 className="font-serif text-xl font-medium">{selectedDoctor.fullName}</h2>
                    <p className="text-xs text-stone-500">{selectedDoctor.specializationName}</p>
                  </div>
                </div>
              )}
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[1,2,3,4,5,6,0].map((day) => (
                  <li key={day} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-medium">{mycopy.dayLong[day]}</h3>
                      <button
                        onClick={() => setModalDay(day)}
                        className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        + {mycopy.addWindow}
                      </button>
                    </div>
                    {(grouped[day] ?? []).length === 0 ? (
                      <p className="mt-3 text-sm text-stone-400">{mycopy.closed}</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {grouped[day]!.map((s) => (
                          <li key={s.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                            <span>{s.startTime} – {s.endTime} <span className="text-xs text-stone-500">· {s.slotDurationMinutes}{mycopy.minutes}</span></span>
                            <button
                              onClick={() => void onDeactivate(s.id)}
                              className="rounded-full px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              {mycopy.remove}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {modalDay !== null && selectedId && (
        <AddScheduleModal
          day={modalDay}
          doctorId={selectedId}
          copy={mycopy}
          onClose={() => setModalDay(null)}
          onCreated={onCreated}
        />
      )}
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
  const [slot, setSlot] = useState(30);
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
        slotDurationMinutes: slot,
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
          <select value={slot} onChange={(e) => setSlot(Number(e.target.value))}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
            {[15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {copy.minutes}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" disabled={submitting} onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50">{copy.cancel}</button>
          <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
            {submitting ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </div>
  );
}
