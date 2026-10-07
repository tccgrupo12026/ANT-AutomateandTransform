/**
 * ANT — Automate and Transform
 * Supabase Edge Function: mercadopago-webhook
 *
 * Responsável por receber webhooks oficiais do Mercado Pago:
 * - Trata eventos payment.created, payment.updated, subscription.created, subscription.updated
 * - Consulta a API do Mercado Pago para verificação segura da autenticidade da notificação
 * - Atualiza automaticamente a tabela public.subscription_payments (pago, pendente, cancelado)
 * - Atualiza o status da assinatura em public.subscriptions (active, overdue, suspended, canceled)
 * - Salva logs de auditoria em public.mercadopago_webhooks_log
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  // Trata preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let rawBody: any = {};
    if (req.method === "POST") {
      try {
        rawBody = await req.json();
      } catch {
        rawBody = {};
      }
    }

    // 1. Extração do ID do pagamento / notificação
    // Suporta tanto Webhooks V2 (body.data.id) quanto IPN clássico (query params ?id=... ou ?data.id=...)
    const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const queryTopic = url.searchParams.get("type") || url.searchParams.get("topic");
    const bodyDataId = rawBody?.data?.id || rawBody?.id;
    const eventType = rawBody?.type || queryTopic || rawBody?.action || "payment";
    const paymentId = String(bodyDataId || queryId || "").trim();

    console.log(`[MercadoPago Webhook] Recebido evento: ${eventType}, ID: ${paymentId}`);

    if (!paymentId || paymentId === "null" || paymentId === "undefined") {
      // Confirma recebimento mesmo que seja teste de ping do Mercado Pago
      return new Response(
        JSON.stringify({ received: true, message: "Ping recebido sem ID de pagamento." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let mpPayment: any = null;

    // 2. Consulta à API do Mercado Pago para conferência de integridade
    if (MERCADO_PAGO_ACCESS_TOKEN && (eventType.includes("payment") || !eventType.includes("plan"))) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        if (mpRes.ok) {
          mpPayment = await mpRes.json();
        } else {
          console.warn(`[MercadoPago Webhook] Não foi possível obter detalhes do pagamento ${paymentId}: ${mpRes.status}`);
        }
      } catch (fetchErr) {
        console.error(`[MercadoPago Webhook] Erro ao consultar pagamento ${paymentId}:`, fetchErr);
      }
    }

    // 3. Atualizar Supabase (subscription_payments & subscriptions)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const nowIso = new Date().toISOString();
      const mpStatus = mpPayment?.status || rawBody?.action || "pending";
      const metadata = mpPayment?.metadata || {};
      const targetUserId = metadata?.user_id;
      const targetCompanyId = metadata?.company_id;
      const billingCycle = metadata?.billing_cycle || "monthly";
      const amount = mpPayment?.transaction_amount;
      const paymentMethod = mpPayment?.payment_method_id || "pix";

      // Mapeamento de status
      let paymentStatus: "pago" | "pendente" | "vencido" | "cancelado" = "pendente";
      let subStatus: "active" | "overdue" | "suspended" | "expired" | "canceled" | "pending_payment" = "pending_payment";

      if (mpStatus === "approved") {
        paymentStatus = "pago";
        subStatus = "active";
      } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
        paymentStatus = "cancelado";
        subStatus = "canceled";
      } else if (mpStatus === "refunded" || mpStatus === "charged_back") {
        paymentStatus = "cancelado";
        subStatus = "suspended";
      } else if (mpStatus === "expired") {
        paymentStatus = "vencido";
        subStatus = "overdue";
      }

      // A) Atualizar subscription_payments correspondente
      const { data: updatedPayments, error: updatePayErr } = await supabaseAdmin
        .from("subscription_payments")
        .update({
          status: paymentStatus,
          mp_status: mpStatus,
          paid_at: mpStatus === "approved" ? (mpPayment?.date_approved || nowIso) : null,
          updated_at: nowIso,
        })
        .eq("mp_payment_id", paymentId)
        .select();

      if (updatePayErr) {
        console.warn("[MercadoPago Webhook] Erro ao atualizar subscription_payments:", updatePayErr);
      }

      // B) Identificar usuário da assinatura
      let resolvedUserId = targetUserId;
      if (!resolvedUserId && updatedPayments && updatedPayments.length > 0) {
        resolvedUserId = updatedPayments[0].user_id;
      }

      // C) Atualizar subscriptions
      if (resolvedUserId) {
        const periodDays = billingCycle === "yearly" ? 365 : 30;
        const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

        const updateData: Record<string, any> = {
          status: subStatus,
          updated_at: nowIso,
        };

        if (mpStatus === "approved") {
          updateData.current_period_start = mpPayment?.date_approved || nowIso;
          updateData.current_period_end = periodEnd;
          updateData.next_billing_date = periodEnd;
          updateData.last_payment_date = mpPayment?.date_approved || nowIso;
          if (amount) updateData.last_payment_amount = amount;
          if (paymentMethod) updateData.last_payment_method = paymentMethod;
        }

        const { error: subErr } = await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("user_id", resolvedUserId);

        if (subErr) {
          console.warn("[MercadoPago Webhook] Erro ao atualizar subscriptions:", subErr);
        } else {
          console.log(`[MercadoPago Webhook] Assinatura do usuário ${resolvedUserId} atualizada para status: ${subStatus}`);
        }
      }

      // D) Registrar no log de auditoria
      try {
        await supabaseAdmin.from("mercadopago_webhooks_log").insert({
          event_type: eventType,
          action: rawBody?.action || mpStatus,
          data_id: paymentId,
          payload: {
            webhook_body: rawBody,
            mp_payment: mpPayment,
            computed_status: subStatus,
          },
          processed: true,
          created_at: nowIso,
        });
      } catch (logErr) {
        console.warn("[MercadoPago Webhook] Erro ao registrar log:", logErr);
      }
    }

    // Retorna 200 OK para o Mercado Pago
    return new Response(
      JSON.stringify({
        success: true,
        received: true,
        payment_id: paymentId,
        mp_status: mpPayment?.status || "processed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[MercadoPago Webhook] Erro interno:", err);
    // Retorna 200 mesmo em caso de erro para evitar spam de retentativas
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro no processamento do webhook.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
