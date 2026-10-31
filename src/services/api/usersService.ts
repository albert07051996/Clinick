/* Wrapper around UsersController. All endpoints require the Admin role —
   the backend double-checks via [Authorize(Roles="Admin")]. */

import { ApiClient } from './apiClient';
import type {
  PaginatedResponse,
  UpdateUserActiveRequest,
  UpdateUserRoleRequest,
  UserListEntry,
  UserRole,
} from '../../types';

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const usersService = {
  async list(filters: UserListFilters = {}): Promise<PaginatedResponse<UserListEntry>> {
    const parts: string[] = [];
    if (filters.search)               parts.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.role)                 parts.push(`role=${filters.role}`);
    if (filters.isActive !== undefined) parts.push(`isActive=${filters.isActive}`);
    if (filters.pageNumber)           parts.push(`pageNumber=${filters.pageNumber}`);
    if (filters.pageSize)             parts.push(`pageSize=${filters.pageSize}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const res = await ApiClient.get<PaginatedResponse<UserListEntry>>(`/v1/users${qs}`);
    return res.data ?? {
      items: [], totalCount: 0, pageNumber: 1, pageSize: 50,
      totalPages: 0, hasNextPage: false, hasPreviousPage: false,
    };
  },

  async getById(id: string): Promise<UserListEntry | null> {
    const res = await ApiClient.get<UserListEntry>(`/v1/users/${id}`);
    return res.data ?? null;
  },

  /** Changes role + optional DoctorId linking. Backend enforces safety rules. */
  async updateRole(id: string, req: UpdateUserRoleRequest): Promise<UserListEntry> {
    const res = await ApiClient.patch<UserListEntry>(`/v1/users/${id}/role`, req);
    return res.data!;
  },

  async setActive(id: string, isActive: boolean): Promise<UserListEntry> {
    const payload: UpdateUserActiveRequest = { isActive };
    const res = await ApiClient.patch<UserListEntry>(`/v1/users/${id}/active`, payload);
    return res.data!;
  },
};
