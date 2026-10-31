import { useEffect, useMemo, useState } from 'react';
import { doctorsService } from '../../services/api/doctorsService';
import { specializationsService } from '../../services/api/specializationsService';
import type { CreateDoctorRequest, Doctor, Specialization } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';
import ImagePicker from '../../components/shared/ImagePicker';
import { formatMoney } from '../../utils/money';

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; doctor: Doctor };

export default function AdminDoctorsPage() {
  const { t, lang } = useLang();
  const d = t.admin.doctor;
  const c = t.admin.common;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });

  const reload = async () => {
    setLoading(true);
    try {
      const [list, specs] = await Promise.all([
        doctorsService.list({ pageSize: 100 }),
        specializationsService.list(),
      ]);
      setDoctors(list.items);
      setSpecializations(specs);
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'active')   return doctors.filter((d) => d.isActive);
    if (filter === 'inactive') return doctors.filter((d) => !d.isActive);
    return doctors;
  }, [doctors, filter]);

  const toggleActive = async (doc: Doctor) => {
    try {
      const updated = await doctorsService.update(doc.id, { isActive: !doc.isActive });
      setDoctors((prev) => prev.map((x) => (x.id === doc.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : d.couldNotUpd);
    }
  };

  const hasNoSpecs = specializations.length === 0;

  return (
    <div>
      <PageHeader
        title={d.title}
        subtitle={d.subtitle}
        action={
          <button
            onClick={() => setEditor({ mode: 'create' })}
            disabled={hasNoSpecs}
            title={hasNoSpecs ? d.needSpecsTip : undefined}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {d.addBtn}
          </button>
        }
      />

      {hasNoSpecs && !loading && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>{d.noSpecsWarn}</strong> {d.noSpecsBody}
          <a href="/admin/specializations" className="ml-2 font-semibold underline">{d.createOne}</a>
        </div>
      )}

      <div className="mt-6 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
        {(['all','active','inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-medium ${
              filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {f === 'all' ? c.all : f === 'active' ? c.active : c.inactive}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState title={d.emptyTitle} body={d.emptyBody} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3">{d.colDoctor}</th>
                <th className="px-5 py-3">{d.colSpec}</th>
                <th className="px-5 py-3">{d.colContact}</th>
                <th className="px-5 py-3">{d.colFee}</th>
                <th className="px-5 py-3">{c.status}</th>
                <th className="px-5 py-3 text-right">{c.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3">
                    <div className="font-semibold">{doc.fullName}</div>
                    {doc.licenseNumber && (
                      <div className="text-xs text-stone-500">{d.licAbbr} {doc.licenseNumber}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                      {doc.specializationName}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    <div className="truncate">{doc.email}</div>
                    <div className="text-xs text-stone-500">{doc.phoneNumber}</div>
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatMoney(doc.consultationFee, lang)}</td>
                  <td className="px-5 py-3">
                    {doc.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{c.activeBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />{c.inactiveBadge}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setEditor({ mode: 'edit', doctor: doc })}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {c.edit}
                      </button>
                      <button
                        onClick={() => toggleActive(doc)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        {doc.isActive ? d.deactivate : d.reactivate}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor.mode !== 'closed' && (
        <DoctorEditor
          initial={editor.mode === 'edit' ? editor.doctor : undefined}
          specializations={specializations}
          onClose={() => setEditor({ mode: 'closed' })}
          onSaved={(saved) => {
            setDoctors((prev) => {
              const i = prev.findIndex((x) => x.id === saved.id);
              return i >= 0 ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
            });
            setEditor({ mode: 'closed' });
          }}
        />
      )}
    </div>
  );
}

/* ─── Editor ─── */

function DoctorEditor({
  initial, specializations, onClose, onSaved,
}: {
  initial?: Doctor;
  specializations: Specialization[];
  onClose: () => void;
  onSaved: (d: Doctor) => void;
}) {
  const { t } = useLang();
  const d = t.admin.doctor;
  const c = t.admin.common;
  const [form, setForm] = useState({
    firstName:         initial?.firstName ?? '',
    lastName:          initial?.lastName ?? '',
    email:             initial?.email ?? '',
    phoneNumber:       initial?.phoneNumber ?? '',
    specializationId:  initial?.specializationId ?? specializations[0]?.id ?? '',
    licenseNumber:     initial?.licenseNumber ?? '',
    licenseExpiryDate: initial?.licenseExpiryDate?.slice(0, 10) ?? '',
    consultationFee:   initial?.consultationFee ?? 0,
    bio:               initial?.bio ?? '',
    photoUrl:          initial?.photoUrl ?? '',
    photoPublicId:     initial?.photoPublicId ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.specializationId) { setError(d.errSelectSpec); return; }
    if (!form.licenseExpiryDate) { setError(d.errExpiry); return; }

    const payload: CreateDoctorRequest = {
      firstName:         form.firstName.trim(),
      lastName:          form.lastName.trim(),
      email:             form.email.trim(),
      phoneNumber:       form.phoneNumber.trim(),
      specializationId:  form.specializationId,
      licenseNumber:     form.licenseNumber.trim(),
      licenseExpiryDate: new Date(`${form.licenseExpiryDate}T00:00:00Z`).toISOString(),
      consultationFee:   Number(form.consultationFee),
      bio:               form.bio.trim() || undefined,
      photoUrl:          form.photoUrl      || '',   // '' tells backend to clear
      photoPublicId:     form.photoPublicId || '',
    };

    setSubmitting(true);
    try {
      const saved = initial
        ? await doctorsService.update(initial.id, payload)
        : await doctorsService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.errSave);
    } finally { setSubmitting(false); }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label={c.cancel} onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-7 py-5">
          <h2 className="font-serif text-2xl font-medium">
            {initial ? d.editTitle : d.newTitle}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 px-7 py-6">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{d.photo}</label>
            <ImagePicker
              folder="doctors"
              value={form.photoUrl || null}
              onChange={(url, pid) => {
                setForm((prev) => ({ ...prev, photoUrl: url ?? '', photoPublicId: pid ?? '' }));
              }}
              previewHeight={180}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text label={d.firstName}  required value={form.firstName} onChange={(v) => change('firstName', v)} />
            <Text label={d.lastName}   required value={form.lastName}  onChange={(v) => change('lastName', v)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text label={d.email}  required type="email" value={form.email}       onChange={(v) => change('email', v)} placeholder={d.emailPh} />
            <Text label={d.phone}  required type="tel"   value={form.phoneNumber} onChange={(v) => change('phoneNumber', v)} placeholder={d.phonePh} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{d.specLabel}</label>
            <select
              value={form.specializationId}
              onChange={(e) => change('specializationId', e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <option value="">{d.selectDots}</option>
              {specializations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Text label={d.licenseNum} required value={form.licenseNumber} onChange={(v) => change('licenseNumber', v)} placeholder={d.licenseNumPh} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{d.licenseExp}</label>
              <input
                type="date" required min={todayIso} lang="en-GB"
                value={form.licenseExpiryDate}
                onChange={(e) => change('licenseExpiryDate', e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{d.fee}</label>
              <input
                type="number" min={0} step={10}
                value={form.consultationFee}
                onChange={(e) => change('consultationFee', e.target.valueAsNumber || 0)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{d.bio}</label>
            <textarea
              value={form.bio} rows={3}
              onChange={(e) => change('bio', e.target.value)}
              placeholder={d.bioPh}
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">{c.cancel}</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {submitting ? c.saving : initial ? d.saveChanges : d.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Minimal text field ─── */

function Text({
  label, value, onChange, placeholder, required = false, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
