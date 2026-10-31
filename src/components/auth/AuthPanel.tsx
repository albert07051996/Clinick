import { useLang } from '../../contexts/LanguageContext';

/* Decorative marketing panel used on the login & register pages (lg+ screens).
   Hidden on mobile — the form takes the full viewport there. */

export default function AuthPanel() {
  const { t } = useLang();

  return (
    <aside className="relative hidden overflow-hidden bg-stone-900 text-white lg:block">
      {/* soft lights */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-900 via-rose-900/40 to-stone-900" />

      <div className="relative flex min-h-full flex-col justify-between p-12 xl:p-16">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-rose-100 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          {t.auth.panel.badge}
        </span>

        <div className="my-16">
          <h2 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight xl:text-5xl">
            {t.auth.panel.title}
          </h2>

          <ul className="mt-10 space-y-4 text-stone-200">
            {t.auth.panel.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-300 text-stone-900 shadow-md">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <blockquote className="text-sm italic leading-relaxed text-stone-200">
            {t.auth.panel.quote}
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-300 to-amber-300" />
            <p className="text-xs font-medium text-stone-300">{t.auth.panel.quoteAuthor}</p>
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
