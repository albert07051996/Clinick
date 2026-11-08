import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { appointmentsService, type AppointmentWithContext } from '../services/api/appointmentsService';
import { AppointmentStatus, UserRole } from '../types';
import { formatDateWithWeekday, formatTime } from '../utils/dateFormat';
import { useLang } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import BookAppointmentModal from '../components/patient/BookAppointmentModal';
import SubmitReviewModal from '../components/patient/SubmitReviewModal';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const d = t.dashboard;
  const [all, setAll] = useState<AppointmentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookOpen, setBookOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await appointmentsService.mine({ pageSize: 100 });
      setAll(res.items);
    } catch {
      /* ignore — show empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const now = Date.now();
  const buckets = useMemo(() => {
    const upcoming:  AppointmentWithContext[] = [];
    const past:      AppointmentWithContext[] = [];
    const cancelled: AppointmentWithContext[] = [];
    for (const a of all) {
      if (a.status === AppointmentStatus.Cancelled || a.status === AppointmentStatus.NoShow) cancelled.push(a);
      else if (a.status === AppointmentStatus.Completed) past.push(a);
      else if (new Date(a.scheduledDateTime).getTime() < now) past.push(a);
      else upcoming.push(a);
    }
    upcoming.sort((a, b) => +new Date(a.scheduledDateTime) - +new Date(b.scheduledDateTime));
    past.sort((a, b) => +new Date(b.scheduledDateTime) - +new Date(a.scheduledDateTime));
    cancelled.sort((a, b) => +new Date(b.scheduledDateTime) - +new Date(a.scheduledDateTime));
    return { upcoming, past, cancelled };
  }, [all, now]);

  const visible = buckets[tab];

  const requestCancel = (id: string) => { setCancelError(null); setConfirmCancelId(id); };

  const confirmCancel = async () => {
    const id = confirmCancelId;
    if (!id) return;
    setCancelling(id);
    setCancelError(null);
    try {
      const updated = await appointmentsService.cancel(id);
      setAll((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setConfirmCancelId(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : d.appt.couldNotCancel);
    } finally {
      setCancelling(null);
    }
  };

  const logout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-md shadow-rose-300/40">
              <PetalIcon className="h-5 w-5" />
            </div>
            <span className="font-serif text-lg">
              Aurea <span className="italic font-light text-rose-700">Aesthetics</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <span className="hidden text-sm text-stone-600 sm:inline">{user?.displayName}</span>
            {user?.role === UserRole.Admin && (
              <Link
                to="/admin"
                className="hidden rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 sm:inline-block"
              >
                {d.adminLink}
              </Link>
            )}
            <button onClick={logout} className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              {d.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* ─── Greeting ─── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl font-medium leading-tight">
              {d.greeting} <span className="italic text-rose-700">{user?.displayName?.split(' ')[0]}</span>
            </h1>
            <p className="mt-2 text-stone-600">{d.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setReviewOpen(true)}
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              {d.ctaReview}
            </button>
            <button
              onClick={() => setBookOpen(true)}
              className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800"
            >
              {d.ctaBook}
            </button>
          </div>
        </div>

        {/* ─── Stat cards ─── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={d.stats.upcoming}  value={buckets.upcoming.length} gradient="from-rose-500 to-pink-500" />
          <StatCard label={d.stats.completed} value={buckets.past.filter((a) => a.status === 'Completed').length} gradient="from-emerald-500 to-teal-500" />
          <StatCard label={d.stats.cancelled} value={buckets.cancelled.length} gradient="from-stone-700 to-stone-900" />
        </div>

        {/* ─── Tabs ─── */}
        <div className="mt-10 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
          {(['upcoming','past','cancelled'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-5 py-1.5 font-medium transition-colors ${
                tab === k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {d.tabs[k]} ({buckets[k].length})
            </button>
          ))}
        </div>

        {/* ─── List ─── */}
        {loading ? (
          <SkeletonList />
        ) : visible.length === 0 ? (
          <EmptyState
            tab={tab}
            onBook={() => setBookOpen(true)}
            labels={d.empty}
            bookLabel={d.ctaBook}
          />
        ) : (
          <div className="mt-6 space-y-3">
            {visible.map((a) => (
              <AppointmentCard key={a.id} a={a} onCancel={requestCancel} cancelling={cancelling === a.id} d={d} />
            ))}
          </div>
        )}
      </main>

      <BookAppointmentModal open={bookOpen}   onClose={() => setBookOpen(false)}   onBooked={() => void reload()} />
      <SubmitReviewModal    open={reviewOpen} onClose={() => setReviewOpen(false)} onSubmitted={() => { /* no-op */ }} />

      {confirmCancelId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => cancelling === null && setConfirmCancelId(null)}
            className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-up">
            <div className="px-7 pt-6 pb-2">
              <h3 className="font-serif text-xl font-medium text-stone-900">{d.appt.confirmCancel}</h3>
              {cancelError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {cancelError}
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-stone-100 px-5 py-4">
              <button
                type="button"
                disabled={cancelling !== null}
                onClick={() => setConfirmCancelId(null)}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                {d.appt.keep}
              </button>
              <button
                type="button"
                disabled={cancelling !== null}
                onClick={() => void confirmCancel()}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {cancelling !== null ? '…' : d.appt.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── sub-components ─── */

function AppointmentCard({ a, onCancel, cancelling, d }: {
  a: AppointmentWithContext;
  onCancel: (id: string) => void;
  cancelling: boolean;
  d: ReturnType<typeof useLang>['t']['dashboard'];
}) {
  const { formatMoney } = useLang();
  const dt = new Date(a.scheduledDateTime);

  const statusStyle: Record<string, string> = {
    Scheduled:   'bg-rose-100 text-rose-800',
    Completed:   'bg-emerald-100 text-emerald-800',
    Cancelled:   'bg-stone-200 text-stone-700',
    NoShow:      'bg-amber-100 text-amber-800',
    Rescheduled: 'bg-sky-100 text-sky-800',
  };

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-medium">{a.doctorName}</h3>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600">
              {a.doctorSpecialization}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle[a.status] ?? 'bg-stone-100 text-stone-700'}`}>
              {d.status[a.status as keyof typeof d.status] ?? a.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            <span className="font-semibold">{formatDateWithWeekday(dt)}</span>
            {' · '}
            {formatTime(dt)}
            {' · '}
            {a.durationMinutes} {d.appt.minutes}
          </p>
          {a.reason && <p className="mt-2 text-sm italic text-stone-500">"{a.reason}"</p>}
          <p className="mt-2 text-xs text-stone-500">
            {d.appt.fee} <span className="font-semibold text-stone-900">{formatMoney(a.consultationFee)}</span>
            {' · '}{a.isPaid ? d.appt.paid : d.appt.unpaid}
          </p>
        </div>

        <div className="flex gap-2">
          {a.canBeCancelled && (
            <button
              onClick={() => onCancel(a.id)}
              disabled={cancelling}
              className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            >
              {cancelling ? d.appt.cancelling : d.appt.cancel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatCard({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl`} />
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-3xl font-medium">{value}</p>
    </div>
  );
}

function EmptyState({
  tab, onBook, labels, bookLabel,
}: {
  tab: Tab;
  onBook: () => void;
  labels: ReturnType<typeof useLang>['t']['dashboard']['empty'];
  bookLabel: string;
}) {
  const title =
    tab === 'upcoming' ? labels.upcomingTitle :
    tab === 'past'     ? labels.pastTitle :
                         labels.otherTitle;
  const body = tab === 'upcoming' ? labels.upcomingBody : labels.otherBody;
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
        <CalendarIcon className="h-6 w-6" />
      </div>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-stone-500">{body}</p>
      {tab === 'upcoming' && (
        <button onClick={onBook} className="mt-6 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800">
          {bookLabel}
        </button>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/60 shadow-sm" />
      ))}
    </div>
  );
}

/* ─── icons ─── */
type IconProps = { className?: string };
function PetalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" />
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
