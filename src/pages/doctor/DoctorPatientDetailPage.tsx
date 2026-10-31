import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { patientsService } from '../../services/api/patientsService';
import { medicalHistoryService } from '../../services/api/medicalHistoryService';
import { useLang } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import type { MedicalHistory, Patient, UpdateMedicalProfileRequest, CreateMedicalHistoryRequest } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import ZoomableImage from '../../components/shared/ZoomableImage';

export default function DoctorPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const appointmentId = search.get('appointmentId') ?? undefined;
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useLang();
  const d = t.doctor;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        patientsService.getById(id),
        medicalHistoryService.listForPatient(id),
      ]);
      setPatient(p);
      setHistory(h);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.detail.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [id]);

  const logout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#faf7f4] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/doctor" className="flex items-center gap-3 text-sm font-semibold text-stone-600 hover:text-rose-700">
            <span>←</span>
            <span>{d.detail.backToSchedule}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <span className="hidden text-sm text-stone-600 sm:inline">{user?.displayName}</span>
            <button onClick={logout} className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-800">{error}</div>
        ) : !patient ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5">
            {d.detail.notFound}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-6">
              <PatientHeaderCard patient={patient} d={d} />
              <ClinicalProfileCard patient={patient} onSaved={(p) => setPatient(p)} d={d} />
            </div>
            <div className="space-y-6">
              <AddEncounterCard patient={patient} appointmentId={appointmentId} onCreated={(h) => setHistory([h, ...history])} d={d} />
              <HistoryTimeline history={history} d={d} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Patient header ─── */
