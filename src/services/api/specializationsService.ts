/* Wrapper around SpecializationsController. GET endpoints are public,
   create/update/delete require an Admin JWT. */

import { ApiClient } from './apiClient';
import type {
  CreateSpecializationRequest,
  Specialization,
  UpdateSpecializationRequest,
} from '../../types';

export const specializationsService = {
  async list(): Promise<Specialization[]> {
    const res = await ApiClient.get<Specialization[]>('/v1/specializations');
    return res.data ?? [];
  },

  async getById(id: string): Promise<Specialization | null> {
    const res = await ApiClient.get<Specialization>(`/v1/specializations/${id}`);
    return res.data ?? null;
  },

  async create(req: CreateSpecializationRequest): Promise<Specialization> {
    const res = await ApiClient.post<Specialization>('/v1/specializations', req);
    return res.data!;
  },

  async update(id: string, req: UpdateSpecializationRequest): Promise<Specialization> {
    const res = await ApiClient.put<Specialization>(`/v1/specializations/${id}`, req);
    return res.data!;
  },

  async delete(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/specializations/${id}`);
    return res.success === true;
  },
};
