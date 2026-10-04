import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

function resendProxyPlugin(apiKey: string, fromEmail: string) {
  return {
    name: 'resend-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-invite', async (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end('ok');
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const effectiveApiKey =
              apiKey ||
              process.env.RESEND_API_KEY ||
              process.env.VITE_RESEND_API_KEY ||
              '';

            if (!effectiveApiKey) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'RESEND_API_KEY não está configurada no ambiente.',
                })
              );
              return;
            }

            const payload = JSON.parse(body || '{}');
            const { toEmail, companyName, inviteLink, htmlBody } = payload;

            if (!toEmail || !inviteLink) {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'Campos obrigatórios ausentes: toEmail ou inviteLink.',
                })
              );
              return;
            }

            const effectiveFrom =
              fromEmail ||
              process.env.RESEND_FROM_EMAIL ||
              process.env.VITE_RESEND_FROM_EMAIL ||
              'ANT Gestão <convites@resend.dev>';

            const subject = `Convite para a equipe de ${companyName || 'sua empresa'} — ANT`;

            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${effectiveApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: effectiveFrom,
                to: [toEmail],
                subject,
                html: htmlBody,
              }),
            });

            const resendData = await resendResponse.json();

            if (!resendResponse.ok) {
              res.statusCode = resendResponse.status;
              res.end(
                JSON.stringify({
                  success: false,
                  error: resendData.message || `Erro no Resend (HTTP ${resendResponse.status})`,
                  details: resendData,
                })
              );
              return;
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                sent: true,
                messageId: resendData.id,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                success: false,
                error: err.message || 'Erro interno no proxy de e-mail.',
              })
            );
          }
        });
      });
    },
  };
}

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
    base: process.env.GITHUB_PAGES === 'true' ? '/ANT-AutomateandTransform/' : './',

    plugins: [react(), tailwindcss(), resendProxyPlugin(resendApiKey, resendFromEmail)],

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