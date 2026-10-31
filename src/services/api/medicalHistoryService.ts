/* Wrapper around MedicalHistoryController.
   Doctors create/amend; patients read their own. All endpoints require auth. */

import { ApiClient } from './apiClient';
import type {
  CreateMedicalHistoryRequest,
  MedicalHistory,
  UpdateMedicalHistoryRequest,
} from '../../types';

export const medicalHistoryService = {
  /** Full timeline for a patient, newest first. */
  async listForPatient(patientId: string): Promise<MedicalHistory[]> {
    const res = await ApiClient.get<MedicalHistory[]>(`/v1/medical-history/patient/${patientId}`);
    return res.data ?? [];
  },

  /** Doctor adds a visit note. */
  async create(req: CreateMedicalHistoryRequest): Promise<MedicalHistory> {
    const res = await ApiClient.post<MedicalHistory>('/v1/medical-history', req);
    return res.data!;
  },

  /** Author (or Admin) amends an existing note. */
  async update(id: string, req: UpdateMedicalHistoryRequest): Promise<MedicalHistory> {
    const res = await ApiClient.patch<MedicalHistory>(`/v1/medical-history/${id}`, req);
    return res.data!;
  },
};
