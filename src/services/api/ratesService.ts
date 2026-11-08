/* Wrapper around RatesController. Public endpoint — no auth required.
   Rates are the NBG official exchange rates, served with a ~1h server-side cache. */

import { ApiClient } from './apiClient';

export interface ExchangeRateItem {
  code: string;   // "USD", "RUB", ...
  rate: number;   // GEL per 1 unit of this currency
  date: string;   // ISO date
}

export interface ExchangeRatesResponse {
  fetchedAt: string;
  rates: ExchangeRateItem[];
}

export const ratesService = {
  async get(codes: string[]): Promise<ExchangeRatesResponse | null> {
    const query = codes.length ? `?codes=${encodeURIComponent(codes.join(','))}` : '';
    const res = await ApiClient.get<ExchangeRatesResponse>(`/v1/rates${query}`);
    return res.data ?? null;
  },
};
