/* tsconfig has `erasableSyntaxOnly: true`, which forbids TS `enum` because
   it emits runtime code. Const-object + union keeps the same ergonomics
   (`UserRole.Admin`, type-narrowing on the string union) and matches
   the backend wire format produced by JsonStringEnumConverter. */

export const UserRole = {
  Admin:   'Admin',
  Doctor:  'Doctor',
  Patient: 'Patient',
  Staff:   'Staff',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AppointmentStatus = {
  Scheduled:   'Scheduled',
  Completed:   'Completed',
  Cancelled:   'Cancelled',
  NoShow:      'NoShow',
  Rescheduled: 'Rescheduled',
} as const;
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const ProcedureCategory = {
  Face:        'Face',
  Body:        'Body',
  NonSurgical: 'NonSurgical',
} as const;
export type ProcedureCategory = typeof ProcedureCategory[keyof typeof ProcedureCategory];

export const ConsultationRequestStatus = {
  New:       'New',
  Contacted: 'Contacted',
  Scheduled: 'Scheduled',
  Closed:    'Closed',
} as const;
export type ConsultationRequestStatus =
  typeof ConsultationRequestStatus[keyof typeof ConsultationRequestStatus];

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  /** Set when the user is linked to a Doctor record (role === "Doctor"). */
  doctorId?: string;
  /** Set when the user is linked to a Patient record (role === "Patient"). */
  patientId?: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;              // computed on the backend from first + last
  email: string;
  phoneNumber: string;
  specializationId: string;      // was `specialization` object; backend sends id + name separately
  specializationName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  bio?: string;
  consultationFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  photoUrl?: string;
  photoPublicId?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth?: string;        // nullable since Google-signup patients may lack it
  age?: number;
  gender?: string;
  email: string;
  phoneNumber?: string;        // nullable, same reason
  address?: Address;
  nationalIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  registeredAt: string;
  lastVisit?: string;
  isProfileComplete?: boolean;

  // Clinical profile — only populated when the caller may see it
  // (self / admin / doctor with a treatment relationship).
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;

  photoUrl?: string;
  photoPublicId?: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  appointmentId?: string;
  appointmentDateTime?: string;
  createdByUserId?: string;
  createdByName?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  labResults?: string;
  notes?: string;
  createdAt: string;
}

export interface UpdateMedicalProfileRequest {
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
}

export interface CreateMedicalHistoryRequest {
  patientId: string;
  appointmentId?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  labResults?: string;
  notes?: string;
}

export type UpdateMedicalHistoryRequest = Omit<CreateMedicalHistoryRequest, 'patientId' | 'appointmentId'>;

export interface Specialization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  doctorCount?: number;    // active doctors assigned (backend computes)
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Schedule {
  id: string;
  doctorId: string;
  /** Backend sends enum NAME (JsonStringEnumConverter): "Monday" / "Tuesday" …
      Use `dayOfWeekToNumber()` from `utils/dayOfWeek` when you need an index. */
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  id: string;
  scheduleId: string;
  slotDateTime: string;
  isAvailable: boolean;
  appointmentId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDateTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  consultationFee: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  appointmentId?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
}

/* ─── Request DTOs for the new clinical endpoints ─── */

export interface CreateSpecializationRequest {
  name: string;
  description?: string;
}
export interface UpdateSpecializationRequest {
  name: string;
  description?: string;
}

export interface CreateDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specializationId: string;
  licenseNumber: string;
  licenseExpiryDate: string;    // ISO date
  bio?: string;
  consultationFee: number;
  photoUrl?: string;
  photoPublicId?: string;
}
export interface UpdateDoctorRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  specializationId?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  bio?: string;
  consultationFee?: number;
  isActive?: boolean;
  photoUrl?: string;
  photoPublicId?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phoneNumber?: string;
  nationalIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: Address;
  photoUrl?: string;
  photoPublicId?: string;
}

export interface UpdatePatientPhotoRequest {
  photoUrl?: string | null;
  photoPublicId?: string | null;
}

export interface CreateScheduleRequest {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  slotDurationMinutes: number;
  effectiveFrom: string;
  effectiveTo?: string;
}
export interface UpdateScheduleRequest {
  dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  scheduledDateTime: string;  // ISO UTC
  durationMinutes: number;
  reason?: string;
}

/* ─── Marketing MVP ─── */

export interface Procedure {
  id: string;
  name: string;
  slug: string;
  category: ProcedureCategory;
  basePrice: number;
  durationMinutes: number;
  recoveryDays: number;
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProcedureRequest {
  name: string;
  slug?: string;
  category: ProcedureCategory;
  basePrice: number;
  durationMinutes: number;
  recoveryDays: number;
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  displayOrder?: number;
}
export interface UpdateProcedureRequest extends Partial<CreateProcedureRequest> {
  isActive?: boolean;
}

export interface BeforeAfterCase {
  id: string;
  procedureId: string;
  procedureName: string;
  doctorId?: string;
  doctorName?: string;
  title: string;
  monthsAfter: number;
  beforeImageUrl: string;
  afterImageUrl: string;
  caption?: string;
  hasPatientConsent: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  publishedAt?: string;
}

export interface CreateBeforeAfterRequest {
  procedureId: string;
  doctorId?: string;
  title: string;
  monthsAfter: number;
  beforeImageUrl: string;
  beforeImagePublicId?: string;
  afterImageUrl: string;
  afterImagePublicId?: string;
  caption?: string;
  hasPatientConsent: boolean;
  displayOrder?: number;
}
export interface UpdateBeforeAfterRequest extends Partial<CreateBeforeAfterRequest> {
  isPublished?: boolean;
}

export interface ConsultationRequestRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  interestedProcedureIds: string[];
  message?: string;
  preferredContactTime?: string;
  source?: string;
  status: ConsultationRequestStatus;
  createdAt: string;
  handledByUserId?: string;
  handledAt?: string;
  internalNotes?: string;
}

export interface CreateConsultationRequestRequest {
  fullName: string;
  email: string;
  phone: string;
  interestedProcedureIds?: string[];
  message?: string;
  preferredContactTime?: string;
  source?: string;
}
export interface UpdateConsultationRequestRequest {
  status?: ConsultationRequestStatus;
  internalNotes?: string;
}

export interface Review {
  id: string;
  patientId: string;
  patientName: string;
  procedureId?: string;
  procedureName?: string;
  doctorId?: string;
  doctorName?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  submittedAt: string;
  approvedAt?: string;
}

export interface CreateReviewRequest {
  procedureId?: string;
  doctorId?: string;
  rating: number;
  comment: string;
}
export interface ModerateReviewRequest {
  approve: boolean;
}

/* ─── Users management (Admin only) ─── */

export interface UserListEntry {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  doctorId?: string;
  doctorName?: string;
  patientId?: string;
  patientName?: string;
  isSelf: boolean;
  isLastAdmin: boolean;
  isGoogleOnly: boolean;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  doctorId?: string;
}
export interface UpdateUserActiveRequest {
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
