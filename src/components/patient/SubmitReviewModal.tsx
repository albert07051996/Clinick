import { useEffect, useState } from 'react';
import { doctorsService } from '../../services/api/doctorsService';
import { proceduresService } from '../../services/api/proceduresService';
import { reviewsService } from '../../services/api/reviewsService';
import { useLang } from '../../contexts/LanguageContext';
import type { Doctor, Procedure } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitReviewModal({ open, onClose, onSubmitted }: Props) {
  const { t } = useLang();
  const copy = t.dashboard.review;
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({ procedureId: '', doctorId: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({ procedureId: '', doctorId: '', comment: '' });
    setRating(5); setHoverRating(0); setDone(false); setError(null);

    void Promise.all([
      proceduresService.list({ isActive: true }).catch(() => []),
      doctorsService.list({ isActive: true, pageSize: 100 }).then((r) => r.items).catch(() => []),
    ]).then(([p, d]) => { setProcedures(p); setDoctors(d); });
  }, [open]);

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
    const comment = form.comment.trim();
    if (comment.length < 10) {
      setError(copy.errMinLength);
      return;
    }
    setSubmitting(true); setError(null);
    try {
      await reviewsService.create({
        procedureId: form.procedureId || undefined,
        doctorId:    form.doctorId || undefined,
        rating,
        comment,
      });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errFallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-[#faf7f4] shadow-2xl animate-fade-up">
        <header className="bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 px-7 py-6 text-white">
          <h2 className="font-serif text-2xl font-medium">{copy.title}</h2>
          <p className="mt-1 text-sm text-stone-200">{copy.subtitle}</p>
        </header>

        {done ? (
          <div className="px-7 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-300/40">
              <CheckIcon className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-2xl font-medium">{copy.successTitle}</h3>
            <p className="mx-auto mt-2 max-w-sm text-stone-600">{copy.successBody}</p>
            <button onClick={onClose} className="mt-7 rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold text-white hover:bg-stone-800">{copy.close}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 px-7 py-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">{copy.rating}</label>
              <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n} type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                    className="p-1"
                  >
                    <StarIcon className={`h-8 w-8 ${n <= (hoverRating || rating) ? 'text-amber-500 fill-current' : 'text-stone-300 fill-current'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.procedure}</label>
                <select value={form.procedureId} onChange={(e) => setForm({ ...form, procedureId: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
                  <option value="">{copy.none}</option>
                  {procedures.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.doctorField}</label>
                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
                  <option value="">{copy.none}</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.experience}</label>
              <textarea
                value={form.comment} rows={5} required
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder={copy.experiencePh}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
              <p className="mt-1 text-xs text-stone-400">{copy.counter.replace('{current}', String(form.comment.length))}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">{copy.cancel}</button>
              <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
                {submitting ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
