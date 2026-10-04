/**
 * ANT — Automate and Transform
 * Servidor Full-Stack Express (Produção & Proxy de APIs)
 *
 * Provê o endpoint `/api/send-invite` seguro para disparo de e-mails via Resend
 * sem expor a chave de API no frontend e sem sofrer bloqueios de CORS do navegador.
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Proxy seguro para envio de e-mails via Resend
app.post('/api/send-invite', async (req, res) => {
  const apiKey =
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    '';

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.VITE_RESEND_FROM_EMAIL ||
    'ANT Gestão <convites@resend.dev>';

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'RESEND_API_KEY não está configurada no ambiente.',
    });
  }

  const { toEmail, companyName, inviteLink, htmlBody } = req.body || {};

  if (!toEmail || !inviteLink) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios ausentes: toEmail ou inviteLink.',
    });
  }

  try {
    const subject = `Convite para a equipe de ${companyName || 'sua empresa'} — ANT`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(resendResponse.status).json({
        success: false,
        error: resendData.message || `Erro no Resend (HTTP ${resendResponse.status})`,
        details: resendData,
      });
    }

    return res.status(200).json({
      success: true,
      sent: true,
      messageId: resendData.id,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro interno no envio de e-mail.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ANT] Servidor escutando na porta ${port}`);
  });
}

startServer().catch((err) => {
  console.error('[ANT] Falha ao iniciar servidor:', err);
});
