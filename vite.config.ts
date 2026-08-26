import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/ANT-AutomateandTransform/',

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
      'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY || ''),
      'process.env.APP_URL': JSON.stringify(process.env.APP_URL || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY || ''),
      'process.env.RESEND_FROM_EMAIL': JSON.stringify(process.env.RESEND_FROM_EMAIL || ''),
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