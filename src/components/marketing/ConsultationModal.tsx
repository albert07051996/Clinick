import { useEffect, useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { consultationRequestsService } from '../../services/api/consultationRequestsService';
import type { Procedure } from '../../types';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
  /** Catalog shown as selectable chips — pass procedures loaded on the page. */
  procedures?: Procedure[];
  /** Pre-selected procedure id (e.g. when the modal opens from a procedure card). */
  initialProcedureId?: string;
  /** Lead attribution — e.g. "homepage-hero", "doctor-card". */
  source?: string;
}

export default function ConsultationModal({
  open,
  onClose,
  procedures = [],
  initialProcedureId,
  source = 'homepage',
}: ConsultationModalProps) {
  const { t } = useLang();
  const copy = t.modal.consultation;

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', message: '' });
  const [selectedProcedures, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens; seed initial procedure if provided.
  useEffect(() => {
    if (!open) return;
    setForm({ fullName: '', email: '', phone: '', message: '' });
    setSelected(initialProcedureId ? [initialProcedureId] : []);
    setSubmitting(false);
    setDone(false);
    setError(null);
  }, [open, initialProcedureId]);

  // Lock body scroll + Esc to close.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleProcedure = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );

  const change = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await consultationRequestsService.create({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || undefined,
        interestedProcedureIds: selectedProcedures,
        source,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorFallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label={copy.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm"
      />

      {/* panel */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-[#faf7f4] shadow-2xl animate-fade-up">
        <button
          type="button"
          aria-label={copy.close}
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-600 shadow-sm backdrop-blur hover:bg-white hover:text-stone-900"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {done ? (
          <SuccessView title={copy.successTitle} body={copy.successBody} onClose={onClose} closeLabel={copy.close} />
        ) : (
          <div className="max-h-[90vh] overflow-y-auto">
            <header className="bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 px-8 py-10 text-white">
              <h2 className="font-serif text-3xl font-medium leading-tight">{copy.title}</h2>
              <p className="mt-2 text-sm text-stone-200">{copy.subtitle}</p>
            </header>

            <form onSubmit={submit} className="space-y-4 px-8 py-7">
              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Field label={copy.name} required value={form.fullName} onChange={(v) => change('fullName', v)} placeholder={copy.namePh} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field type="email" label={copy.email} required value={form.email} onChange={(v) => change('email', v)} placeholder={copy.emailPh} />
                <Field type="tel"   label={copy.phone} required value={form.phone} onChange={(v) => change('phone', v)} placeholder={copy.phonePh} />
              </div>

              {procedures.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">
                    {copy.interested}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {procedures.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProcedure(p.id)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          selectedProcedures.includes(p.id)
                            ? 'bg-stone-900 text-white'
                            : 'border border-stone-200 bg-white text-stone-600 hover:border-rose-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.message}</label>
                <textarea
                  value={form.message}
                  onChange={(e) => change('message', e.target.value)}
                  placeholder={copy.messagePh}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-stone-900/10 transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                    {copy.loading}
                  </>
                ) : (
                  copy.submit
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── small sub-components ─── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      />
    </div>
  );
}

function SuccessView({ title, body, onClose, closeLabel }: {
  title: string; body: string; onClose: () => void; closeLabel: string;
}) {
  return (
    <div className="px-8 py-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-300/40">
        <CheckIcon className="h-8 w-8" />
      </div>
      <h3 className="font-serif text-2xl font-medium">{title}</h3>
      <p className="mx-auto mt-3 max-w-sm text-stone-600">{body}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-8 rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold text-white hover:bg-stone-800"
      >
        {closeLabel}
      </button>
    </div>
  );
}

/* ─── icons ─── */

type IconProps = { className?: string };

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function SpinnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
function AlertIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}
