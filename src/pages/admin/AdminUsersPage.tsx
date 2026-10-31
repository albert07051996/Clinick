import { useEffect, useMemo, useState } from 'react';
import { usersService } from '../../services/api/usersService';
import { doctorsService } from '../../services/api/doctorsService';
import { useLang } from '../../contexts/LanguageContext';
import { UserRole, type Doctor, type UserListEntry } from '../../types';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';
import { formatDateTime } from '../../utils/dateFormat';

const ROLE_STYLE: Record<string, string> = {
  Admin:   'bg-rose-100 text-rose-800',
  Doctor:  'bg-sky-100 text-sky-800',
  Staff:   'bg-amber-100 text-amber-800',
  Patient: 'bg-stone-100 text-stone-700',
};

export default function AdminUsersPage() {
  const { t } = useLang();
  const u = t.admin.users;

  const [items, setItems] = useState<UserListEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [editing, setEditing] = useState<UserListEntry | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [page, allDocs] = await Promise.all([
        usersService.list({
          search: search || undefined,
          role: roleFilter === 'all' ? undefined : roleFilter,
          pageSize: 100,
        }),
        doctorsService.list({ pageSize: 100 }).then((r) => r.items).catch(() => [] as Doctor[]),
      ]);
      setItems(page.items);
      setDoctors(allDocs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [roleFilter]);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => { void reload(); }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line
  }, [search]);

  const roleLabel = (r: UserRole): string =>
    r === UserRole.Admin ? u.roleAdmin
    : r === UserRole.Doctor ? u.roleDoctor
    : r === UserRole.Staff ? u.roleStaff
    : u.rolePatient;

  const fmtDate = (iso?: string) => iso ? formatDateTime(iso) : u.never;

  // Doctors not already linked to any user — available for linking.
  const linkedDoctorIds = useMemo(
    () => new Set(items.filter((x) => x.doctorId).map((x) => x.doctorId!)),
    [items],
  );

  const toggleActive = async (user: UserListEntry) => {
    if (user.isSelf) { alert(u.cannotEditSelf); return; }
    if (user.isActive && user.isLastAdmin) { alert(u.cannotDemoteLast); return; }
    const confirmMsg = user.isActive ? u.confirmDeact.replace('{name}', user.displayName) : null;
    if (confirmMsg && !confirm(confirmMsg)) return;

    setActingId(user.id);
    try {
      const updated = await usersService.setActive(user.id, !user.isActive);
      setItems((prev) => prev.map((x) => (x.id === user.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader title={u.title} subtitle={u.subtitle} />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={u.search}
          className="w-64 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm">
          {(['all', UserRole.Admin, UserRole.Doctor, UserRole.Staff, UserRole.Patient] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                roleFilter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {f === 'all' ? u.allRoles : roleLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState title={u.emptyTitle} body={u.emptyBody} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3">{u.colUser}</th>
                <th className="px-5 py-3">{u.colEmail}</th>
                <th className="px-5 py-3">{u.colRole}</th>
                <th className="px-5 py-3">{u.colLinked}</th>
                <th className="px-5 py-3">{u.colStatus}</th>
                <th className="px-5 py-3">{u.colLastLogin}</th>
                <th className="px-5 py-3 text-right">{t.admin.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {items.map((user) => (
                <tr key={user.id} className={`hover:bg-stone-50/50 ${user.isSelf ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 font-semibold">
                      {user.username}
                      {user.isSelf && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {u.youTag}
                        </span>
                      )}
                      {user.isGoogleOnly && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                          {u.googleTag}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">{user.displayName}</div>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${ROLE_STYLE[user.role] ?? 'bg-stone-100'}`}>
                        {roleLabel(user.role)}
                      </span>
                      {user.isLastAdmin && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700" title={u.cannotDemoteLast}>
                          🔒 {u.lastAdmin}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500">
                    {user.doctorName ? `👨‍⚕️ ${user.doctorName}` : user.patientName ? `👤 ${user.patientName}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> {u.active}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-500" /> {u.inactive}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500">{fmtDate(user.lastLogin)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setEditing(user)}
                        disabled={user.isSelf}
                        title={user.isSelf ? u.cannotEditSelf : undefined}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {u.editRole}
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={user.isSelf || actingId === user.id || (user.isActive && user.isLastAdmin)}
                        title={user.isSelf ? u.cannotEditSelf : user.isLastAdmin ? u.cannotDemoteLast : undefined}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {user.isActive ? u.deactivate : u.reactivate}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <RoleEditor
          user={editing}
          doctors={doctors}
          linkedDoctorIds={linkedDoctorIds}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Role editor modal ─── */

function RoleEditor({
  user, doctors, linkedDoctorIds, onClose, onSaved,
}: {
  user: UserListEntry;
  doctors: Doctor[];
  linkedDoctorIds: Set<string>;
  onClose: () => void;
  onSaved: (u: UserListEntry) => void;
}) {
  const { t } = useLang();
  const u = t.admin.users;
  const c = t.admin.common;

  const [role, setRole] = useState<UserRole>(user.role);
  const [doctorId, setDoctorId] = useState<string>(user.doctorId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show doctors that are either currently linked to this user (keep) or unlinked.
  const availableDoctors = doctors.filter(
    (d) => d.id === user.doctorId || (d.isActive && !linkedDoctorIds.has(d.id)),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      const updated = await usersService.updateRole(user.id, {
        role,
        doctorId: role === UserRole.Doctor ? doctorId || undefined : undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label={c.cancel} onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="border-b border-stone-200 px-6 py-5">
          <h2 className="font-serif text-xl font-medium">{u.editRole}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {user.username} · {user.email}
          </p>
        </header>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{u.changeRoleTo}</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <option value={UserRole.Admin}>{u.roleAdmin}</option>
              <option value={UserRole.Doctor}>{u.roleDoctor}</option>
              <option value={UserRole.Staff}>{u.roleStaff}</option>
              <option value={UserRole.Patient}>{u.rolePatient}</option>
            </select>
          </label>

          {role === UserRole.Doctor && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-stone-700">{u.linkedDoctor}</span>
                {availableDoctors.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    {u.noUnlinkedDoc}
                  </div>
                ) : (
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="">{u.selectDoctor}</option>
                    {availableDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} — {d.specializationName}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
                💡 {u.doctorHelp}
              </p>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              {c.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || (role === UserRole.Doctor && !doctorId)}
              className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {submitting ? u.saving : u.saveRole}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
