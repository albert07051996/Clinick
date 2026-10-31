import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { consultationRequestsService } from '../../services/api/consultationRequestsService';
import { doctorsService } from '../../services/api/doctorsService';
import { proceduresService } from '../../services/api/proceduresService';
import { reviewsService } from '../../services/api/reviewsService';
import { specializationsService } from '../../services/api/specializationsService';
import { ConsultationRequestStatus } from '../../types';
import { useLang } from '../../contexts/LanguageContext';

export default function AdminDashboardPage() {
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const d = t.admin.dashboard;
  const [stats, setStats] = useState<{
    procedures: number | null;
    activeProcedures: number | null;
    doctors: number | null;
    activeDoctors: number | null;
    specializations: number | null;
    newLeads: number | null;
    pendingReviews: number | null;
  }>({
    procedures: null, activeProcedures: null,
    doctors: null, activeDoctors: null,
    specializations: null, newLeads: null, pendingReviews: null,
  });

  useEffect(() => {
    void (async () => {
      try {
        const procs = await proceduresService.list({});
        setStats((s) => ({ ...s, procedures: procs.length, activeProcedures: procs.filter((p) => p.isActive).length }));
      } catch { /* ignore */ }

      try {
        const docs = await doctorsService.list({ pageSize: 100 });
        setStats((s) => ({ ...s, doctors: docs.totalCount, activeDoctors: docs.items.filter((d) => d.isActive).length }));
      } catch { /* ignore */ }

      try {
        const specs = await specializationsService.list();
        setStats((s) => ({ ...s, specializations: specs.length }));
      } catch { /* ignore */ }

      try {
        const leads = await consultationRequestsService.list(ConsultationRequestStatus.New, 1, 1);
        setStats((s) => ({ ...s, newLeads: leads.totalCount }));
      } catch { /* ignore */ }

      try {
        const rev = await reviewsService.list({ isApproved: false, pageSize: 1 });
        setStats((s) => ({ ...s, pendingReviews: rev.totalCount }));
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {d.welcome} <span className="italic text-rose-700">{user?.displayName?.split(' ')[0] ?? 'Admin'}</span>
        </h1>
        <p className="mt-1 text-stone-600">{d.subtitle}</p>
      </div>

      {/* Front-desk / action-required KPIs */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          to="/admin/leads"
          label={d.newLeads}
          value={stats.newLeads}
          highlight={stats.newLeads !== null && stats.newLeads > 0}
          gradient="from-rose-500 to-pink-500"
          icon={<InboxIcon />}
        />
        <StatCard
          to="/admin/reviews"
          label={d.pendingReviews}
          value={stats.pendingReviews}
          highlight={stats.pendingReviews !== null && stats.pendingReviews > 0}
          gradient="from-amber-500 to-orange-500"
          icon={<StarIcon />}
        />
        <StatCard
          to="/admin/doctors"
          label={d.activeDoctors}
          value={stats.activeDoctors}
          gradient="from-sky-500 to-indigo-500"
          icon={<UserIcon />}
        />
        <StatCard
          to="/admin/procedures"
          label={d.activeProcs}
          value={stats.activeProcedures}
          gradient="from-fuchsia-500 to-rose-500"
          icon={<SparklesIcon />}
        />
      </div>

      {/* Catalog totals */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard to="/admin/specializations" label={d.specCount}  value={stats.specializations} gradient="from-stone-700 to-stone-900" icon={<TagIcon />} />
        <StatCard to="/admin/doctors"         label={d.allDoctors} value={stats.doctors}         gradient="from-stone-700 to-stone-900" icon={<UserIcon />} />
        <StatCard to="/admin/procedures"      label={d.allProcs}   value={stats.procedures}      gradient="from-stone-700 to-stone-900" icon={<ListIcon />} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickAction
          title={stats.specializations === 0 ? d.startSpec : d.addDoc}
          body={stats.specializations === 0 ? d.startSpecBody : d.addDocBody}
          href={stats.specializations === 0 ? '/admin/specializations' : '/admin/doctors'}
          cta={stats.specializations === 0 ? d.startSpecCta : d.addDocCta}
        />
        <QuickAction
          title={d.triage}
          body={d.triageBody}
          href="/admin/leads"
          cta={d.triageCta}
        />
      </div>
    </div>
  );
}

function StatCard({
  to, label, value, highlight = false, gradient, icon,
}: {
  to: string; label: string; value: number | null; highlight?: boolean; gradient: string; icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
    >
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl transition-opacity group-hover:opacity-20`} />
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
        <span className="h-5 w-5">{icon}</span>
      </div>
      <p className="mt-5 text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-3xl font-medium">
        {value === null ? <span className="text-stone-300">…</span> : value}
        {highlight && value && value > 0 && (
          <span className="ml-2 inline-block h-2 w-2 translate-y-[-6px] rounded-full bg-rose-500" />
        )}
      </p>
    </Link>
  );
}

function QuickAction({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="font-serif text-xl font-medium">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
      <Link
        to={href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rose-700 hover:gap-2 transition-all"
      >
        {cta} →
      </Link>
    </div>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function StarIcon() { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z"/></svg>; }
function SparklesIcon() { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zm7 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/></svg>; }
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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
