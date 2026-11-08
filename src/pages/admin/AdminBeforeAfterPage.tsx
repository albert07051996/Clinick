import { useEffect, useRef, useState } from 'react';
import { beforeAfterCasesService } from '../../services/api/beforeAfterCasesService';
import { doctorsService } from '../../services/api/doctorsService';
import { filesService } from '../../services/api/filesService';
import { proceduresService } from '../../services/api/proceduresService';
import type { BeforeAfterCase, CreateBeforeAfterRequest, Doctor, Procedure } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';
import ZoomableImage from '../../components/shared/ZoomableImage';
import { MultilingualTextField } from '../../components/shared/MultilingualInputs';

export default function AdminBeforeAfterPage() {
  const { t, pickI18n } = useLang();
  const ba = t.admin.ba;
  const c = t.admin.common;
  const [items, setItems] = useState<BeforeAfterCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BeforeAfterCase | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const reload = async () => {
    setLoading(true);
    try {
      const data = await beforeAfterCasesService.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);

  const filtered = items.filter((c) =>
    filter === 'all' ? true :
    filter === 'published' ? c.isPublished :
    !c.isPublished);

  const togglePublish = async (caseItem: BeforeAfterCase) => {
    if (!caseItem.isPublished && !caseItem.hasPatientConsent) {
      alert(ba.needConsent);
      return;
    }
    try {
      const updated = await beforeAfterCasesService.update(caseItem.id, { isPublished: !caseItem.isPublished });
      setItems((prev) => prev.map((x) => (x.id === caseItem.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : ba.couldNotUpd);
    }
  };

  const deleteCase = async (caseItem: BeforeAfterCase) => {
    if (!confirm(ba.confirmDelete.replace('{title}', pickI18n(caseItem.title, caseItem.titleRu, caseItem.titleEn)))) return;
    try {
      await beforeAfterCasesService.delete(caseItem.id);
      setItems((prev) => prev.filter((x) => x.id !== caseItem.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : ba.couldNotUpd);
    }
  };

  return (
    <div>
      <PageHeader
        title={ba.title}
        subtitle={ba.subtitle}
        action={
          <button
            onClick={() => { setEditing(null); setEditorOpen(true); }}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800"
          >
            {ba.addBtn}
          </button>
        }
      />

      <div className="mt-6 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
        {(['all','draft','published'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-medium ${
              filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {f === 'all' ? c.all : f === 'draft' ? ba.draft : ba.live}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState title={ba.emptyTitle} body={ba.emptyBody} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((caseItem) => {
            const title = pickI18n(caseItem.title, caseItem.titleRu, caseItem.titleEn);
            const procedureName = pickI18n(caseItem.procedureName, caseItem.procedureNameRu, caseItem.procedureNameEn);
            return (
            <article key={caseItem.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="grid grid-cols-2">
                <div className="relative aspect-square bg-stone-100">
                  <ZoomableImage src={caseItem.beforeImageUrl} alt={`${ba.before} — ${title}`} caption={`${ba.before} — ${title}`} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-800 backdrop-blur">{ba.before}</span>
                </div>
                <div className="relative aspect-square bg-stone-100">
                  <ZoomableImage src={caseItem.afterImageUrl} alt={`${ba.after} — ${title}`} caption={`${ba.after} — ${title}`} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{ba.after}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{title}</h3>
                    <p className="truncate text-xs text-stone-500">
                      {procedureName}{caseItem.doctorName && ` · ${caseItem.doctorName}`} · {caseItem.monthsAfter} {ba.moPostOp}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {caseItem.isPublished ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">{ba.live}</span>
                    ) : (
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">{ba.draft}</span>
                    )}
                    {caseItem.hasPatientConsent ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">{ba.consentOk}</span>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">{ba.noConsent}</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setEditing(caseItem); setEditorOpen(true); }} className="flex-1 rounded-full border border-stone-200 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                    {c.edit}
                  </button>
                  <button onClick={() => togglePublish(caseItem)} className="flex-1 rounded-full bg-stone-900 py-1.5 text-xs font-semibold text-white hover:bg-stone-800">
                    {caseItem.isPublished ? ba.unpublish : ba.publish}
                  </button>
                  <button onClick={() => deleteCase(caseItem)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                    {c.delete}
                  </button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {editorOpen && (
        <BeforeAfterEditor
          initial={editing}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSaved={() => { void reload(); setEditorOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

/* ─── Editor with 2-image upload ─── */

function BeforeAfterEditor({
  initial, onClose, onSaved,
}: {
  initial: BeforeAfterCase | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, pickI18n } = useLang();
  const ba = t.admin.ba;
  const c = t.admin.common;
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    procedureId:       initial?.procedureId       ?? '',
    doctorId:          initial?.doctorId          ?? '',
    title:             initial?.title             ?? '',
    titleRu:           initial?.titleRu           ?? '',
    titleEn:           initial?.titleEn           ?? '',
    monthsAfter:       initial?.monthsAfter       ?? 6,
    caption:           initial?.caption           ?? '',
    captionRu:         initial?.captionRu         ?? '',
    captionEn:         initial?.captionEn         ?? '',
    hasPatientConsent: initial?.hasPatientConsent ?? false,
    publishAfterSave:  false,
  });
  const [beforeImg, setBeforeImg] = useState<{ url: string; publicId: string } | null>(
    initial ? { url: initial.beforeImageUrl, publicId: '' } : null,
  );
  const [afterImg, setAfterImg] = useState<{ url: string; publicId: string } | null>(
    initial ? { url: initial.afterImageUrl, publicId: '' } : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      proceduresService.list({ isActive: true }).catch(() => []),
      doctorsService.list({ isActive: true, pageSize: 100 }).then((r) => r.items).catch(() => []),
    ]).then(([p, d]) => { setProcedures(p); setDoctors(d); });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.procedureId)      return setError(ba.errProc);
    if (!form.title.trim())     return setError(ba.errTitle);
    if (!beforeImg || !afterImg) return setError(ba.errImages);
    if (form.publishAfterSave && !form.hasPatientConsent)
      return setError(ba.errConsent);

    setSubmitting(true);
    try {
      const payload: CreateBeforeAfterRequest = {
        procedureId:         form.procedureId,
        doctorId:            form.doctorId || undefined,
        title:               form.title.trim(),
        titleRu:             form.titleRu.trim()   || undefined,
        titleEn:             form.titleEn.trim()   || undefined,
        monthsAfter:         Number(form.monthsAfter) || 0,
        beforeImageUrl:      beforeImg.url,
        beforeImagePublicId: beforeImg.publicId || undefined,
        afterImageUrl:       afterImg.url,
        afterImagePublicId:  afterImg.publicId || undefined,
        caption:             form.caption.trim()   || undefined,
        captionRu:           form.captionRu.trim() || undefined,
        captionEn:           form.captionEn.trim() || undefined,
        hasPatientConsent:   form.hasPatientConsent,
      };

      if (initial) {
        await beforeAfterCasesService.update(initial.id, payload);
        if (form.publishAfterSave) {
          await beforeAfterCasesService.update(initial.id, { isPublished: true });
        }
      } else {
        const created = await beforeAfterCasesService.create(payload);
        if (form.publishAfterSave) {
          await beforeAfterCasesService.update(created.id, { isPublished: true });
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : ba.errSave);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label={c.cancel} onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-7 py-5">
          <h2 className="font-serif text-2xl font-medium">
            {initial ? ba.editTitle : ba.newTitle}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-5 px-7 py-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ImageDropzone label={ba.beforeImg} value={beforeImg} onChange={setBeforeImg} folder="before-after/before" />
            <ImageDropzone label={ba.afterImg}  value={afterImg}  onChange={setAfterImg}  folder="before-after/after" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label={ba.procedure} value={form.procedureId}
              onChange={(v) => setForm({ ...form, procedureId: v })}
              options={[
                { value: '', label: ba.selectDots },
                ...procedures.map((p) => ({ value: p.id, label: pickI18n(p.name, p.nameRu, p.nameEn) })),
              ]}
            />
            <SelectField
              label={ba.surgeonOpt} value={form.doctorId}
              onChange={(v) => setForm({ ...form, doctorId: v })}
              options={[{ value: '', label: ba.none }, ...doctors.map((d) => ({ value: d.id, label: d.fullName }))]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <MultilingualTextField
              label={ba.titleStar}
              required
              placeholder={ba.titlePh}
              ka={form.title}
              ru={form.titleRu}
              en={form.titleEn}
              onChange={(lang, v) =>
                setForm((prev) => ({
                  ...prev,
                  ...(lang === 'ka' ? { title: v } : lang === 'ru' ? { titleRu: v } : { titleEn: v }),
                }))
              }
            />
            <NumberField label={ba.months} value={form.monthsAfter} onChange={(v) => setForm({ ...form, monthsAfter: v })} />
          </div>
          <p className="-mt-3 text-xs text-stone-500">{c.langHint}</p>

          <MultilingualTextField
            as="textarea"
            rows={2}
            label={ba.captionOpt}
            ka={form.caption}
            ru={form.captionRu}
            en={form.captionEn}
            onChange={(lang, v) =>
              setForm((prev) => ({
                ...prev,
                ...(lang === 'ka' ? { caption: v } : lang === 'ru' ? { captionRu: v } : { captionEn: v }),
              }))
            }
          />

          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3">
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.hasPatientConsent}
                onChange={(e) => setForm({ ...form, hasPatientConsent: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
              />
              <span>
                <strong>{ba.consentCheck}</strong>
                <span className="mt-1 block text-xs text-stone-500">{ba.consentHelp}</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.publishAfterSave}
                onChange={(e) => setForm({ ...form, publishAfterSave: e.target.checked })}
                disabled={!form.hasPatientConsent}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500 disabled:opacity-50"
              />
              <span>{ba.publishNow}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">{c.cancel}</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {submitting ? c.saving : initial ? ba.saveChanges : ba.createCase}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Image dropzone — reuses filesService.uploadImage() ─── */

function ImageDropzone({
  label, value, onChange, folder,
}: {
  label: string;
  value: { url: string; publicId: string } | null;
  onChange: (v: { url: string; publicId: string } | null) => void;
  folder: string;
}) {
  const { t } = useLang();
  const ba = t.admin.ba;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErr(null); setProgress(0); setUploading(true);
    try {
      const res = await filesService.uploadImage(file, { folder, onProgress: setProgress });
      if (!res.success || !res.secureUrl) {
        setErr(res.error ?? ba.uploadFailed);
        return;
      }
      onChange({ url: res.secureUrl, publicId: res.publicId ?? '' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : ba.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
      />
      {value?.url ? (
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200">
          <img src={value.url} alt="" className="h-48 w-full object-cover" />
          <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-stone-900/0 text-white opacity-0 transition-all hover:bg-stone-900/60 hover:opacity-100">
            {ba.uploadReplace}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white text-stone-500 hover:border-rose-400 hover:bg-rose-50/40 hover:text-rose-700"
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-32 text-center">
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs">{ba.uploading} {progress}%</p>
            </div>
          ) : (
            <>
              <UploadIcon className="mb-2 h-6 w-6" />
              <span className="text-sm font-semibold">{ba.uploadClick}</span>
              <span className="mt-0.5 text-xs">{ba.uploadHint}</span>
            </>
          )}
        </button>
      )}
      {err && <p className="mt-1 text-xs text-rose-700">{err}</p>}
    </div>
  );
}

/* ─── Shared mini form fields (local copies so file is self-contained) ─── */

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <input
        type="number" value={value}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}
function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}
