/**
 * ANT — Automate and Transform
 * Supabase Edge Function: send-invite
 *
 * Dispara e-mails de convite utilizando a API da Resend.
 * Executada no ambiente serverless Deno do Supabase Edge Functions.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  toEmail: string;
  toName: string;
  companyName: string;
  inviterName: string;
  roleName: string;
  inviteLink: string;
  expiresAt: string;
}

serve(async (req) => {
  // Trata preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "ANT Gestão <convites@resend.dev>";

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY não está configurada nos Secrets do Supabase.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: InvitePayload = await req.json();

    if (!payload.toEmail || !payload.inviteLink) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos obrigatórios ausentes: toEmail ou inviteLink.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedDate = new Date(payload.expiresAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite de Equipe — ANT</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#6b21a8 0%,#4c1d95 100%);padding:32px 24px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#ffffff;">🐜 ANT — Automate and Transform</div>
    </div>
    <div style="padding:32px 28px;">
      <div style="display:inline-block;padding:4px 12px;background-color:#f3e8ff;color:#6b21a8;border-radius:9999px;font-size:12px;font-weight:700;margin-bottom:16px;">Convite de Equipe</div>
      <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:16px;">Olá, ${payload.toName}!</h1>
      <p><strong>${payload.inviterName}</strong> convidou você para fazer parte da equipe da empresa <strong>${payload.companyName}</strong> na plataforma <strong>ANT</strong>.</p>
      <p>Seu papel no sistema será: <strong>${payload.roleName}</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${payload.inviteLink}" style="display:inline-block;padding:14px 32px;background-color:#6b21a8;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:12px;box-shadow:0 4px 12px rgba(107,33,168,0.25);" target="_blank">
          Aceitar Convite & Criar Senha
        </a>
      </div>
      <div style="background-color:#f1f5f9;border-radius:12px;padding:16px;margin:20px 0;font-size:13px;color:#475569;">
        <strong>⏰ Validade do convite:</strong> Este link seguro é exclusivo para seu e-mail e é válido até <strong>${formattedDate}</strong>.
      </div>
      <p style="font-size:13px;color:#64748b;">
        Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:<br>
        <a href="${payload.inviteLink}" style="word-break:break-all;color:#6b21a8;">${payload.inviteLink}</a>
      </p>
    </div>
    <div style="background-color:#f8fafc;padding:24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
      <p>Este e-mail foi enviado automaticamente pela plataforma ANT a pedido de ${payload.companyName}.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.toEmail],
        subject: `Convite para a equipe de ${payload.companyName} — ANT`,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.message || `Erro no Resend (HTTP ${resendResponse.status})`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno na Edge Function",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
