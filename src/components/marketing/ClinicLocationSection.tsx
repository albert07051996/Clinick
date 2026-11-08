import { useLang } from '../../contexts/LanguageContext';
import {
  clinicLocation,
  clinicDirectionsUrl,
  clinicEmbedUrl,
} from '../../config/clinicLocation';

export default function ClinicLocationSection() {
  const { t } = useLang();
  const copy = t.location;
  const directions = clinicDirectionsUrl();

  return (
    <section id="location" className="bg-stone-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ─── Info card ─── */}
          <aside className="space-y-5 rounded-3xl bg-white p-8 shadow-sm">
            <InfoRow icon={<PinIcon />} label={copy.addressLabel}>
              <p className="font-semibold text-stone-900">{copy.addressLine1}</p>
              <p className="text-sm text-stone-500">{copy.addressLine2}</p>
            </InfoRow>

            <InfoRow icon={<PhoneIcon />} label={copy.phoneLabel}>
              <a
                href={`tel:${clinicLocation.phone.replace(/\s/g, '')}`}
                className="hover:text-rose-700"
              >
                {clinicLocation.phone}
              </a>
            </InfoRow>

            <InfoRow icon={<MailIcon />} label={copy.emailLabel}>
              <a href={`mailto:${clinicLocation.email}`} className="hover:text-rose-700">
                {clinicLocation.email}
              </a>
            </InfoRow>

            <InfoRow icon={<ClockIcon />} label={copy.hoursLabel}>
              <p className="text-sm">{copy.hoursWeekday}</p>
              <p className="text-sm">{copy.hoursSaturday}</p>
              <p className="text-sm text-stone-500">{copy.hoursSunday}</p>
            </InfoRow>

            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-stone-800"
            >
              <DirectionsIcon className="h-4 w-4" />
              {copy.directionsBtn}
            </a>
          </aside>

          {/* ─── Map — the whole card opens directions in Google Maps ─── */}
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.directionsBtn}
            className="group relative block h-[360px] overflow-hidden rounded-3xl shadow-lg lg:col-span-2 lg:h-[500px]"
          >
            <iframe
              src={clinicEmbedUrl()}
              title={copy.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
            />

            {/* Directions chip — always visible, animates on hover */}
            <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-lg backdrop-blur transition-transform duration-200 group-hover:-translate-y-0.5">
              <DirectionsIcon className="h-4 w-4 text-rose-600" />
              {copy.directionsBtn}
              <ExternalIcon className="h-3.5 w-3.5 text-stone-500" />
            </div>

            {/* Subtle gradient hint that the map is clickable */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-900/15 to-transparent" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── sub-components ─── */

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <div className="mt-0.5 text-stone-800">{children}</div>
      </div>
    </div>
  );
}

/* ─── icons ─── */

type IconProps = { className?: string };

function PinIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function MailIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function ClockIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function DirectionsIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l10 10-10 10L2 12 12 2z" />
      <path d="M10 15v-3H7l4-4 4 4h-3v3h-2z" />
    </svg>
  );
}
function ExternalIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}
