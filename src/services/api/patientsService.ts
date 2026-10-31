/* Wrapper around PatientsController. All endpoints require auth; the
   /me endpoints return the current patient's profile. */

import { ApiClient } from './apiClient';
import type {
  PaginatedResponse,
  Patient,
  UpdateMedicalProfileRequest,
  UpdatePatientPhotoRequest,
  UpdatePatientRequest,
} from '../../types';

export const patientsService = {
  async getMe(): Promise<Patient | null> {
    const res = await ApiClient.get<Patient>('/v1/patients/me');
    return res.data ?? null;
  },

  async updateMe(req: UpdatePatientRequest): Promise<Patient> {
    const res = await ApiClient.put<Patient>('/v1/patients/me', req);
    return res.data!;
  },

  /** Admin / Staff only. */
  async list(search?: string, pageNumber = 1, pageSize = 20): Promise<PaginatedResponse<Patient>> {
    const parts: string[] = [`pageNumber=${pageNumber}`, `pageSize=${pageSize}`];
    if (search) parts.push(`search=${encodeURIComponent(search)}`);
    const res = await ApiClient.get<PaginatedResponse<Patient>>(`/v1/patients?${parts.join('&')}`);
    return res.data ?? { items: [], totalCount: 0, pageNumber, pageSize, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  },

  async getById(id: string): Promise<Patient | null> {
    const res = await ApiClient.get<Patient>(`/v1/patients/${id}`);
    return res.data ?? null;
  },

  /** Doctor (with a treatment relationship) or Admin only. */
  async updateMedicalProfile(id: string, req: UpdateMedicalProfileRequest): Promise<Patient> {
    const res = await ApiClient.patch<Patient>(`/v1/patients/${id}/medical-profile`, req);
    return res.data!;
  },

  /** Admin / Staff — update a patient's profile photo (Cloudinary URL + public id). */
  async updatePhoto(id: string, req: UpdatePatientPhotoRequest): Promise<Patient> {
    const res = await ApiClient.patch<Patient>(`/v1/patients/${id}/photo`, req);
    return res.data!;
  },
};
