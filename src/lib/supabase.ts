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
 * Checks whether an error is related to JWT clock skew or token expiration.
 */
export function isJwtError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : err.message || '';
  return (
    msg.includes('JWT issued at future') ||
    msg.includes('JWT expired') ||
    msg.includes('invalid JWT') ||
    msg.includes('token is expired') ||
    msg.includes('invalid claim: iat') ||
    msg.includes('invalid claim: exp') ||
    msg.includes('PGRST301')
  );
}

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

/**
 * Safely executes a Supabase query with automatic recovery/retry if a JWT clock skew or expiration error occurs.
 */
export async function executeWithJwtRecovery<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: { message: 'Cliente Supabase não configurado' } };
  }

  try {
    const result = await queryFn(supabase);
    if (!result.error) {
      return result;
    }

    // If error is JWT-related (e.g. JWT issued at future due to clock skew or stale token)
    if (isJwtError(result.error)) {
      console.warn('Detectado erro de JWT/sessão no Supabase. Tentando renovação automática...', result.error.message);
      try {
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshData?.session) {
          // Retry query with newly refreshed session
          return await queryFn(supabase);
        }
      } catch (refreshEx) {
        console.warn('Falha na renovação do token Supabase:', refreshEx);
      }
    }

    return result;
  } catch (err: any) {
    return { data: null, error: err };
  }
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
