import type { SupabaseClient } from '@supabase/supabase-js';
import { createBandieClient, getAppCode, type BandieClientConfig } from './client';
import { initBandieDataMode } from './testDataMode';

let bandieClient: SupabaseClient | null = null;

export function initBandieData(config: BandieClientConfig): SupabaseClient {
  initBandieDataMode(config.dataMode);
  bandieClient = createBandieClient(config);
  return bandieClient;
}

export function getBandieClient(): SupabaseClient {
  if (!bandieClient) {
    throw new Error('Bandie data layer not initialised. Call initBandieData() first.');
  }
  return bandieClient;
}

export function getBandieAppCode(): string {
  return getAppCode();
}
