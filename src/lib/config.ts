/**
 * ANT — Automate and Transform
 * Application Configuration Loader
 * Safely accesses system secrets SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
 */

const sanitizeValue = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.startsWith('YOUR_') ||
    trimmed.startsWith('your_') ||
    trimmed === '""' ||
    trimmed === "''"
  ) {
    return '';
  }
  return trimmed;
};

const getEnvVar = (primaryKey: string, fallbackKeys: string[] = []): string => {
  // Check process.env first (defined at build time by Vite)
  if (typeof process !== 'undefined' && process.env && process.env[primaryKey]) {
    const sanitized = sanitizeValue(process.env[primaryKey]);
    if (sanitized) return sanitized;
  }
  for (const fallback of fallbackKeys) {
    if (typeof process !== 'undefined' && process.env && process.env[fallback]) {
      const sanitized = sanitizeValue(process.env[fallback]);
      if (sanitized) return sanitized;
    }
  }
  // Check import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[primaryKey]) {
      const sanitized = sanitizeValue(import.meta.env[primaryKey]);
      if (sanitized) return sanitized;
    }
    for (const fallback of fallbackKeys) {
      if (import.meta.env[fallback]) {
        const sanitized = sanitizeValue(import.meta.env[fallback]);
        if (sanitized) return sanitized;
      }
    }
  }
  return '';
};

const normalizeSupabaseUrl = (rawUrl: string): string => {
  const sanitized = sanitizeValue(rawUrl);
  if (!sanitized) return '';

  let urlCandidate = sanitized;
  if (!urlCandidate.startsWith('http://') && !urlCandidate.startsWith('https://')) {
    urlCandidate = `https://${urlCandidate}`;
  }

  try {
    const parsed = new URL(urlCandidate);
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname) {
      return parsed.origin;
    }
  } catch {
    return '';
  }
  return '';
};

const rawSupabaseUrl = getEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL']);
const validatedSupabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

const supabasePublishableKey = getEnvVar('SUPABASE_PUBLISHABLE_KEY', [
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
]);

const rawResendApiKey = getEnvVar('RESEND_API_KEY', ['VITE_RESEND_API_KEY']);
const rawResendFromEmail = getEnvVar('RESEND_FROM_EMAIL', ['VITE_RESEND_FROM_EMAIL']) || 'ANT Gestão <convites@resend.dev>';

export const config = {
  appName: 'ANT — Automate and Transform',
  appDescription: 'Plataforma web simples, moderna e acessível para gestão de microempresas',
  appUrl: getEnvVar('APP_URL', ['VITE_APP_URL']),
  supabase: {
    url: validatedSupabaseUrl,
    publishableKey: supabasePublishableKey,
    isConfigured: Boolean(validatedSupabaseUrl && supabasePublishableKey),
  },
  email: {
    resendApiKey: rawResendApiKey,
    fromEmail: rawResendFromEmail,
    isConfigured: Boolean(rawResendApiKey && rawResendApiKey.length > 5),
  },
  isProduction: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD),
};

/**
 * Retorna a URL base limpa da aplicação para montagem de links de convite.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}`;
  }
  if (config.appUrl) {
    return config.appUrl;
  }
  return 'https://ant.app';
}


