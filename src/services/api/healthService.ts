/* Wrapper around the public backend health probe (GET /api/health).
   No auth required. Useful for a connection-status indicator in the UI. */

import { ApiClient } from './apiClient';

export interface HealthStatus {
  status: string;      // "healthy"
  timestamp: string;   // ISO-8601 UTC
}

export const healthService = {
  async check(): Promise<HealthStatus> {
    const res = await ApiClient.getInstance().get<HealthStatus>('/health');
    return res.data;
  },

  /** Convenience: resolves to true iff the backend is reachable and
      reports status === "healthy". Never throws. */
  async isUp(): Promise<boolean> {
    try {
      const r = await this.check();
      return r.status === 'healthy';
    } catch {
      return false;
    }
  },
};
