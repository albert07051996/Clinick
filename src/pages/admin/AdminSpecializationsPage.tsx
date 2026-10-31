import { useEffect, useState } from 'react';
import { specializationsService } from '../../services/api/specializationsService';
import type { Specialization } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; spec: Specialization };

export default function AdminSpecializationsPage() {
  const { t } = useLang();
  const s = t.admin.spec;
  const c = t.admin.common;
  const [items, setItems] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });

  const reload = async () => {
    setLoading(true);
    try { setItems(await specializationsService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const remove = async (spec: Specialization) => {
    if (!confirm(s.confirmDelete.replace('{name}', spec.name))) return;
    try {
      await specializationsService.delete(spec.id);
      setItems((prev) => prev.filter((x) => x.id !== spec.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : s.couldNotDelete);
    }
  };

  return (
    <div>
      <PageHeader
        title={s.title}
        subtitle={s.subtitle}
        action={
          <button
            onClick={() => setEditor({ mode: 'create' })}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800"
          >
            {s.addBtn}
          </button>
        }
      />

      {loading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState title={s.emptyTitle} body={s.emptyBody} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3">{c.name}</th>
                <th className="px-5 py-3">{c.description}</th>
                <th className="px-5 py-3">{s.colDoctors}</th>
                <th className="px-5 py-3 text-right">{c.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {items.map((spec) => (
                <tr key={spec.id} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3 font-semibold">{spec.name}</td>
                  <td className="px-5 py-3 text-stone-600">{spec.description || <span className="italic text-stone-400">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                      {spec.doctorCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setEditor({ mode: 'edit', spec })}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {c.edit}
                      </button>
                      <button
                        onClick={() => remove(spec)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        {c.delete}
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
        <SpecEditor
          initial={editor.mode === 'edit' ? editor.spec : undefined}
          onClose={() => setEditor({ mode: 'closed' })}
          onSaved={(saved) => {
            setItems((prev) => {
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

function SpecEditor({
  initial, onClose, onSaved,
}: {
  initial?: Specialization;
  onClose: () => void;
  onSaved: (s: Specialization) => void;
}) {
  const { t } = useLang();
  const s = t.admin.spec;
  const c = t.admin.common;
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined };
      const saved = initial
        ? await specializationsService.update(initial.id, payload)
        : await specializationsService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.couldNotSave);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label={c.cancel} onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="font-serif text-xl font-medium">{initial ? s.editTitle : s.newTitle}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
            <XIcon className="h-5 w-5" />
          </button>
        </header>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{c.name}</span>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={s.namePh}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">{s.descOptional}</span>
            <textarea
              value={form.description} rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">{c.cancel}</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {submitting ? c.saving : initial ? c.save : c.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
