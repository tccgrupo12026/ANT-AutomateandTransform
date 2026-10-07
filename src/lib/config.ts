/**
 * ANT — Automate and Transform
 * Application Configuration Loader
 * Safely accesses system secrets SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
 */

/**
 * ANT — Automate and Transform
 * Application Configuration Loader
 * Safely accesses system secrets SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY and RESEND_FROM_EMAIL.
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

export const getSupabaseUrl = (): string => {
  // Static read for Vite AST replacement
  let raw = '';
  try {
    raw = sanitizeValue(process.env.SUPABASE_URL) || sanitizeValue(process.env.VITE_SUPABASE_URL);
  } catch {}
  if (!raw) {
    try {
      raw = sanitizeValue(import.meta.env.SUPABASE_URL) || sanitizeValue(import.meta.env.VITE_SUPABASE_URL);
    } catch {}
  }
  if (!raw) return '';

  let urlCandidate = raw;
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

export const getSupabasePublishableKey = (): string => {
  try {
    const p1 = sanitizeValue(process.env.SUPABASE_PUBLISHABLE_KEY);
    if (p1) return p1;
    const p2 = sanitizeValue(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    if (p2) return p2;
  } catch {}

  try {
    const m1 = sanitizeValue(import.meta.env.SUPABASE_PUBLISHABLE_KEY);
    if (m1) return m1;
    const m2 = sanitizeValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    if (m2) return m2;
  } catch {}

  return '';
};

export const getResendApiKey = (): string => {
  try {
    const p1 = sanitizeValue(process.env.RESEND_API_KEY);
    if (p1) return p1;
    const p2 = sanitizeValue(process.env.VITE_RESEND_API_KEY);
    if (p2) return p2;
  } catch {}

  try {
    const m1 = sanitizeValue(import.meta.env.RESEND_API_KEY);
    if (m1) return m1;
    const m2 = sanitizeValue(import.meta.env.VITE_RESEND_API_KEY);
    if (m2) return m2;
  } catch {}

  return '';
};

export const getResendFromEmail = (): string => {
  try {
    const p1 = sanitizeValue(process.env.RESEND_FROM_EMAIL);
    if (p1) return p1;
    const p2 = sanitizeValue(process.env.VITE_RESEND_FROM_EMAIL);
    if (p2) return p2;
  } catch {}

  try {
    const m1 = sanitizeValue(import.meta.env.RESEND_FROM_EMAIL);
    if (m1) return m1;
    const m2 = sanitizeValue(import.meta.env.VITE_RESEND_FROM_EMAIL);
    if (m2) return m2;
  } catch {}

  return 'ANT Gestão <convites@resend.dev>';
};

export const getMercadoPagoPublicKey = (): string => {
  try {
    const p1 = sanitizeValue(process.env.MERCADO_PAGO_PUBLIC_KEY);
    if (p1) return p1;
    const p2 = sanitizeValue(process.env.VITE_MERCADO_PAGO_PUBLIC_KEY);
    if (p2) return p2;
  } catch {}

  try {
    const m1 = sanitizeValue(import.meta.env.MERCADO_PAGO_PUBLIC_KEY);
    if (m1) return m1;
    const m2 = sanitizeValue(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY);
    if (m2) return m2;
  } catch {}

  return '';
};

export const getAppUrl = (): string => {
  try {
    const p = sanitizeValue(process.env.APP_URL) || sanitizeValue(process.env.VITE_APP_URL);
    if (p) return p;
  } catch {}
  try {
    const m = sanitizeValue(import.meta.env.APP_URL) || sanitizeValue(import.meta.env.VITE_APP_URL);
    if (m) return m;
  } catch {}
  return '';
};

export const config = {
  appName: 'ANT — Automate and Transform',
  appDescription: 'Plataforma web simples, moderna e acessível para gestão de microempresas',
  get appUrl() {
    return getAppUrl();
  },
  get supabase() {
    const url = getSupabaseUrl();
    const key = getSupabasePublishableKey();
    return {
      url,
      publishableKey: key,
      isConfigured: Boolean(url && key),
    };
  },
  get email() {
    const apiKey = getResendApiKey();
    const fromEmail = getResendFromEmail() || 'ANT Gestão <convites@resend.dev>';
    return {
      resendApiKey: apiKey,
      fromEmail: fromEmail,
      isConfigured: Boolean(apiKey && apiKey.length > 5),
    };
  },
  get mercadoPago() {
    const publicKey = getMercadoPagoPublicKey();
    return {
      publicKey,
      isConfigured: Boolean(publicKey),
    };
  },
  isProduction: typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD),
};

/**
 * Retorna a URL base limpa da aplicação para montagem de links de convite.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    let pathname = window.location.pathname || '';
    if (pathname.endsWith('/index.html')) {
      pathname = pathname.replace(/\/index\.html$/, '');
    }
    // Remove trailing slash
    pathname = pathname.replace(/\/$/, '');
    return `${origin}${pathname}`;
  }
  if (config.appUrl) {
    return config.appUrl.replace(/\/$/, '');
  }
  return 'https://ant.app';
}


