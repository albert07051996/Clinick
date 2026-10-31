import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { consultationRequestsService } from '../../services/api/consultationRequestsService';
import { reviewsService } from '../../services/api/reviewsService';
import { ConsultationRequestStatus } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const a = t.admin;
  // reserve the imported `t` for sidebar links too — the users section uses t.admin.users
  const [newLeads, setNewLeads] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);

  // Fetch counts for sidebar badges. Silent failures are fine — badges just hide.
  useEffect(() => {
    consultationRequestsService.list(ConsultationRequestStatus.New, 1, 1)
      .then((r) => setNewLeads(r.totalCount))
      .catch(() => { /* ignore */ });
    reviewsService.list({ isApproved: false, pageSize: 1 })
      .then((r) => setPendingReviews(r.totalCount))
      .catch(() => { /* ignore */ });
  }, []);

  const logout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-md shadow-rose-300/40">
              <PetalIcon className="h-5 w-5" />
            </div>
            <span className="font-serif text-lg">
              Aurea <span className="italic font-light text-rose-700">Admin</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-medium text-stone-600 hover:text-rose-700">
              {a.nav.viewSite}
            </Link>
            <div className="h-6 w-px bg-stone-200" />
            <LanguageSwitcher className="hidden md:inline-flex" />
            <span className="hidden text-sm text-stone-600 lg:inline">
              {user?.displayName}
            </span>
            <button
              onClick={logout}
              className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              {a.nav.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* ─── Sidebar ─── */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-60 shrink-0 border-r border-stone-200 px-4 py-6 md:block">
          <nav className="space-y-1">
            <SidebarLink to="/admin"                    end icon={<HomeIcon />}       label={a.nav.dashboard} />
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{a.nav.clinical}</div>
            <SidebarLink to="/admin/specializations"        icon={<TagIcon />}        label={a.nav.specializations} />
            <SidebarLink to="/admin/doctors"                icon={<UserIcon />}       label={a.nav.doctors} />
            <SidebarLink to="/admin/schedules"              icon={<CalendarIcon />}   label={a.nav.schedules} />
            <SidebarLink to="/admin/patients"               icon={<UsersIcon />}      label={a.nav.patients} />
            <SidebarLink to="/admin/appointments"           icon={<GridIcon />}       label={a.nav.appointments} />
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{a.nav.marketing}</div>
            <SidebarLink to="/admin/procedures"             icon={<SparklesIcon />}   label={a.nav.procedures} />
            <SidebarLink to="/admin/before-after"           icon={<ImageIcon />}      label={a.nav.beforeAfter} />
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{a.nav.frontDesk}</div>
            <SidebarLink to="/admin/leads"                  icon={<InboxIcon />}      label={a.nav.leads}    badge={newLeads ?? undefined} />
            <SidebarLink to="/admin/reviews"                icon={<StarIcon />}       label={a.nav.reviews}  badge={pendingReviews ?? undefined} />
            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">System</div>
            <SidebarLink to="/admin/users"                  icon={<ShieldIcon />}     label={t.admin.users.navLabel} />
          </nav>
        </aside>

        {/* ─── Main content ─── */}
        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to, label, icon, end, badge,
}: {
  to: string; label: string; icon: React.ReactNode; end?: boolean; badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-stone-900 text-white shadow-sm'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`
      }
    >
      <span className="h-4 w-4 flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

/* ─── Icons ─── */

type IconProps = { className?: string };
function PetalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zm7 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41L13 21l-9-9V4h8l8 8a2 2 0 0 1 0 2.83" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
