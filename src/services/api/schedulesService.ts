/* Wrapper around SchedulesController. Reads are public (an unauthenticated
   patient looking at the homepage can see when a doctor works); writes
   require Doctor-owns-self or Admin. */

import { ApiClient } from './apiClient';
import type {
  CreateScheduleRequest,
  Schedule,
  UpdateScheduleRequest,
} from '../../types';

export const schedulesService = {
  async listForDoctor(doctorId: string): Promise<Schedule[]> {
    const res = await ApiClient.get<Schedule[]>(`/v1/doctors/${doctorId}/schedules`);
    return res.data ?? [];
  },

  async createForDoctor(doctorId: string, req: CreateScheduleRequest): Promise<Schedule> {
    const res = await ApiClient.post<Schedule>(`/v1/doctors/${doctorId}/schedules`, req);
    return res.data!;
  },

  async update(id: string, req: UpdateScheduleRequest): Promise<Schedule> {
    const res = await ApiClient.put<Schedule>(`/v1/schedules/${id}`, req);
    return res.data!;
  },

  async deactivate(id: string): Promise<boolean> {
    const res = await ApiClient.delete<boolean>(`/v1/schedules/${id}`);
    return res.success === true;
  },
};
