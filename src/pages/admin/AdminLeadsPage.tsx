import { useEffect, useState } from 'react';
import { consultationRequestsService } from '../../services/api/consultationRequestsService';
import { ConsultationRequestStatus } from '../../types';
import type { ConsultationRequestRecord } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { EmptyState, PageHeader, SkeletonTable } from './AdminProceduresPage';
import { formatDateTime } from '../../utils/dateFormat';

const STATUSES: (ConsultationRequestStatus | 'all')[] = [
  'all',
  ConsultationRequestStatus.New,
  ConsultationRequestStatus.Contacted,
  ConsultationRequestStatus.Scheduled,
  ConsultationRequestStatus.Closed,
];

const STATUS_STYLE: Record<ConsultationRequestStatus, string> = {
  New:       'bg-rose-100 text-rose-800',
  Contacted: 'bg-amber-100 text-amber-800',
  Scheduled: 'bg-sky-100 text-sky-800',
  Closed:    'bg-stone-200 text-stone-700',
};

export default function AdminLeadsPage() {
  const { t } = useLang();
  const l = t.admin.leads;
  const statusLabel = (s: ConsultationRequestStatus): string =>
    s === 'New' ? l.stNew : s === 'Contacted' ? l.stContacted : s === 'Scheduled' ? l.stScheduled : l.stClosed;
  const [items, setItems] = useState<ConsultationRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConsultationRequestStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await consultationRequestsService.list(
        filter === 'all' ? undefined : filter,
        1,
        100,
      );
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (id: string, status: ConsultationRequestStatus, internalNotes?: string) => {
    try {
      const updated = await consultationRequestsService.update(id, { status, internalNotes });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : l.couldNotUpd);
    }
  };

  const openRow = (lead: ConsultationRequestRecord) => {
    setExpanded(expanded === lead.id ? null : lead.id);
    setNotesDraft(lead.internalNotes ?? '');
  };

  const fmt = (d: string) => formatDateTime(d);

  return (
    <div>
      <PageHeader title={l.title} subtitle={l.subtitle} />

      <div className="mt-6 flex flex-wrap items-center gap-1 rounded-full border border-stone-200 bg-white p-1 text-sm w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 font-medium ${
              filter === s ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {s === 'all' ? l.allTab : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState title={l.emptyTitle} body={l.emptyBody} />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((lead) => (
            <article key={lead.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <button
                onClick={() => openRow(lead)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-stone-50/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{lead.fullName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[lead.status]}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex gap-3 text-sm text-stone-500">
                    <span>{lead.email}</span>
                    <span>·</span>
                    <span>{lead.phone}</span>
                    {lead.source && <><span>·</span><span className="italic">{lead.source}</span></>}
                  </div>
                </div>
                <div className="text-right text-xs text-stone-400">{fmt(lead.createdAt)}</div>
                <ChevronIcon className={`h-4 w-4 flex-shrink-0 text-stone-400 transition-transform ${expanded === lead.id ? 'rotate-180' : ''}`} />
              </button>

              {expanded === lead.id && (
                <div className="space-y-4 border-t border-stone-100 px-5 py-5">
                  {lead.message && (
                    <div>
                      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-500">{l.message}</h4>
                      <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">{lead.message}</p>
                    </div>
                  )}

                  {lead.preferredContactTime && (
                    <div className="text-sm">
                      <span className="font-semibold">{l.preferredTime}</span> {lead.preferredContactTime}
                    </div>
                  )}

                  {lead.interestedProcedureIds.length > 0 && (
                    <div>
                      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-500">
                        {l.interestedProcs} ({lead.interestedProcedureIds.length})
                      </h4>
                      <p className="font-mono text-xs text-stone-500">
                        {lead.interestedProcedureIds.join(', ')}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-500">{l.notes}</h4>
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={3}
                      placeholder={l.notesPh}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(['New','Contacted','Scheduled','Closed'] as ConsultationRequestStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(lead.id, s, notesDraft)}
                          disabled={lead.status === s}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            lead.status === s
                              ? `${STATUS_STYLE[s]} cursor-default opacity-60`
                              : 'border border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:text-rose-700'
                          }`}
                        >
                          {l.markAs.replace('{status}', statusLabel(s))}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setStatus(lead.id, lead.status, notesDraft)}
                      className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      {l.saveNotes}
                    </button>
                  </div>

                  {lead.handledAt && (
                    <p className="text-xs italic text-stone-500">
                      {l.lastHandled} {fmt(lead.handledAt)}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
