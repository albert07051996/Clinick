import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { appointmentsService, type AppointmentWithContext } from '../../services/api/appointmentsService';
import { AppointmentStatus, UserRole } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { formatTime, formatDateShort } from '../../utils/dateFormat';

type Tab = 'today' | 'upcoming' | 'past';

export default function DoctorSchedulePage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const d = t.doctor;

  const [all, setAll] = useState<AppointmentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('today');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    appointmentsService.mine({ pageSize: 200 })
      .then((r) => { if (!cancelled) setAll(r.items); })
      .catch(() => { /* ignore — show empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const buckets = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday   = startOfToday + 24 * 60 * 60 * 1000;

    const today:    AppointmentWithContext[] = [];
    const upcoming: AppointmentWithContext[] = [];
    const past:     AppointmentWithContext[] = [];
    for (const a of all) {
      const ts = new Date(a.scheduledDateTime).getTime();
      if (a.status === AppointmentStatus.Cancelled || a.status === AppointmentStatus.NoShow) {
        past.push(a);
      } else if (a.status === AppointmentStatus.Completed) {
        past.push(a);
      } else if (ts >= startOfToday && ts < endOfToday) {
        today.push(a);
      } else if (ts >= endOfToday) {
        upcoming.push(a);
      } else {
        past.push(a);
      }
    }
    today.sort(   (a, b) => +new Date(a.scheduledDateTime) - +new Date(b.scheduledDateTime));
    upcoming.sort((a, b) => +new Date(a.scheduledDateTime) - +new Date(b.scheduledDateTime));
    past.sort(    (a, b) => +new Date(b.scheduledDateTime) - +new Date(a.scheduledDateTime));
    return { today, upcoming, past };
  }, [all]);

  const visible = buckets[tab];
  const logout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-md shadow-rose-300/40">
              <PetalIcon className="h-5 w-5" />
            </div>
            <span className="font-serif text-lg">
              Aurea <span className="italic font-light text-rose-700">Aesthetics</span>
            </span>
            <span className="ml-3 rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              {d.badge}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <span className="hidden text-sm text-stone-600 sm:inline">{user?.displayName}</span>
            <Link to="/doctor/my-schedule" className="hidden rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 sm:inline-block">
              {d.mySchedule.link}
            </Link>
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-serif text-4xl font-medium leading-tight">
          {d.schedule.greeting} <span className="italic text-rose-700">{user?.displayName?.split(' ')[0]}</span>
        </h1>
        <p className="mt-2 text-stone-600">{d.schedule.subtitle}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={d.schedule.stats.today}     value={buckets.today.length}    gradient="from-rose-500 to-pink-500" />
          <StatCard label={d.schedule.stats.upcoming}  value={buckets.upcoming.length} gradient="from-indigo-500 to-blue-500" />
          <StatCard label={d.schedule.stats.completed} value={buckets.past.filter(a => a.status === 'Completed').length} gradient="from-emerald-500 to-teal-500" />
        </div>

        <div className="mt-10 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
          {(['today','upcoming','past'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-5 py-1.5 font-medium transition-colors ${
                tab === k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {d.schedule.tabs[k]} ({buckets[k].length})
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonList />
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-8 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 font-serif text-xl">{d.schedule.empty[tab]}</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((a) => (
              <AppointmentRow key={a.id} a={a} d={d} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

/* ─── sub-components ─── */

function StatCard({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} px-6 py-5 text-white shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 font-serif text-4xl font-medium">{value}</p>
    </div>
  );
}

function AppointmentRow({ a, d }: { a: AppointmentWithContext; d: ReturnType<typeof useLang>['t']['doctor'] }) {
  const dt = new Date(a.scheduledDateTime);
  const time = formatTime(dt);
  const date = formatDateShort(dt);
  return (
    <li className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-[88px] flex-col items-center rounded-xl bg-stone-50 px-3 py-2 text-center">
        <span className="font-serif text-lg font-medium text-stone-900">{time}</span>
        <span className="text-[11px] uppercase tracking-wider text-stone-500">{date}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate font-serif text-lg font-medium">{a.patientName || '—'}</h3>
        <p className="truncate text-sm text-stone-600">{a.reason || d.schedule.noReason}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{a.durationMinutes} {d.schedule.minutes}</span>
          <span>·</span>
          <StatusChip status={a.status} d={d} />
        </div>
      </div>
      <Link
        to={`/doctor/patients/${a.patientId}?appointmentId=${a.id}`}
        className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
      >
        {d.schedule.open} →
      </Link>
    </li>
  );
}

function StatusChip({ status, d }: { status: AppointmentWithContext['status']; d: ReturnType<typeof useLang>['t']['doctor'] }) {
  const map: Record<string, string> = {
    Scheduled:   'bg-indigo-100 text-indigo-800',
    Completed:   'bg-emerald-100 text-emerald-800',
    Cancelled:   'bg-stone-200 text-stone-700',
    NoShow:      'bg-amber-100 text-amber-800',
    Rescheduled: 'bg-sky-100 text-sky-800',
  };
  const cls = map[status] ?? 'bg-stone-100 text-stone-700';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{d.statuses[status] ?? status}</span>;
}

function SkeletonList() {
  return (
    <ul className="mt-6 space-y-3">
      {[0,1,2].map((i) => (
        <li key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
      ))}
    </ul>
  );
}

type IconProps = { className?: string };
function PetalIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" /></svg>);
}
function CalendarIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>);
}
