import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { useLang } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import AuthPanel from '../components/auth/AuthPanel';

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const copy = t.auth.forgot;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || copy.fallbackError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900 lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-16 sm:px-12 lg:py-20">
        <div className="absolute inset-x-6 top-6 flex items-center justify-between sm:inset-x-12">
          <Link to="/login" className="text-sm font-semibold text-stone-600 hover:text-rose-700">
            {copy.backToLogin}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-lg shadow-rose-300/50">
              <PetalIcon className="h-6 w-6" />
            </div>
            <span className="font-serif text-xl tracking-tight">
              Aurea <span className="italic font-light text-rose-700">Aesthetics</span>
            </span>
          </div>

          <h1 className="mt-10 font-serif text-4xl font-medium leading-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-stone-600">{copy.subtitle}</p>

          {done ? (
            <div className="mt-8">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm text-emerald-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-emerald-900">{copy.successTitle}</h3>
                    <p className="mt-1 text-emerald-800">{copy.successBody}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-stone-800"
              >
                {copy.goReset}
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">
                    {copy.email}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                      <MailIcon className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={copy.emailPh}
                      autoComplete="email"
                      className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-4 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-stone-900/10 transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none"
                >
                  {submitting ? (
                    <>
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                      {copy.submitting}
                    </>
                  ) : (
                    copy.submit
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <AuthPanel />
    </div>
  );
}

/* ─── Inline SVG icons ─── */
type IconProps = { className?: string };
function PetalIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" /></svg>);
}
function MailIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
}
function AlertIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>);
}
function CheckIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12l5 5L20 7" /></svg>);
}
function SpinnerIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>);
}