function PatientHeaderCard({ patient, d }: { patient: Patient; d: ReturnType<typeof useLang>['t']['doctor'] }) {
  const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—';
  return (
    <section className="rounded-3xl bg-gradient-to-br from-stone-900 via-rose-900 to-stone-900 px-7 py-6 text-white shadow-xl">
      <div className="flex items-start gap-4">
        {patient.photoUrl ? (
          <ZoomableImage
            src={patient.photoUrl}
            alt={`${patient.firstName} ${patient.lastName}`}
            caption={`${patient.firstName} ${patient.lastName}`}
            loading="lazy"
            className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-white/40"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold uppercase">
            {(patient.firstName[0] ?? '') + (patient.lastName[0] ?? '')}
          </div>
        )}
        <h1 className="font-serif text-3xl font-medium">{patient.firstName} {patient.lastName}</h1>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Info label={d.detail.age}        value={patient.age != null ? `${patient.age} ${d.detail.years}` : '—'} />
        <Info label={d.detail.gender}     value={patient.gender ?? '—'} />
        <Info label={d.detail.email}      value={patient.email} />
        <Info label={d.detail.phone}      value={patient.phoneNumber ?? '—'} />
        <Info label={d.detail.dob}        value={dob} />
        <Info label={d.detail.lastVisit}  value={patient.lastVisit ? formatDate(patient.lastVisit) : '—'} />
      </div>
      {patient.emergencyContactName && (
        <div className="mt-4 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm">
          <span className="opacity-70">{d.detail.emergency}:</span>{' '}
          {patient.emergencyContactName}{patient.emergencyContactPhone ? ` · ${patient.emergencyContactPhone}` : ''}
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

/* ─── Clinical profile (allergies / meds / conditions) ─── */
function ClinicalProfileCard({
  patient, onSaved, d,
}: {
  patient: Patient;
  onSaved: (p: Patient) => void;
  d: ReturnType<typeof useLang>['t']['doctor'];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateMedicalProfileRequest>({
    bloodType:          patient.bloodType          ?? '',
    allergies:          patient.allergies          ?? '',
    chronicConditions:  patient.chronicConditions  ?? '',
    currentMedications: patient.currentMedications ?? '',
  });

  const save = async () => {
    if (!patient.id) return;
    setSaving(true); setError(null);
    try {
      const updated = await patientsService.updateMedicalProfile(patient.id, form);
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.detail.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-medium">{d.detail.clinicalProfile}</h2>
        {!editing && (
          <button onClick={() => { setForm({
            bloodType:          patient.bloodType          ?? '',
            allergies:          patient.allergies          ?? '',
            chronicConditions:  patient.chronicConditions  ?? '',
            currentMedications: patient.currentMedications ?? '',
          }); setEditing(true); setError(null); }}
            className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            {d.detail.edit}
          </button>
        )}
      </div>
      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

      {editing ? (
        <div className="mt-5 space-y-4">
          <FieldInput  label={d.detail.bloodType}  value={form.bloodType ?? ''}  onChange={(v) => setForm({ ...form, bloodType: v })} placeholder="A+" />
          <FieldText   label={d.detail.allergies}          value={form.allergies ?? ''}          onChange={(v) => setForm({ ...form, allergies: v })} />
          <FieldText   label={d.detail.chronicConditions}  value={form.chronicConditions ?? ''}  onChange={(v) => setForm({ ...form, chronicConditions: v })} />
          <FieldText   label={d.detail.currentMedications} value={form.currentMedications ?? ''} onChange={(v) => setForm({ ...form, currentMedications: v })} />
          <div className="flex justify-end gap-2 pt-2">
            <button disabled={saving} onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50">{d.detail.cancel}</button>
            <button disabled={saving} onClick={() => void save()} className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
              {saving ? d.detail.saving : d.detail.save}
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-5 space-y-3">
          <Row label={d.detail.bloodType}          value={patient.bloodType} highlight={patient.bloodType ? 'rose' : null} />
          <Row label={d.detail.allergies}          value={patient.allergies} highlight={patient.allergies ? 'amber' : null} />
          <Row label={d.detail.chronicConditions}  value={patient.chronicConditions} />
          <Row label={d.detail.currentMedications} value={patient.currentMedications} />
        </dl>
      )}
    </section>
  );
}

function Row({ label, value, highlight }: { label: string; value?: string; highlight?: 'rose' | 'amber' | null }) {
  const style =
    highlight === 'rose'  ? 'bg-rose-50  border-rose-200  text-rose-900'  :
    highlight === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-900' :
    'bg-stone-50 border-stone-200 text-stone-800';
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className={`mt-1 rounded-xl border px-3 py-2 text-sm ${value ? style : 'bg-white border-dashed border-stone-200 text-stone-400'}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
    </div>
  );
}
function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</label>
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
    </div>
  );
}

/* ─── Add encounter form ─── */
function AddEncounterCard({
  patient, appointmentId, onCreated, d,
}: {
  patient: Patient;
  appointmentId?: string;
  onCreated: (h: MedicalHistory) => void;
  d: ReturnType<typeof useLang>['t']['doctor'];
}) {
  const [form, setForm] = useState<CreateMedicalHistoryRequest>({
    patientId: patient.id, appointmentId,
    diagnosis: '', treatment: '', medications: '', labResults: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const anything = useMemo(
    () => !!(form.diagnosis || form.treatment || form.medications || form.labResults || form.notes),
    [form],
  );

  const submit = async () => {
    if (!anything) { setError(d.detail.enterSomething); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const created = await medicalHistoryService.create(form);
      onCreated(created);
      setForm({ patientId: patient.id, appointmentId, diagnosis: '', treatment: '', medications: '', labResults: '', notes: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.detail.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl font-medium">{d.detail.newEncounter}</h2>
      {appointmentId && <p className="mt-1 text-xs text-stone-500">{d.detail.linkedTo} {appointmentId.slice(0, 8)}…</p>}
      {error   && <div className="mt-3 rounded-xl border border-rose-200    bg-rose-50    px-3 py-2 text-sm text-rose-800">{error}</div>}
      {success && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{d.detail.saved}</div>}

      <div className="mt-5 space-y-4">
        <FieldInput  label={d.detail.diagnosis}  value={form.diagnosis   ?? ''} onChange={(v) => setForm({ ...form, diagnosis: v })} />
        <FieldInput  label={d.detail.treatment}  value={form.treatment   ?? ''} onChange={(v) => setForm({ ...form, treatment: v })} />
        <FieldText   label={d.detail.medications}value={form.medications ?? ''} onChange={(v) => setForm({ ...form, medications: v })} />
        <FieldText   label={d.detail.labResults} value={form.labResults  ?? ''} onChange={(v) => setForm({ ...form, labResults: v })} />
        <FieldText   label={d.detail.notes}      value={form.notes       ?? ''} onChange={(v) => setForm({ ...form, notes: v })} />
        <div className="flex justify-end pt-2">
          <button disabled={saving} onClick={() => void submit()} className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">
            {saving ? d.detail.saving : d.detail.saveEncounter}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── History timeline ─── */
function HistoryTimeline({ history, d }: { history: MedicalHistory[]; d: ReturnType<typeof useLang>['t']['doctor'] }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl font-medium">{d.detail.history} <span className="text-sm font-sans font-normal text-stone-500">({history.length})</span></h2>
      {history.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">{d.detail.historyEmpty}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {history.map((h) => <HistoryItem key={h.id} h={h} d={d} />)}
        </ul>
      )}
    </section>
  );
}

function HistoryItem({ h, d }: { h: MedicalHistory; d: ReturnType<typeof useLang>['t']['doctor'] }) {
  const when = formatDateTime(h.createdAt);
  return (
    <li className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm font-medium">{when}</span>
        {h.createdByName && <span className="text-xs text-stone-500">{h.createdByName}</span>}
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {h.diagnosis   && <HLine label={d.detail.diagnosis}  value={h.diagnosis} />}
        {h.treatment   && <HLine label={d.detail.treatment}  value={h.treatment} />}
        {h.medications && <HLine label={d.detail.medications}value={h.medications} />}
        {h.labResults  && <HLine label={d.detail.labResults} value={h.labResults} />}
        {h.notes       && <HLine label={d.detail.notes}      value={h.notes} />}
      </dl>
    </li>
  );
}
function HLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[128px_1fr] gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-stone-800">{value}</dd>
    </div>
  );
}
