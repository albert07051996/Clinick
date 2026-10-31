/* Wrapper around AppointmentsController. All endpoints require auth. */

import { ApiClient } from './apiClient';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  PaginatedResponse,
} from '../../types';

export interface AppointmentListFilters {
  status?: AppointmentStatus;
  pageNumber?: number;
  pageSize?: number;
  /** ISO 8601 — half-open range used by the admin calendar. */
  from?: string;
  to?: string;
  /** Admin-only — narrow to one doctor. */
  doctorId?: string;
}

/** Richer than the base Appointment: carries UI-ready fields the backend precomputed. */
export interface AppointmentWithContext extends Appointment {
  patientName: string;
  doctorName: string;
  doctorSpecialization: string;
  canBeCancelled: boolean;
  canBeCompleted: boolean;
}

export const appointmentsService = {
  /** Patients see their own, doctors see theirs, admins see all. */
  async mine(filters: AppointmentListFilters = {}): Promise<PaginatedResponse<AppointmentWithContext>> {
    const parts: string[] = [];
    if (filters.status)     parts.push(`status=${filters.status}`);
    if (filters.pageNumber) parts.push(`pageNumber=${filters.pageNumber}`);
    if (filters.pageSize)   parts.push(`pageSize=${filters.pageSize}`);
    if (filters.from)       parts.push(`from=${encodeURIComponent(filters.from)}`);
    if (filters.to)         parts.push(`to=${encodeURIComponent(filters.to)}`);
    if (filters.doctorId)   parts.push(`doctorId=${filters.doctorId}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const res = await ApiClient.get<PaginatedResponse<AppointmentWithContext>>(`/v1/appointments/mine${qs}`);
    return res.data ?? { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  },

  async getById(id: string): Promise<AppointmentWithContext | null> {
    const res = await ApiClient.get<AppointmentWithContext>(`/v1/appointments/${id}`);
    return res.data ?? null;
  },

  async create(req: CreateAppointmentRequest): Promise<AppointmentWithContext> {
    const res = await ApiClient.post<AppointmentWithContext>('/v1/appointments', req);
    return res.data!;
  },

  async cancel(id: string): Promise<AppointmentWithContext> {
    const res = await ApiClient.patch<AppointmentWithContext>(`/v1/appointments/${id}/cancel`);
    return res.data!;
  },

  async complete(id: string, notes?: string): Promise<AppointmentWithContext> {
    const qs = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const res = await ApiClient.patch<AppointmentWithContext>(`/v1/appointments/${id}/complete${qs}`);
    return res.data!;
  },
};
