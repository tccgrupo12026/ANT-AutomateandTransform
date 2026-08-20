/**
 * Application configuration loader.
 * Safely accesses client-side environment variables with fallbacks.
 */

export const config = {
  appUrl: import.meta.env.VITE_APP_URL || '',
  supabase: {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    isConfigured: Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ),
  },
  isProduction: import.meta.env.PROD,
};
