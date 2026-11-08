/**
 * Clinic address, coordinates and contact info used by the public site
 * (location section, footer, directions link).
 *
 * Swap `lat` / `lng` with the real clinic coordinates — pick them from
 * Google Maps: right-click the exact spot → first row shows "lat, lng".
 * Localized address lines live in `translations.ts` under `location.*`.
 */
export const clinicLocation = {
  lat: 41.7098,
  lng: 44.7570,
  phone: '+995 32 2 00 00 00',
  email: 'hello@aurea.ge',
} as const;

/** Google Maps directions URL — opens with "from: your location" prefilled. */
export function clinicDirectionsUrl(): string {
  const { lat, lng } = clinicLocation;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Embeddable map iframe URL. No Google Maps API key required. */
export function clinicEmbedUrl(): string {
  const { lat, lng } = clinicLocation;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}
