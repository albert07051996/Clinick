/* Wrapper around ReviewsController.
   Public GET returns only approved reviews. Patients submit (authenticated),
   admins moderate. */

import { ApiClient } from './apiClient';
import type {
  CreateReviewRequest,
  ModerateReviewRequest,
  PaginatedResponse,
  Review,
} from '../../types';

export interface ReviewListFilters {
  procedureId?: string;
  doctorId?: string;
  isApproved?: boolean;         // only admins may pass `false`
  pageNumber?: number;
  pageSize?: number;
}

export const reviewsService = {
  async list(filters: ReviewListFilters = {}): Promise<PaginatedResponse<Review>> {
    const parts: string[] = [];
    if (filters.procedureId)        parts.push(`procedureId=${filters.procedureId}`);
    if (filters.doctorId)           parts.push(`doctorId=${filters.doctorId}`);
    if (filters.isApproved !== undefined) parts.push(`isApproved=${filters.isApproved}`);
    if (filters.pageNumber)         parts.push(`pageNumber=${filters.pageNumber}`);
    if (filters.pageSize)           parts.push(`pageSize=${filters.pageSize}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const res = await ApiClient.get<PaginatedResponse<Review>>(`/v1/reviews${qs}`);
    return res.data ?? {
      items: [], totalCount: 0, pageNumber: 1, pageSize: 20,
      totalPages: 0, hasNextPage: false, hasPreviousPage: false,
    };
  },

  async create(req: CreateReviewRequest): Promise<Review> {
    const res = await ApiClient.post<Review>('/v1/reviews', req);
    return res.data!;
  },

  async moderate(id: string, req: ModerateReviewRequest): Promise<Review> {
    const res = await ApiClient.patch<Review>(`/v1/reviews/${id}/moderate`, req);
    return res.data!;
  },

  async delete(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/reviews/${id}`);
    return res.success === true;
  },
};
