import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { useLang } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import ConsultationModal from '../components/marketing/ConsultationModal';
import DoctorsAvailabilitySection from '../components/marketing/DoctorsAvailabilitySection';
import ZoomableImage from '../components/shared/ZoomableImage';
import { formatMoney } from '../utils/money';
import { proceduresService } from '../services/api/proceduresService';
import { beforeAfterCasesService } from '../services/api/beforeAfterCasesService';
import { reviewsService } from '../services/api/reviewsService';
import type { BeforeAfterCase, Procedure, Review } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t, lang } = useLang();
  const [scrolled, setScrolled] = useState(false);

  // ─── Live data (public endpoints) ────────────────────────────────────────
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterCase[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('homepage-hero');
  const [modalInitialProc, setModalInitialProc] = useState<string | undefined>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Each section fails independently and silently falls back to i18n demo content.
    proceduresService.list({ isActive: true }).then(setProcedures).catch(() => { /* keep fallback */ });
    beforeAfterCasesService.list().then(setBeforeAfter).catch(() => { /* keep fallback */ });
    reviewsService.list({ isApproved: true, pageSize: 6 }).then((r) => setReviews(r.items)).catch(() => { /* keep fallback */ });
  }, []);

  // ─── Normalized view-models (live data OR i18n fallback) ────────────────
  const procedureCards = useMemo(() => {
    if (procedures.length === 0) {
      return t.procedures.items.map((item, i) => ({
        key:       `demo-${i}`,
        title:     item.title,
        tag:       item.tag,
        desc:      item.desc,
        priceFrom: item.from,
        gradient:  PROCEDURE_META[i].gradient,
        Icon:      PROCEDURE_META[i].icon,
        imageUrl:  undefined as string | undefined,
        onBook:    () => openModal('homepage-procedures'),
      }));
    }
    return procedures.map((p) => ({
      key:       p.id,
      title:     p.name,
      tag:       categoryLabel(p.category, t.procedures.tabs),
      desc:      p.shortDescription ?? '',
      priceFrom: formatMoney(p.basePrice, lang),
      gradient:  gradientForCategory(p.category),
      Icon:      iconForCategory(p.category),
      imageUrl:  p.imageUrl,
      onBook:    () => openModal('homepage-procedures', p.id),
    }));
  }, [procedures, lang, t.procedures.items, t.procedures.tabs]);

  const beforeAfterCards = useMemo(() => {
    if (beforeAfter.length === 0) {
      return t.results.items.map((item, i) => ({
        key:     `demo-${i}`,
        label:   item.label,
        months:  item.months,
        before:  undefined as string | undefined,
        after:   undefined as string | undefined,
        gradientFrom: RESULT_META[i].from,
        gradientTo:   RESULT_META[i].to,
      }));
    }
    return beforeAfter.slice(0, 6).map((c, i) => ({
      key:     c.id,
      label:   c.title || c.procedureName,
      months:  `${c.monthsAfter} ${c.monthsAfter === 1 ? 'month' : 'months'}`,
      before:  c.beforeImageUrl,
      after:   c.afterImageUrl,
      gradientFrom: RESULT_META[i % RESULT_META.length].from,
      gradientTo:   RESULT_META[i % RESULT_META.length].to,
    }));
  }, [beforeAfter, t.results.items]);

  const reviewCards = useMemo(() => {
    if (reviews.length === 0) {
      return t.testimonials.items.map((item, i) => ({
        key:       `demo-${i}`,
        quote:     item.quote,
        name:      item.name,
        procedure: item.procedure,
        bg:        TESTIMONIAL_BG[i],
        rating:    5,
      }));
    }
    return reviews.map((r, i) => ({
      key:       r.id,
      quote:     r.comment,
      name:      r.patientName,
      procedure: r.procedureName ?? r.doctorName ?? '',
      bg:        TESTIMONIAL_BG[i % TESTIMONIAL_BG.length],
      rating:    r.rating,
    }));
  }, [reviews, t.testimonials.items]);

  // ─── Modal openers ───────────────────────────────────────────────────────
  const openModal = (source: string, procedureId?: string) => {
    setModalSource(source);
    setModalInitialProc(procedureId);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      {/* ───────────── Navbar ───────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-lg shadow-rose-300/50">
              <PetalIcon className="h-6 w-6" />
            </div>
            <span className="text-xl font-serif tracking-tight">
              Aurea <span className="italic font-light text-rose-700">Aesthetics</span>
            </span>
          </a>

          <ul className="hidden items-center gap-7 text-sm font-medium text-stone-600 lg:flex">
            <li><a href="#procedures" className="hover:text-rose-700">{t.nav.procedures}</a></li>
            <li><a href="#surgeons"   className="hover:text-rose-700">{t.nav.surgeons}</a></li>
            <li><a href="#results"    className="hover:text-rose-700">{t.nav.results}</a></li>
            <li><a href="#why"        className="hover:text-rose-700">{t.nav.why}</a></li>
            <li><a href="#contact"    className="hover:text-rose-700">{t.nav.contact}</a></li>
          </ul>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden md:inline-flex" />

            {user ? (
              <>
                <span className="hidden text-sm text-stone-600 xl:inline">
                  {t.nav.hi} <span className="font-semibold">{user.displayName}</span>
                </span>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  {t.nav.myAccount}
                </button>
                <button
                  onClick={() => { authService.logout(); navigate('/login'); }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden rounded-full px-5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 sm:inline-block"
                >
                  {t.nav.signIn}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  {t.nav.bookNow}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute -left-24 top-20 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute right-10 top-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-800 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {t.hero.badge}
            </span>

            <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.03] tracking-tight text-stone-900 sm:text-6xl lg:text-[76px]">
              {t.hero.title1}{' '}
              <span className="italic bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                {t.hero.title2}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
              {t.hero.desc}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => openModal('homepage-hero')}
                className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-stone-900/20 hover:bg-stone-800"
              >
                {t.hero.ctaPrimary}
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#procedures"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-8 py-4 text-base font-semibold text-stone-800 backdrop-blur hover:bg-white"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-stone-200 pt-8">
              {t.hero.stats.map((s) => (
                <Stat key={s.v} value={s.k} label={s.v} />
              ))}
            </dl>
          </div>

          {/* Hero card */}
          <div className="relative animate-fade-up">
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-300 via-pink-300 to-amber-200 p-1 shadow-2xl shadow-rose-300/50">
              <div className="flex h-full w-full flex-col justify-between rounded-[2.3rem] bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <SparkleIcon className="h-6 w-6 text-amber-200" />
                    </div>
                    <div>
                      <p className="text-xs text-white/70">{t.hero.card.consult}</p>
                      <p className="font-medium">{t.hero.card.date}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100">
                    {t.hero.card.confidential}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-rose-300 to-amber-300" />
                    <div>
                      <p className="font-semibold">{t.hero.card.docName}</p>
                      <p className="text-sm text-white/70">{t.hero.card.docSpec}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#faf7f4] p-4 text-stone-900 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">{t.hero.card.interested}</p>
                      <span className="text-xs text-stone-500">{t.hero.card.selectUp}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {t.hero.card.chips.map((chip, i) => (
                        <span
                          key={chip}
                          className={`rounded-full px-3 py-1.5 font-medium ${
                            i < 2
                              ? 'bg-stone-900 text-white'
                              : 'border border-stone-200 bg-white text-stone-600'
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* floating badges */}
            <div className="animate-float absolute -left-6 top-20 hidden rounded-2xl bg-white p-4 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.hero.floatCert.title}</p>
                  <p className="text-xs text-stone-500">{t.hero.floatCert.sub}</p>
                </div>
              </div>
            </div>

            <div className="animate-float animation-delay-2000 absolute -right-4 bottom-16 hidden rounded-2xl bg-white p-4 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <HeartIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.hero.floatRefer.title}</p>
                  <p className="text-xs text-stone-500">{t.hero.floatRefer.sub}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Procedures ───────────── */}
      <section id="procedures" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
              {t.procedures.tag}
            </span>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              {t.procedures.title}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t.procedures.desc}</p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {t.procedures.tabs.map((tab, i) => (
              <span
                key={tab}
                className={`rounded-full px-5 py-2 text-sm font-medium ${
                  i === 0
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-600'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {procedureCards.map((p) => {
              const Icon = p.Icon;
              return (
                <article
                  key={p.key}
                  className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl"
                >
                  {p.imageUrl ? (
                    <div className="absolute inset-x-0 top-0 h-32 overflow-hidden">
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover opacity-20" />
                    </div>
                  ) : null}
                  <div
                    className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-md`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="relative mt-6 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{p.title}</h3>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                      {p.tag}
                    </span>
                  </div>
                  <p className="relative mt-2 text-stone-600">{p.desc}</p>
                  <div className="relative mt-6 flex items-center justify-between text-sm">
                    <span className="text-stone-500">
                      {t.procedures.priceFrom}{' '}
                      <span className="font-semibold text-stone-900">{p.priceFrom}</span>
                    </span>
                    <button
                      type="button"
                      onClick={p.onBook}
                      className="inline-flex items-center gap-1 font-semibold text-rose-700 transition-all hover:gap-2"
                    >
                      {t.procedures.learnMore} <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Journey ───────────── */}
      <section id="why" className="bg-[#faf7f4] py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
              {t.journey.tag}
            </span>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              {t.journey.title1}<br />{t.journey.title2}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t.journey.desc}</p>

            <ol className="mt-10 space-y-6">
              {t.journey.steps.map((f, i) => (
                <li key={f.title} className="flex gap-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-400 font-serif text-lg font-semibold text-white shadow-lg shadow-rose-200">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{f.title}</h4>
                    <p className="mt-1 text-stone-600">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {t.journey.stats.map((s, i) => (
              <div
                key={s.v}
                className={`rounded-3xl bg-gradient-to-br ${STAT_GRADIENTS[i]} p-8 text-white shadow-lg`}
              >
                <p className="font-serif text-4xl font-medium">{s.k}</p>
                <p className="mt-2 text-sm text-white/90">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Surgeons ───────────── */}
      <section id="surgeons" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
                {t.surgeons.tag}
              </span>
              <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
                {t.surgeons.title}
              </h2>
            </div>
            <a href="#" className="hidden text-sm font-semibold text-rose-700 hover:underline sm:inline">
              {t.surgeons.viewAll}
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {t.surgeons.items.map((d, i) => {
              const meta = SURGEON_META[i];
              return (
                <article
                  key={d.name}
                  className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`aspect-[4/5] bg-gradient-to-br ${meta.bg} relative`}>
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 backdrop-blur">
                      <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                      {meta.rating}
                    </div>
                    <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-5xl shadow-lg">
                      {meta.emoji}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{d.specialty}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-medium">{d.name}</h3>
                    <p className="text-sm text-stone-500">{d.credential}</p>
                    <button
                      onClick={() => openModal('homepage-doctor-card')}
                      className="mt-4 w-full rounded-full bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                      {t.surgeons.bookConsult}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Doctors' availability (live data) ───────────── */}
      <DoctorsAvailabilitySection />

      {/* ───────────── Results ───────────── */}
      <section id="results" className="bg-[#faf7f4] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
              {t.results.tag}
            </span>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              {t.results.title}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t.results.desc}</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {beforeAfterCards.map((r) => (
              <div key={r.key} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                <div className="grid grid-cols-2">
                  <div className={`relative aspect-square bg-gradient-to-br ${r.gradientFrom}`}>
                    {r.before && (
                      <ZoomableImage src={r.before} alt={`${t.results.before} — ${r.label}`} caption={`${t.results.before} — ${r.label}`} className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 backdrop-blur">
                      {t.results.before}
                    </span>
                  </div>
                  <div className={`relative aspect-square bg-gradient-to-br ${r.gradientTo}`}>
                    {r.after && (
                      <ZoomableImage src={r.after} alt={`${t.results.after} — ${r.label}`} caption={`${t.results.after} — ${r.label}`} className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t.results.after}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-semibold">{r.label}</h4>
                  <p className="mt-1 text-sm text-stone-500">{r.months}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              {t.results.gallery} <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ───────────── Testimonials ───────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
              {t.testimonials.tag}
            </span>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              {t.testimonials.title}
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {reviewCards.map((item) => (
              <figure
                key={item.key}
                className="rounded-3xl border border-stone-200 bg-[#faf7f4] p-8 shadow-sm"
              >
                <QuoteIcon className="h-8 w-8 text-rose-300" />
                <blockquote className="mt-4 text-stone-700 leading-relaxed">"{item.quote}"</blockquote>
                <div className="mt-4 flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} className={`h-4 w-4 ${j < item.rating ? 'fill-current' : 'fill-stone-200 text-stone-200'}`} />
                  ))}
                </div>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-200 pt-4">
                  <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${item.bg}`} />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-stone-500">{item.procedure}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section id="contact" className="relative overflow-hidden bg-stone-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-800/30 via-transparent to-amber-500/10" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-rose-100 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {t.cta.badge}
          </span>

          <h2 className="mt-6 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            {t.cta.title1}<br />{t.cta.title2}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-300">{t.cta.desc}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openModal('homepage-cta')}
              className="rounded-full bg-white px-8 py-4 text-base font-semibold text-stone-900 shadow-xl hover:bg-stone-100"
            >
              {t.cta.primary}
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold backdrop-blur hover:bg-white/20"
            >
              {t.cta.secondary}
            </button>
          </div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="bg-stone-900 text-stone-400">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white">
                  <PetalIcon className="h-6 w-6" />
                </div>
                <span className="font-serif text-xl text-white">
                  Aurea <span className="italic font-light text-rose-300">Aesthetics</span>
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed">{t.footer.desc}</p>
            </div>
            <div>
              <h5 className="font-semibold text-white">{t.footer.proceduresH}</h5>
              <ul className="mt-4 space-y-2 text-sm">
                {t.footer.links.map((link) => (
                  <li key={link}><a href="#" className="hover:text-white">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white">{t.footer.contactH}</h5>
              <ul className="mt-4 space-y-2 text-sm">
                <li>📞 +995 32 2 00 00 00</li>
                <li>✉️ hello@aurea.ge</li>
                <li>📍 Tbilisi · Vake</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-stone-800 pt-6 text-center text-xs sm:flex-row">
            <p>© {new Date().getFullYear()} Aurea Aesthetics. {t.footer.rights}</p>
            <p className="italic">{t.footer.disclaimer}</p>
          </div>
        </div>
      </footer>

      <ConsultationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        procedures={procedures}
        initialProcedureId={modalInitialProc}
        source={modalSource}
      />
    </div>
  );
}

/* ─── category → visual mapping (used when procedures come from the API) ─── */

function iconForCategory(cat: string): (p: { className?: string }) => React.ReactElement {
  switch (cat) {
    case 'Face':         return FaceIcon;
    case 'Body':         return BodyIcon;
    case 'NonSurgical':  return SparkleIcon;
    default:             return SparkleIcon;
  }
}

function gradientForCategory(cat: string): string {
  switch (cat) {
    case 'Face':         return 'from-rose-500 to-pink-500';
    case 'Body':         return 'from-fuchsia-500 to-rose-500';
    case 'NonSurgical':  return 'from-amber-400 to-orange-400';
    default:             return 'from-stone-700 to-stone-500';
  }
}

function categoryLabel(cat: string, tabs: readonly string[]): string {
  // tabs[0]="All", tabs[1]="Face", tabs[2]="Body", tabs[3]="Non-surgical"
  switch (cat) {
    case 'Face':         return tabs[1] ?? cat;
    case 'Body':         return tabs[2] ?? cat;
    case 'NonSurgical':  return tabs[3] ?? cat;
    default:             return cat;
  }
}

/* ─── Small helpers ─── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-serif text-3xl font-medium text-stone-900">{value}</dt>
      <dd className="text-sm text-stone-500">{label}</dd>
    </div>
  );
}

/* ─── Non-translatable metadata (icons, gradients, emojis, backgrounds)
       zipped by index with the translated items in `translations`.      ─── */

type IconProps = { className?: string };

const PROCEDURE_META: { gradient: string; icon: (p: IconProps) => React.ReactElement }[] = [
  { gradient: 'from-rose-500 to-pink-500',       icon: NoseIcon },
  { gradient: 'from-amber-500 to-rose-500',      icon: FaceIcon },
  { gradient: 'from-pink-500 to-fuchsia-500',    icon: HeartIcon },
  { gradient: 'from-fuchsia-500 to-rose-500',    icon: BodyIcon },
  { gradient: 'from-rose-400 to-amber-400',      icon: SyringeIcon },
  { gradient: 'from-amber-400 to-orange-400',    icon: SparkleIcon },
];

const STAT_GRADIENTS = [
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-stone-800 to-stone-600',
  'from-fuchsia-500 to-rose-500',
];

const SURGEON_META = [
  { rating: '4.9', emoji: '👩‍⚕️', bg: 'from-rose-200 to-pink-300' },
  { rating: '4.9', emoji: '🧑‍⚕️', bg: 'from-amber-200 to-rose-200' },
  { rating: '5.0', emoji: '👩‍⚕️', bg: 'from-pink-200 to-fuchsia-300' },
  { rating: '4.8', emoji: '🧑‍⚕️', bg: 'from-fuchsia-200 to-rose-300' },
];

const RESULT_META = [
  { from: 'from-rose-200 to-pink-300',   to: 'from-rose-400 to-amber-300' },
  { from: 'from-amber-200 to-rose-200',  to: 'from-rose-500 to-fuchsia-400' },
  { from: 'from-pink-200 to-amber-200',  to: 'from-amber-400 to-rose-400' },
];

const TESTIMONIAL_BG = [
  'from-rose-300 to-pink-400',
  'from-amber-300 to-rose-400',
  'from-fuchsia-300 to-rose-400',
];

/* ─── Inline SVG icons ─── */

function PetalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c3 4 7 6 7 11a7 7 0 1 1-14 0c0-5 4-7 7-11z" />
    </svg>
  );
}
function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21s-7-4.35-9.5-9.3C.8 8.4 2.6 5 6 5c2 0 3.5 1.1 4.5 2.5C11.5 6.1 13 5 15 5c3.4 0 5.2 3.4 3.5 6.7C19 16.65 12 21 12 21z" />
    </svg>
  );
}
function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zm7 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  );
}
function NoseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v10c0 2-1 3-3 3h-1a2 2 0 0 0-2 2v1h12v-1a2 2 0 0 0-2-2h-1c-2 0-3-1-3-3" />
      <path d="M9 20h6" />
    </svg>
  );
}
function FaceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a7 7 0 0 1 7 7v3a7 7 0 0 1-14 0v-3a7 7 0 0 1 7-7z" />
      <path d="M9 11h.01M15 11h.01M9 16c1 .8 2 1.2 3 1.2s2-.4 3-1.2" />
    </svg>
  );
}
function BodyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 7v5l-2 2v6M12 7v5l2 2v6M9 10H6M15 10h3" />
    </svg>
  );
}
function SyringeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2l4 4M15 5l4 4M3 21l5-5M8 16l5 5M8 16l-3-3 9-9 3 3-9 9z" />
    </svg>
  );
}
function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
function QuoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a4 4 0 0 1-4 4v2a6 6 0 0 0 6-6V7zm12 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a4 4 0 0 1-4 4v2a6 6 0 0 0 6-6V7z" />
    </svg>
  );
}
