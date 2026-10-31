import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { useLang } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import AuthPanel from '../components/auth/AuthPanel';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const copy = t.auth.reset;
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail]       = useState(params.get('email') ?? '');
  const [code, setCode]         = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 4 || !/^\d{4}$/.test(code)) { setError(copy.codeInvalid); return; }
    if (password.length < 8) { setError(copy.pwShort); return; }
    if (password !== confirm) { setError(copy.pwMismatch); return; }

    setSubmitting(true);
    try {
      await authService.resetPassword(email.trim(), code, password);
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
            {t.auth.back}
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
                onClick={() => navigate('/login')}
                className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-stone-800"
              >
                {copy.goLogin}
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
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.email}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                      <MailIcon className="h-5 w-5" />
                    </span>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={copy.emailPh}
                      autoComplete="email"
                      className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-4 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>
                </div>

                {/* 4-digit code */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">{copy.code}</label>
                  <input
                    type="text" required inputMode="numeric" pattern="\d{4}" maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={copy.codePh}
                    autoComplete="one-time-code"
                    className="w-full rounded-2xl border border-stone-200 bg-white py-4 text-center text-2xl font-serif tracking-[0.5em] placeholder-stone-300 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <PasswordField
                  label={copy.password} placeholder={copy.passwordPh}
                  value={password} onChange={setPassword}
                  show={showPw} onToggle={() => setShowPw(v => !v)}
                />
                <PasswordField
                  label={copy.confirm} placeholder={copy.confirmPh}
                  value={confirm} onChange={setConfirm}
                  show={showPw} onToggle={() => setShowPw(v => !v)}
                />

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

                <p className="text-center text-sm text-stone-500">
                  {copy.noCode}{' '}
                  <Link to={`/forgot-password?email=${encodeURIComponent(email)}`} className="font-semibold text-rose-700 hover:underline">
                    {copy.requestAgain}
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      <AuthPanel />
    </div>
  );
}

function PasswordField({
  label, placeholder, value, onChange, show, onToggle,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
          <LockIcon className="h-5 w-5" />
        </span>
        <input
          type={show ? 'text' : 'password'}
          required minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-12 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-700"
        >
          {show ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

/* ─── Icons ─── */
type IconProps = { className?: string };
function PetalIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" /></svg>);
}
function MailIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
}
function LockIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
}
function EyeIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);
}
function EyeOffIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.5 0-10-7-10-7a19 19 0 0 1 4.2-5M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a19.3 19.3 0 0 1-2.6 3.6M1 1l22 22" /><path d="M14.1 14.1A3 3 0 1 1 9.9 9.9" /></svg>);
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
