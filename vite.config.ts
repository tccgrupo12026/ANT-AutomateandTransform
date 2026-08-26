import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const supabaseUrl =
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const supabasePublishableKey =
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const appUrl =
    env.APP_URL ||
    env.VITE_APP_URL ||
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    '';

  const resendApiKey =
    env.RESEND_API_KEY ||
    env.VITE_RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    '';

  const resendFromEmail =
    env.RESEND_FROM_EMAIL ||
    env.VITE_RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.VITE_RESEND_FROM_EMAIL ||
    'ANT Gestão <convites@resend.dev>';

  return {
    base: '/ANT-AutomateandTransform/',

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
      'process.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
      'process.env.APP_URL': JSON.stringify(appUrl),
      'process.env.VITE_APP_URL': JSON.stringify(appUrl),
      'process.env.RESEND_API_KEY': JSON.stringify(resendApiKey),
      'process.env.VITE_RESEND_API_KEY': JSON.stringify(resendApiKey),
      'process.env.RESEND_FROM_EMAIL': JSON.stringify(resendFromEmail),
      'process.env.VITE_RESEND_FROM_EMAIL': JSON.stringify(resendFromEmail),
      'import.meta.env.RESEND_API_KEY': JSON.stringify(resendApiKey),
      'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(resendApiKey),
      'import.meta.env.RESEND_FROM_EMAIL': JSON.stringify(resendFromEmail),
      'import.meta.env.VITE_RESEND_FROM_EMAIL': JSON.stringify(resendFromEmail),
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
      'import.meta.env.APP_URL': JSON.stringify(appUrl),
      'import.meta.env.VITE_APP_URL': JSON.stringify(appUrl),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});