import { useEffect, useMemo, useRef, useState } from 'react';

/* 24-hour time picker that replaces the native <input type="time">. Native
   browser pickers follow OS/user locale (12h with AM/PM in en-US), which
   contradicts the project-wide 24h-only standard — see
   src/utils/dateFormat.ts and the project-date-time-format memory. */

type Props = {
  /** Current value as "HH:mm" (24h). May be empty when nothing is picked yet. */
  value: string;
  onChange: (next: string) => void;
  /** Minute granularity for the minutes column. Default 15. */
  step?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function parseValue(v: string): { h: number | null; m: number | null } {
  if (!/^\d{1,2}:\d{2}$/.test(v)) return { h: null, m: null };
  const [h, m] = v.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return { h: null, m: null };
  return { h, m };
}

export default function TimePicker({
  value, onChange, step = 15, required, disabled, placeholder = '--:--', className, id, name,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  const minutes = useMemo(() => {
    const safeStep = step >= 1 && step <= 60 ? step : 15;
    const out: number[] = [];
    for (let m = 0; m < 60; m += safeStep) out.push(m);
    return out;
  }, [step]);

  const { h, m } = parseValue(value);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Scroll selected cells into view when opening.
  useEffect(() => {
    if (!open) return;
    const hBtn = hourColRef.current?.querySelector<HTMLButtonElement>('button[data-selected="true"]');
    const mBtn = minuteColRef.current?.querySelector<HTMLButtonElement>('button[data-selected="true"]');
    hBtn?.scrollIntoView({ block: 'nearest' });
    mBtn?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  const commit = (nextH: number | null, nextM: number | null) => {
    const effH = nextH ?? h ?? 9;
    const effM = nextM ?? m ?? 0;
    onChange(`${pad(effH)}:${pad(effM)}`);
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      {/* Hidden input so this plays nicely with native <form> validation / name/value readout */}
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? 'border-rose-400 ring-2 ring-rose-100' : 'border-stone-200'
        }`}
      >
        <span className={value ? 'text-stone-900' : 'text-stone-400'}>
          {value || placeholder}
        </span>
        <ClockIcon className="h-4 w-4 text-stone-400" />
      </button>

      {/* Native-form "required" fallback: an empty, visually-hidden input that
          participates in the browser's required-field check without ever showing. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}

      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-[200] mt-1 flex overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
        >
          <Column refProp={hourColRef} label="h">
            {HOURS.map((hour) => (
              <Cell
                key={hour}
                selected={hour === h}
                onClick={() => { commit(hour, m); }}
              >
                {pad(hour)}
              </Cell>
            ))}
          </Column>
          <Column refProp={minuteColRef} label="m">
            {minutes.map((minute) => (
              <Cell
                key={minute}
                selected={minute === m}
                onClick={() => { commit(h, minute); setOpen(false); }}
              >
                {pad(minute)}
              </Cell>
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}

function Column({ children, refProp, label }: { children: React.ReactNode; refProp: React.RefObject<HTMLDivElement | null>; label: string }) {
  return (
    <div className="flex flex-col border-r border-stone-100 last:border-r-0">
      <div className="border-b border-stone-100 bg-stone-50 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-widest text-stone-500">
        {label}
      </div>
      <div
        ref={refProp}
        className="max-h-56 w-14 overflow-y-auto overscroll-contain scrollbar-thin"
      >
        {children}
      </div>
    </div>
  );
}

function Cell({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-selected={selected ? 'true' : undefined}
      onClick={onClick}
      className={`w-full px-2 py-1.5 text-center font-mono text-sm transition-colors ${
        selected ? 'bg-rose-600 text-white' : 'text-stone-700 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
