/* Wrapper around BeforeAfterCasesController. Public GET returns only
   cases that are BOTH consented and published; admins see everything. */

import { ApiClient } from './apiClient';
import type {
  BeforeAfterCase,
  CreateBeforeAfterRequest,
  UpdateBeforeAfterRequest,
} from '../../types';

export interface BeforeAfterListFilters {
  procedureId?: string;
  doctorId?: string;
}

export const beforeAfterCasesService = {
  async list(filters: BeforeAfterListFilters = {}): Promise<BeforeAfterCase[]> {
    const parts: string[] = [];
    if (filters.procedureId) parts.push(`procedureId=${filters.procedureId}`);
    if (filters.doctorId)    parts.push(`doctorId=${filters.doctorId}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const res = await ApiClient.get<BeforeAfterCase[]>(`/v1/before-after${qs}`);
    return res.data ?? [];
  },

  async getById(id: string): Promise<BeforeAfterCase | null> {
    const res = await ApiClient.get<BeforeAfterCase>(`/v1/before-after/${id}`);
    return res.data ?? null;
  },

  /** Admin: pre-upload both images via filesService, then supply URLs here. */
  async create(req: CreateBeforeAfterRequest): Promise<BeforeAfterCase> {
    const res = await ApiClient.post<BeforeAfterCase>('/v1/before-after', req);
    return res.data!;
  },

  async update(id: string, req: UpdateBeforeAfterRequest): Promise<BeforeAfterCase> {
    const res = await ApiClient.put<BeforeAfterCase>(`/v1/before-after/${id}`, req);
    return res.data!;
  },

  /** Hard delete + Cloudinary cleanup (backend handles both). */
  async delete(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/before-after/${id}`);
    return res.success === true;
  },
};
