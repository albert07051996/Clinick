import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { useLang } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import AuthPanel from '../components/auth/AuthPanel';
import GoogleSignInButton, { isGoogleSignInConfigured } from '../components/auth/GoogleSignInButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.register.pwMismatch);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _unused, ...registerData } = formData;
      void _unused;
      await authService.register(registerData);
      navigate('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || t.auth.register.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900 lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* ─── Form side ─── */}
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-16 sm:px-12 lg:py-20">
        <div className="absolute inset-x-6 top-6 flex items-center justify-between sm:inset-x-12">
          <Link to="/" className="text-sm font-semibold text-stone-600 hover:text-rose-700">
            {t.auth.back}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-lg shadow-rose-300/50">
              <PetalIcon className="h-6 w-6" />
            </div>
            <span className="font-serif text-xl tracking-tight">
              Aurea <span className="italic font-light text-rose-700">Aesthetics</span>
            </span>
          </div>

          <h1 className="mt-10 font-serif text-4xl font-medium leading-tight sm:text-5xl">
            {t.auth.register.title}
          </h1>
          <p className="mt-3 text-stone-600">{t.auth.register.subtitle}</p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isGoogleSignInConfigured() && (
            <>
              <div className="mt-8">
                <GoogleSignInButton
                  text="signup_with"
                  onCredential={async (idToken) => {
                    setError('');
                    setLoading(true);
                    try {
                      await authService.googleLogin(idToken);
                      navigate('/dashboard');
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : '';
                      setError(msg || t.auth.googleError);
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="uppercase tracking-wider">{t.auth.orContinueWith}</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className={`space-y-4 ${isGoogleSignInConfigured() ? '' : 'mt-8'}`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t.auth.register.firstName}
                name="firstName"
                type="text"
                placeholder={t.auth.register.firstNamePh}
                value={formData.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
                icon={<UserIcon className="h-5 w-5" />}
              />
              <Field
                label={t.auth.register.lastName}
                name="lastName"
                type="text"
                placeholder={t.auth.register.lastNamePh}
                value={formData.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
                icon={<UserIcon className="h-5 w-5" />}
              />
            </div>

            <Field
              label={t.auth.register.username}
              name="username"
              type="text"
              placeholder={t.auth.register.usernamePh}
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              icon={<AtIcon className="h-5 w-5" />}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t.auth.register.email}
                name="email"
                type="email"
                placeholder={t.auth.register.emailPh}
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                icon={<MailIcon className="h-5 w-5" />}
              />
              <Field
                label={t.auth.register.phone}
                name="phoneNumber"
                type="tel"
                placeholder={t.auth.register.phonePh}
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                autoComplete="tel"
                icon={<PhoneIcon className="h-5 w-5" />}
              />
            </div>

            <Field
              label={t.auth.register.dob}
              name="dateOfBirth"
              type="date"
              lang="en-GB"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              max={new Date().toISOString().slice(0, 10)}
              autoComplete="bday"
              icon={<CalendarIcon className="h-5 w-5" />}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordField
                label={t.auth.register.password}
                name="password"
                placeholder={t.auth.register.passwordPh}
                value={formData.password}
                onChange={handleChange}
                show={showPw}
                onToggle={() => setShowPw(v => !v)}
                autoComplete="new-password"
                required
              />
              <PasswordField
                label={t.auth.register.confirm}
                name="confirmPassword"
                placeholder={t.auth.register.confirmPh}
                value={formData.confirmPassword}
                onChange={handleChange}
                show={showPw}
                onToggle={() => setShowPw(v => !v)}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-stone-900/10 transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  {t.auth.register.loading}
                </>
              ) : (
                <>
                  {t.auth.register.submit}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-stone-500">{t.auth.register.terms}</p>
          </form>

          <p className="mt-8 text-center text-sm text-stone-600">
            {t.auth.register.haveAccount}{' '}
            <Link to="/login" className="font-semibold text-rose-700 hover:underline">
              {t.auth.register.goLogin}
            </Link>
          </p>
        </div>
      </div>

      {/* ─── Decorative side ─── */}
      <AuthPanel />
    </div>
  );
}

/* ─── Form helpers ─── */

function Field({
  label,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-2xl border border-stone-200 bg-white py-3.5 ${icon ? 'pl-11' : 'pl-4'} pr-4 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-4 focus:ring-rose-100`}
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  show,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
          <LockIcon className="h-5 w-5" />
        </span>
        <input
          {...props}
          type={show ? 'text' : 'password'}
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

/* ─── Inline SVG icons ─── */

type IconProps = { className?: string };

function PetalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" />
    </svg>
  );
}
function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
function AtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9" />
    </svg>
  );
}
function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  );
}
function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function EyeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.5 0-10-7-10-7a19 19 0 0 1 4.2-5M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a19.3 19.3 0 0 1-2.6 3.6M1 1l22 22" />
      <path d="M14.1 14.1A3 3 0 1 1 9.9 9.9" />
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
function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 5l7 7-7 7" />
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
