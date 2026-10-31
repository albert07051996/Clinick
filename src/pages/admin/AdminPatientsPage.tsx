import { useEffect, useState } from 'react';
import { patientsService } from '../../services/api/patientsService';
import { medicalHistoryService } from '../../services/api/medicalHistoryService';
import { useLang } from '../../contexts/LanguageContext';
import type { MedicalHistory, Patient, UpdateMedicalProfileRequest } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import ImagePicker from '../../components/shared/ImagePicker';
import ZoomableImage from '../../components/shared/ZoomableImage';

/* Admin → Patients. List with search; click into a patient to see demographics,
   clinical profile (editable), and full visit history. Reuses the same
   endpoints the Doctor Portal uses — admin bypasses the "treatment relationship"
   guard. */
export default function AdminPatientsPage() {
  const { t } = useLang();
  const copy = t.admin.patients;
  const doctorCopy = t.doctor.detail;

  const [items, setItems] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Patient | null>(null);

  const reload = async (term: string) => {
    setLoading(true);
    try {
      const r = await patientsService.list(term || undefined, 1, 100);
      setItems(r.items);
    } finally { setLoading(false); }
  };

  useEffect(() => { void reload(''); }, []);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); void reload(search.trim()); };

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium">{copy.title}</h1>
      <p className="mt-2 text-stone-600">{copy.subtitle}</p>

      <form onSubmit={onSearch} className="mt-6 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy.searchPh}
          className="w-full max-w-sm rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
          {copy.search}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-stone-100">
            {[0,1,2,3,4].map((i) => <div key={i} className="h-14 animate-pulse bg-stone-50" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-center text-stone-500">{copy.empty}</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm hover:bg-stone-50">
                {p.photoUrl ? (
                  <ZoomableImage
                    src={p.photoUrl}
                    alt={`${p.firstName} ${p.lastName}`}
                    caption={`${p.firstName} ${p.lastName}`}
                    loading="lazy"
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                    {(p.firstName[0] ?? '') + (p.lastName[0] ?? '')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.firstName} {p.lastName}</div>
                  <div className="truncate text-xs text-stone-500">
                    {p.email} · {p.phoneNumber ?? '—'} {p.age ? `· ${p.age} ${doctorCopy.years}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.allergies && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800" title={p.allergies}>
                      ⚠ {copy.allergies}
                    </span>
                  )}
                  <button
                    onClick={() => setSelected(p)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {copy.open}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <PatientDetailDrawer
          patient={selected}
          onClose={() => setSelected(null)}
          onSaved={(p) => { setSelected(p); setItems((prev) => prev.map((x) => x.id === p.id ? p : x)); }}
        />
      )}
    </div>
  );
}

function PatientDetailDrawer({
  patient, onClose, onSaved,
}: {
  patient: Patient;
  onClose: () => void;
  onSaved: (p: Patient) => void;
}) {
  const { t } = useLang();
  const copy = t.doctor.detail;
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateMedicalProfileRequest>({
    bloodType:          patient.bloodType          ?? '',
    allergies:          patient.allergies          ?? '',
    chronicConditions:  patient.chronicConditions  ?? '',
    currentMedications: patient.currentMedications ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    medicalHistoryService.listForPatient(patient.id)
      .then(setHistory)
      .catch(() => { /* ignore */ });
  }, [patient.id]);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await patientsService.updateMedicalProfile(patient.id, form);
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-stone-900/60 backdrop-blur-sm" />
      <div className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-[#faf7f4] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-6 py-4 backdrop-blur">
          <h2 className="font-serif text-xl font-medium">{patient.firstName} {patient.lastName}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900">✕</button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-serif text-lg font-medium">{t.admin.patients.photo}</h3>
            <ImagePicker
              folder="patients"
              value={patient.photoUrl || null}
              onChange={async (url, pid) => {
                try {
                  const updated = await patientsService.updatePhoto(patient.id, { photoUrl: url, photoPublicId: pid });
                  onSaved(updated);
                } catch (err) {
                  setError(err instanceof Error ? err.message : copy.saveError);
                }
              }}
              previewHeight={200}
            />
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 px-5 py-5 text-white shadow-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label={copy.age}       value={patient.age != null ? `${patient.age} ${copy.years}` : '—'} />
              <Info label={copy.gender}    value={patient.gender ?? '—'} />
              <Info label={copy.email}     value={patient.email} />
              <Info label={copy.phone}     value={patient.phoneNumber ?? '—'} />
              <Info label={copy.dob}       value={dob} />
              <Info label={copy.lastVisit} value={patient.lastVisit ? formatDate(patient.lastVisit) : '—'} />
            </div>
            {patient.emergencyContactName && (
              <div className="mt-3 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs">
                <span className="opacity-70">{copy.emergency}:</span>{' '}
                {patient.emergencyContactName}{patient.emergencyContactPhone ? ` · ${patient.emergencyContactPhone}` : ''}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">{copy.clinicalProfile}</h3>
              {!editing && (
                <button onClick={() => { setForm({
                  bloodType:          patient.bloodType          ?? '',
                  allergies:          patient.allergies          ?? '',
                  chronicConditions:  patient.chronicConditions  ?? '',
                  currentMedications: patient.currentMedications ?? '',
                }); setEditing(true); setError(null); }}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  {copy.edit}
                </button>
              )}
            </div>
            {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

            {editing ? (
              <div className="mt-4 space-y-3">
                <FieldInput label={copy.bloodType}  value={form.bloodType ?? ''}  onChange={(v) => setForm({ ...form, bloodType: v })} placeholder="A+" />
                <FieldText  label={copy.allergies}          value={form.allergies ?? ''}          onChange={(v) => setForm({ ...form, allergies: v })} />
                <FieldText  label={copy.chronicConditions}  value={form.chronicConditions ?? ''}  onChange={(v) => setForm({ ...form, chronicConditions: v })} />
                <FieldText  label={copy.currentMedications} value={form.currentMedications ?? ''} onChange={(v) => setForm({ ...form, currentMedications: v })} />
                <div className="flex justify-end gap-2 pt-1">
                  <button disabled={saving} onClick={() => setEditing(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50">{copy.cancel}</button>
                  <button disabled={saving} onClick={() => void save()} className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
                    {saving ? copy.saving : copy.save}
                  </button>
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-2">
                <Row label={copy.bloodType}          value={patient.bloodType}          highlight={patient.bloodType ? 'rose' : null} />
                <Row label={copy.allergies}          value={patient.allergies}          highlight={patient.allergies ? 'amber' : null} />
                <Row label={copy.chronicConditions}  value={patient.chronicConditions} />
                <Row label={copy.currentMedications} value={patient.currentMedications} />
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="font-serif text-lg font-medium">
              {copy.history} <span className="text-sm font-sans font-normal text-stone-500">({history.length})</span>
            </h3>
            {history.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">{copy.historyEmpty}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="rounded-xl border border-stone-100 bg-stone-50/50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm font-medium">{formatDateTime(h.createdAt)}</span>
                      {h.createdByName && <span className="text-xs text-stone-500">{h.createdByName}</span>}
                    </div>
                    {h.diagnosis   && <HLine label={copy.diagnosis}   value={h.diagnosis} />}
                    {h.treatment   && <HLine label={copy.treatment}   value={h.treatment} />}
                    {h.medications && <HLine label={copy.medications} value={h.medications} />}
                    {h.labResults  && <HLine label={copy.labResults}  value={h.labResults} />}
                    {h.notes       && <HLine label={copy.notes}       value={h.notes} />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}
function Row({ label, value, highlight }: { label: string; value?: string; highlight?: 'rose' | 'amber' | null }) {
  const style = highlight === 'rose' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                highlight === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                'bg-stone-50 border-stone-200 text-stone-800';
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className={`mt-1 rounded-xl border px-3 py-2 text-sm ${value ? style : 'bg-white border-dashed border-stone-200 text-stone-400'}`}>
        {value || '—'}
      </dd>
    </div>
  );
}
function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
    </div>
  );
}
function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</label>
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
    </div>
  );
}
function HLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 grid grid-cols-[108px_1fr] gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
      <span className="whitespace-pre-wrap text-stone-800">{value}</span>
    </div>
  );
}
