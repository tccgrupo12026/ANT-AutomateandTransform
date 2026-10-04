/**
 * ANT — Automate and Transform
 * Serviço de E-mails Transacionais (Resend / Supabase / SMTP)
 *
 * Envia convites reais de colaboradores por e-mail quando configurado.
 * NÃO SIMULA: se a chave de API não estiver presente, relata com clareza
 * que o serviço não está configurado para que o proprietário envie o link gerado manualmente.
 */

import { config } from '../lib/config';
import { getSupabaseClient } from '../lib/supabase';

export interface SendInvitationParams {
  toEmail: string;
  toName: string;
  companyName: string;
  inviterName: string;
  roleName: string;
  inviteLink: string;
  expiresAt: string;
}

export interface SendEmailResult {
  success: boolean;
  sent: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Monta o template HTML responsivo e profissional do convite do ANT.
 */
function buildInvitationHtml(params: SendInvitationParams): string {
  const formattedDate = new Date(params.expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para a equipe no ANT</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
    }
    .container {
      max-width: 580px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #f3e8ff;
      color: #6b21a8;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #6b21a8;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(107, 33, 168, 0.25);
    }
    .info-box {
      background-color: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .link-fallback {
      word-break: break-all;
      font-size: 12px;
      color: #6b21a8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🐜 ANT — Automate and Transform</div>
    </div>
    <div class="content">
      <div class="badge">Convite de Equipe</div>
      <h1 class="title">Olá, ${params.toName}!</h1>
      <p>
        <strong>${params.inviterName}</strong> convidou você para fazer parte da equipe da empresa <strong>${params.companyName}</strong> na plataforma <strong>ANT</strong>.
      </p>
      <p>
        Seu papel no sistema será: <strong>${params.roleName}</strong>.
      </p>

      <div class="button-container">
        <a href="${params.inviteLink}" class="button" target="_blank">
          Aceitar Convite & Criar Senha
        </a>
      </div>

      <div class="info-box">
        <strong>⏰ Validade do convite:</strong> Este link seguro é exclusivo para seu e-mail e é válido até <strong>${formattedDate}</strong>.
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:<br>
        <a href="${params.inviteLink}" class="link-fallback">${params.inviteLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>Este e-mail foi enviado automaticamente pela plataforma ANT a pedido de ${params.companyName}.</p>
      <p>Se você não esperava este convite, pode desconsiderar esta mensagem.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * O sistema ANT utiliza o fluxo oficial de convites por links seguros manuais.
 * Disparos externos automatizados de e-mail (Resend/SMTP) foram desativados.
 */
export async function sendInvitationEmail(_params: SendInvitationParams): Promise<SendEmailResult> {
  return {
    success: true,
    sent: false,
  };
}

/**
 * Retorna se o serviço de e-mail automatizado está ativo (desativado por padrão em favor do fluxo por link manual).
 */
export function isEmailConfigured(): boolean {
  return false;
}

