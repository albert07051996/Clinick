/* Wrapper around ConsultationRequestsController.
   POST is anonymous (lead capture from the homepage CTA).
   Admin/Staff endpoints manage the triage queue. */

import { ApiClient } from './apiClient';
import type {
  ConsultationRequestRecord,
  ConsultationRequestStatus,
  CreateConsultationRequestRequest,
  PaginatedResponse,
  UpdateConsultationRequestRequest,
} from '../../types';

export const consultationRequestsService = {
  /** Anonymous — call from the "Book Free Consultation" CTA. */
  async create(req: CreateConsultationRequestRequest): Promise<ConsultationRequestRecord> {
    const res = await ApiClient.post<ConsultationRequestRecord>('/v1/consultation-requests', req);
    return res.data!;
  },

  /** Admin / Staff triage queue. */
  async list(
    status?: ConsultationRequestStatus,
    pageNumber = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<ConsultationRequestRecord>> {
    const parts = [`pageNumber=${pageNumber}`, `pageSize=${pageSize}`];
    if (status) parts.push(`status=${status}`);
    const res = await ApiClient.get<PaginatedResponse<ConsultationRequestRecord>>(
      `/v1/consultation-requests?${parts.join('&')}`,
    );
    return res.data ?? {
      items: [], totalCount: 0, pageNumber, pageSize,
      totalPages: 0, hasNextPage: false, hasPreviousPage: false,
    };
  },

  async getById(id: string): Promise<ConsultationRequestRecord | null> {
    const res = await ApiClient.get<ConsultationRequestRecord>(`/v1/consultation-requests/${id}`);
    return res.data ?? null;
  },

  async update(id: string, req: UpdateConsultationRequestRequest): Promise<ConsultationRequestRecord> {
    const res = await ApiClient.patch<ConsultationRequestRecord>(`/v1/consultation-requests/${id}`, req);
    return res.data!;
  },
};
