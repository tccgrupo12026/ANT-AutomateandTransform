import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseClient: SupabaseClient | null = null;

/**
 * Lazy Supabase client getter.
 * Returns null if Supabase environment variables are not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!config.supabase.isConfigured) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
  }

  return supabaseClient;
}

export function isSupabaseConnected(): boolean {
  return config.supabase.isConfigured;
}
