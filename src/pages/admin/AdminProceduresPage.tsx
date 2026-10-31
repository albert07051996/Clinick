import { useEffect, useMemo, useState } from 'react';
import { proceduresService } from '../../services/api/proceduresService';
import type { CreateProcedureRequest, Procedure, ProcedureCategory } from '../../types';
import { ProcedureCategory as Categories } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import ImagePicker from '../../components/shared/ImagePicker';
import ZoomableImage from '../../components/shared/ZoomableImage';
import { formatMoney } from '../../utils/money';

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; procedure: Procedure };

export default function AdminProceduresPage() {
  const { t, lang } = useLang();
  const p = t.admin.procedure;
  const c = t.admin.common;
  const [items, setItems] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const catLabel = (cat: ProcedureCategory): string =>
    cat === Categories.Face ? p.catFace
    : cat === Categories.Body ? p.catBody
    : p.catNonSurgical;

  const reload = async () => {
    setLoading(true);
    try {
      // Pass no isActive filter: admin wants to see everything.
      const data = await proceduresService.list({});
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'active')   return items.filter((p) => p.isActive);
    if (filter === 'inactive') return items.filter((p) => !p.isActive);
    return items;
  }, [items, filter]);

  const onCreated = (p: Procedure) => { setItems((prev) => [...prev, p]); setEditor({ mode: 'closed' }); };
  const onUpdated = (p: Procedure) => {
    setItems((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setEditor({ mode: 'closed' });
  };

  const toggleActive = async (proc: Procedure) => {
    try {
      const updated = await proceduresService.update(proc.id, { isActive: !proc.isActive });
      setItems((prev) => prev.map((x) => (x.id === proc.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : p.couldNotUpd);
    }
  };

  return (
    <div>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        action={
          <button
            onClick={() => setEditor({ mode: 'create' })}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800"
          >
            {p.addBtn}
          </button>
        }
      />

      <div className="mt-6 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
        {(['all', 'active', 'inactive'] as const).map((f) => (
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
        <EmptyState title={p.emptyTitle} body={p.emptyBody} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="w-20 px-5 py-3">{p.colImage}</th>
                <th className="px-5 py-3">{c.name}</th>
                <th className="px-5 py-3">{p.colCategory}</th>
                <th className="px-5 py-3">{p.colFrom}</th>
                <th className="px-5 py-3">{p.colOrder}</th>
                <th className="px-5 py-3">{c.status}</th>
                <th className="px-5 py-3 text-right">{c.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filtered.map((proc) => (
                <tr key={proc.id} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3">
                    {proc.imageUrl ? (
                      <ZoomableImage
                        src={proc.imageUrl}
                        alt={proc.name}
                        caption={proc.name}
                        className="h-12 w-12 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-400">—</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-semibold">{proc.name}</div>
                    <div className="text-xs text-stone-500">/{proc.slug}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                      {catLabel(proc.category)}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatMoney(proc.basePrice, lang)}</td>
                  <td className="px-5 py-3 text-stone-500">{proc.displayOrder}</td>
                  <td className="px-5 py-3">
                    {proc.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {c.activeBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
                        {c.inactiveBadge}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setEditor({ mode: 'edit', procedure: proc })}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {c.edit}
                      </button>
                      <button
                        onClick={() => toggleActive(proc)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        {proc.isActive ? p.deactivate : p.reactivate}
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
        <ProcedureEditor
          initial={editor.mode === 'edit' ? editor.procedure : undefined}
          onClose={() => setEditor({ mode: 'closed' })}
          onCreated={onCreated}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}

/* ─── Editor modal ─── */

function ProcedureEditor({
  initial,
  onClose,
  onCreated,
  onUpdated,
}: {
  initial?: Procedure;
  onClose: () => void;
  onCreated: (p: Procedure) => void;
  onUpdated: (p: Procedure) => void;
}) {
  const { t } = useLang();
  const p = t.admin.procedure;
  const c = t.admin.common;
  const [form, setForm] = useState({
    name:             initial?.name ?? '',
    slug:             initial?.slug ?? '',
    category:         initial?.category ?? Categories.Face as ProcedureCategory,
    basePrice:        initial?.basePrice ?? 0,
    durationMinutes:  initial?.durationMinutes ?? 60,
    recoveryDays:     initial?.recoveryDays ?? 0,
    shortDescription: initial?.shortDescription ?? '',
    description:      initial?.description ?? '',
    imageUrl:         initial?.imageUrl ?? '',
    displayOrder:     initial?.displayOrder ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateProcedureRequest = {
        name:             form.name.trim(),
        slug:             form.slug.trim() || undefined,
        category:         form.category,
        basePrice:        Number(form.basePrice),
        durationMinutes:  Number(form.durationMinutes),
        recoveryDays:     Number(form.recoveryDays),
        shortDescription: form.shortDescription.trim() || undefined,
        description:      form.description.trim() || undefined,
        imageUrl:         form.imageUrl.trim() || undefined,
        displayOrder:     Number(form.displayOrder),
      };
      if (initial) {
        const updated = await proceduresService.update(initial.id, payload);
        onUpdated(updated);
      } else {
        const created = await proceduresService.create(payload);
        onCreated(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : p.couldNotUpd);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label={c.cancel} onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/50 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-7 py-5">
          <h2 className="font-serif text-2xl font-medium">
            {initial ? p.editTitle : p.newTitle}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 px-7 py-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <TextField label={c.name}  value={form.name} onChange={(v) => change('name', v)}   required placeholder={p.namePh} />
            <TextField label={p.slug}  value={form.slug} onChange={(v) => change('slug', v)} placeholder={p.slugPh} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <SelectField label={p.colCategory} value={form.category} onChange={(v) => change('category', v as ProcedureCategory)}
              options={[
                { value: Categories.Face,        label: p.catFace },
                { value: Categories.Body,        label: p.catBody },
                { value: Categories.NonSurgical, label: p.catNonSurgical },
              ]} />
            <NumberField label={p.basePrice}    value={form.basePrice}       onChange={(v) => change('basePrice', v)} />
            <NumberField label={p.durationMin}  value={form.durationMinutes} onChange={(v) => change('durationMinutes', v)} />
            <NumberField label={p.recoveryDays} value={form.recoveryDays}    onChange={(v) => change('recoveryDays', v)} />
          </div>

          <TextField  label={p.shortDesc} value={form.shortDescription} onChange={(v) => change('shortDescription', v)} placeholder={p.shortDescPh} />
          <TextArea   label={p.fullDesc}  value={form.description}      onChange={(v) => change('description', v)}      rows={4} />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">{p.imageUrl}</label>
            <ImagePicker
              folder="procedures"
              value={form.imageUrl || null}
              onChange={(url) => change('imageUrl', url ?? '')}
              previewHeight={180}
            />
          </div>
          <NumberField label={p.displayOrder} value={form.displayOrder} onChange={(v) => change('displayOrder', v)} />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              {c.cancel}
            </button>
            <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {submitting ? c.saving : initial ? p.saveChanges : p.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Shared field + state components ─── */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-stone-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
        <InboxIcon className="h-6 w-6" />
      </div>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-stone-500">{body}</p>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-0">
          <div className="h-4 flex-1 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <input
        type="text" value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <textarea
        value={value} rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </label>
  );
}

function SelectField<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      >
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
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
