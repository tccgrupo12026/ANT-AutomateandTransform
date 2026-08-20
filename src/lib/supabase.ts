/**
 * ANT — Automate and Transform
 * Supabase Client Initializer & Authentication Gateway
 *
 * Utilizes @supabase/supabase-js with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
 * Prepares the connection for future tables, data persistence, and Auth without hardcoded secrets.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseClient: SupabaseClient | null = null;

/**
 * Lazy Supabase client getter.
 * Returns null if Supabase environment variables are not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!config.supabase.isConfigured || !config.supabase.url || !config.supabase.publishableKey) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(
        config.supabase.url,
        config.supabase.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      );
    } catch (err) {
      console.warn('Supabase initialization deferred:', err);
      supabaseClient = null;
      return null;
    }
  }

  return supabaseClient;
}

export function isSupabaseConnected(): boolean {
  return config.supabase.isConfigured;
}

export function getSupabaseStatus(): {
  configured: boolean;
  urlPreview: string;
} {
  const url = config.supabase.url;
  return {
    configured: config.supabase.isConfigured,
    urlPreview: url ? url.replace(/^https?:\/\//, '').split('.')[0] + '...' : 'Não configurado',
  };
}
