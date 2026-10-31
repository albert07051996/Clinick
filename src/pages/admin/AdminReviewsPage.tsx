import { useEffect, useState } from 'react';
import { reviewsService } from '../../services/api/reviewsService';
import type { Review } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';
import { formatDate } from '../../utils/dateFormat';

type Filter = 'pending' | 'approved' | 'all';

export default function AdminReviewsPage() {
  const { t } = useLang();
  const r = t.admin.rev;
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [acting, setActing] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const isApproved =
        filter === 'all' ? undefined :
        filter === 'approved' ? true :
        false;
      const res = await reviewsService.list({ isApproved, pageSize: 100 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [filter]);

  const moderate = async (id: string, approve: boolean) => {
    setActing(id);
    try {
      const updated = await reviewsService.moderate(id, { approve });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : r.couldNotMod);
    } finally {
      setActing(null);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm(r.confirmDelete)) return;
    setActing(id);
    try {
      await reviewsService.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setActing(null);
    }
  };

  const tabLabel = (f: Filter): string =>
    f === 'pending' ? r.tabPending : f === 'approved' ? r.tabApproved : r.tabAll;

  return (
    <div>
      <PageHeader title={r.title} subtitle={r.subtitle} />

      <div className="mt-6 flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
        {(['pending', 'approved', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-medium ${
              filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tabLabel(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState
          title={filter === 'pending' ? r.emptyPending : r.emptyAll}
          body={r.emptyBody}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((review) => (
            <article key={review.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.patientName}</span>
                    {review.isApproved ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        {r.bApproved}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {r.bPending}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {review.procedureName && <span>{r.lblProcedure} {review.procedureName} · </span>}
                    {review.doctorName && <span>{r.lblDoctor} {review.doctorName} · </span>}
                    {formatDate(review.submittedAt)}
                  </p>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'fill-stone-200 text-stone-200'}`} />
                  ))}
                </div>
              </div>

              <blockquote className="mt-4 border-l-2 border-rose-200 pl-4 text-sm text-stone-700 leading-relaxed">
                "{review.comment}"
              </blockquote>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => removeReview(review.id)}
                  disabled={acting === review.id}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
                >
                  {t.admin.common.delete}
                </button>
                {review.isApproved ? (
                  <button
                    onClick={() => moderate(review.id, false)}
                    disabled={acting === review.id}
                    className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {r.unapprove}
                  </button>
                ) : (
                  <button
                    onClick={() => moderate(review.id, true)}
                    disabled={acting === review.id}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {r.approve}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
