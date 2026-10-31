/* Wrapper around ProceduresController. GET endpoints are public — they feed
   the homepage "Procedures" section with real catalog data. Admin writes. */

import { ApiClient } from './apiClient';
import type {
  CreateProcedureRequest,
  Procedure,
  ProcedureCategory,
  UpdateProcedureRequest,
} from '../../types';

export interface ProcedureListFilters {
  category?: ProcedureCategory;
  isActive?: boolean;
  search?: string;
}

export const proceduresService = {
  async list(filters: ProcedureListFilters = {}): Promise<Procedure[]> {
    const parts: string[] = [];
    if (filters.category)             parts.push(`category=${filters.category}`);
    if (filters.isActive !== undefined) parts.push(`isActive=${filters.isActive}`);
    if (filters.search)               parts.push(`search=${encodeURIComponent(filters.search)}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const res = await ApiClient.get<Procedure[]>(`/v1/procedures${qs}`);
    return res.data ?? [];
  },

  /** Takes either a UUID or a slug ("rhinoplasty"). */
  async getByKey(slugOrId: string): Promise<Procedure | null> {
    const res = await ApiClient.get<Procedure>(`/v1/procedures/${encodeURIComponent(slugOrId)}`);
    return res.data ?? null;
  },

  async create(req: CreateProcedureRequest): Promise<Procedure> {
    const res = await ApiClient.post<Procedure>('/v1/procedures', req);
    return res.data!;
  },

  async update(id: string, req: UpdateProcedureRequest): Promise<Procedure> {
    const res = await ApiClient.put<Procedure>(`/v1/procedures/${id}`, req);
    return res.data!;
  },

  async deactivate(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/procedures/${id}`);
    return res.success === true;
  },
};
