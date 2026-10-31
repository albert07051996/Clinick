/* Wrapper around DoctorsController. GET endpoints are public (homepage
   "Our Surgeons" section may call them anonymously). Writes require Admin
   or the Doctor editing their own profile. */

import { ApiClient } from './apiClient';
import type {
  CreateDoctorRequest,
  Doctor,
  PaginatedResponse,
  UpdateDoctorRequest,
} from '../../types';

export interface DoctorListFilters {
  specializationId?: string;
  isActive?: boolean;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const doctorsService = {
  async list(filters: DoctorListFilters = {}): Promise<PaginatedResponse<Doctor>> {
    const qs = toQueryString(filters);
    const res = await ApiClient.get<PaginatedResponse<Doctor>>(`/v1/doctors${qs}`);
    return res.data ?? emptyPage();
  },

  async getById(id: string): Promise<Doctor | null> {
    const res = await ApiClient.get<Doctor>(`/v1/doctors/${id}`);
    return res.data ?? null;
  },

  async create(req: CreateDoctorRequest): Promise<Doctor> {
    const res = await ApiClient.post<Doctor>('/v1/doctors', req);
    return res.data!;
  },

  async update(id: string, req: UpdateDoctorRequest): Promise<Doctor> {
    const res = await ApiClient.put<Doctor>(`/v1/doctors/${id}`, req);
    return res.data!;
  },

  /** Soft-delete (sets IsActive=false on the backend). */
  async deactivate(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/doctors/${id}`);
    return res.success === true;
  },
};

function toQueryString(filters: DoctorListFilters): string {
  const parts: string[] = [];
  if (filters.specializationId) parts.push(`specializationId=${filters.specializationId}`);
  if (filters.isActive !== undefined) parts.push(`isActive=${filters.isActive}`);
  if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
  if (filters.pageNumber) parts.push(`pageNumber=${filters.pageNumber}`);
  if (filters.pageSize) parts.push(`pageSize=${filters.pageSize}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function emptyPage<T>(): PaginatedResponse<T> {
  return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
}
