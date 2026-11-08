import { useEffect, useState } from 'react';
import { appointmentsService } from '../../services/api/appointmentsService';
import { doctorsService } from '../../services/api/doctorsService';
import { useLang } from '../../contexts/LanguageContext';
import TimePicker from '../shared/TimePicker';
import type { Doctor } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;    // parent reloads list
}

export default function BookAppointmentModal({ open, onClose, onBooked }: Props) {
  const { t, formatMoney } = useLang();
  const copy = t.dashboard.book;
  // We standardize ALL date/time inputs to en-GB (24h + dd/mm/yyyy) regardless
  // of UI language — see src/utils/dateFormat.ts for the project-wide decision.
  const inputLocale = 'en-GB';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    doctorId: '', date: '', time: '', durationMinutes: 30, reason: '',
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({ doctorId: '', date: '', time: '', durationMinutes: 30, reason: '' });
    setLoading(true);
    doctorsService.list({ isActive: true, pageSize: 100 })
      .then((r) => setDoctors(r.items))
      .catch(() => setError(copy.errLoad))
      .finally(() => setLoading(false));
  }, [open, copy.errLoad]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.doctorId || !form.date || !form.time) {
      setError(copy.errMissing);
      return;
    }
    // Combine local date+time → UTC ISO.
    const scheduled = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(scheduled.valueOf())) {
      setError(copy.errInvalidDate);
      return;
    }
    setSubmitting(true);
    try {
      await appointmentsService.create({
        doctorId: form.doctorId,
        scheduledDateTime: scheduled.toISOString(),
        durationMinutes: form.durationMinutes,
        reason: form.reason.trim() || undefined,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errFallback);
    } finally {
      setSubmitting(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl bg-[#faf7f4] shadow-2xl animate-fade-up">
        <header className="bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 px-7 py-6 text-white">
          <h2 className="font-serif text-2xl font-medium">{copy.title}</h2>
          <p className="mt-1 text-sm text-stone-200">{copy.subtitle}</p>
        </header>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-7 py-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.surgeon}</label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              required
              disabled={loading}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:opacity-50"
            >
              <option value="">{loading ? copy.loading : copy.select}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.specializationName} ({formatMoney(d.consultationFee)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.date}</label>
              <input
                type="date" required min={todayIso} value={form.date}
                lang={inputLocale}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.time}</label>
              <TimePicker
                required
                value={form.time}
                onChange={(v) => setForm({ ...form, time: v })}
                step={15}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.duration}</label>
            <select
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {t.dashboard.appt.minutes}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.reason}</label>
            <textarea
              value={form.reason} rows={3}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder={copy.reasonPh}
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">{copy.cancel}</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {submitting ? copy.submitting : copy.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
