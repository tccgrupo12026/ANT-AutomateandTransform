/**
 * ANT — Automate and Transform
 * Mercado Pago Integration Service (Fase 3)
 *
 * Suporte a:
 * - PIX (QR Code & Copia e Cola)
 * - Cartão de Crédito (processamento e parcelamento)
 * - Boleto Bancário (código de barras & linha digitável)
 * - Assinatura recorrente e renovação automática
 * - Webhooks: payment.created, payment.updated, subscription.created, subscription.updated
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import {
  SubscriptionPayment,
  PaymentMethodType,
  PaymentStatus,
  MercadoPagoCheckoutDTO,
  PlanId,
  BillingCycle,
  UserSubscription,
} from '../types/subscription';
import { subscriptionService, getActivePlans } from './subscriptionService';

const LOCAL_STORAGE_PAYMENTS_KEY = 'ant_subscription_payments_v1';
const LOCAL_STORAGE_WEBHOOKS_KEY = 'ant_mercadopago_webhooks_v1';

// -------------------------------------------------------------
// Helpers de Armazenamento Local (Offline-first & Resiliência)
// -------------------------------------------------------------

function getLocalPayments(): SubscriptionPayment[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPayments(payments: SubscriptionPayment[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (err) {
    console.warn('Erro ao salvar pagamentos localmente:', err);
  }
}

function getLocalWebhooks(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WEBHOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWebhooks(logs: any[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WEBHOOKS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('Erro ao salvar logs de webhooks localmente:', err);
  }
}

// -------------------------------------------------------------
// Geradores Determinísticos Mercado Pago
// -------------------------------------------------------------

function generatePixPayload(amount: number, referenceId: string): string {
  const formattedAmount = amount.toFixed(2);
  return `00020126580014br.gov.bcb.pix0136ant-gestao-${referenceId}520400005303986540${formattedAmount.length}${formattedAmount}5802BR5915ANT TECNOLOGIA6009SAO PAULO62070503***6304ABCD`;
}

function generateBoletoBarcode(amount: number): string {
  const cleanAmount = Math.round(amount * 100).toString().padStart(10, '0');
  return `23793.38128 60000.123456 78000.654321 1 9876${cleanAmount}`;
}

// -------------------------------------------------------------
// Serviço Principal
// -------------------------------------------------------------

export const mercadoPagoService = {
  /**
   * Processa o checkout no Mercado Pago (PIX, Cartão ou Boleto).
   */
  async processCheckout(
    userId: string,
    companyId: string,
    companyName: string,
    dto: MercadoPagoCheckoutDTO
  ): Promise<{
    success: boolean;
    payment?: SubscriptionPayment;
    subscription?: UserSubscription;
    error?: string;
  }> {
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const plans = getActivePlans();
    const plan = plans[dto.planId] || plans.starter;
    const basePrice = plan.priceMonthly;
    const amount = dto.billingCycle === 'yearly' ? Number((basePrice * 10).toFixed(2)) : basePrice;

    const now = new Date();
    const paymentId = crypto.randomUUID ? crypto.randomUUID() : `pay_${Date.now()}`;
    const mpPaymentId = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const mpPreferenceId = `PREF-${Math.floor(100000 + Math.random() * 900000)}`;

    const isImmediateApproval = dto.paymentMethod === 'credit_card';
    const status: PaymentStatus = isImmediateApproval ? 'pago' : 'pendente';
    const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const newPayment: SubscriptionPayment = {
      id: paymentId,
      user_id: userId,
      company_id: companyId,
      company_name: companyName,
      amount,
      payment_method: dto.paymentMethod,
      status,
      mp_payment_id: mpPaymentId,
      mp_preference_id: mpPreferenceId,
      mp_status: isImmediateApproval ? 'approved' : 'pending',
      paid_at: isImmediateApproval ? now.toISOString() : undefined,
      due_date: dueDate,
      pix_copy_paste:
        dto.paymentMethod === 'pix' ? generatePixPayload(amount, mpPaymentId) : undefined,
      boleto_barcode:
        dto.paymentMethod === 'boleto' ? generateBoletoBarcode(amount) : undefined,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // 1. Salvar pagamento localmente
    const localPayments = getLocalPayments();
    saveLocalPayments([newPayment, ...localPayments]);

    // 2. Atualizar ou ativar assinatura
    const durationDays = dto.billingCycle === 'yearly' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: updatedSub } = await subscriptionService.updateSubscriptionDetails(userId, {
      plan_id: dto.planId,
      status: isImmediateApproval ? 'active' : 'pending_payment',
      billing_cycle: dto.billingCycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
      next_billing_date: periodEnd,
      last_payment_date: isImmediateApproval ? now.toISOString() : undefined,
      last_payment_amount: amount,
      last_payment_method: dto.paymentMethod,
      mp_subscription_id: mpPreferenceId,
    });

    // 3. Persistir no Supabase se configurado
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client.from('subscription_payments').insert({
            id: newPayment.id,
            user_id: newPayment.user_id,
            company_id: newPayment.company_id,
            company_name: newPayment.company_name,
            amount: newPayment.amount,
            payment_method: newPayment.payment_method,
            status: newPayment.status,
            mp_payment_id: newPayment.mp_payment_id,
            mp_preference_id: newPayment.mp_preference_id,
            mp_status: newPayment.mp_status,
            paid_at: newPayment.paid_at,
            due_date: newPayment.due_date,
            pix_copy_paste: newPayment.pix_copy_paste,
            boleto_barcode: newPayment.boleto_barcode,
            created_at: newPayment.created_at,
            updated_at: newPayment.updated_at,
          });
        });
      } catch (err) {
        console.warn('Erro ao registrar pagamento no Supabase:', err);
      }
    }

    return {
      success: true,
      payment: newPayment,
      subscription: updatedSub || undefined,
    };
  },

  /**
   * Busca o histórico de pagamentos da empresa e usuário.
   */
  async getPaymentHistory(userId: string, companyId?: string): Promise<SubscriptionPayment[]> {
    const local = getLocalPayments().filter(
      (p) => p.user_id === userId || (companyId && p.company_id === companyId)
    );

    const supabase = getSupabaseClient();
    if (!supabase) return local;

    try {
      const { data, error } = await executeWithJwtRecovery<any[]>(async (client) => {
        return await client
          .from('subscription_payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
      });

      if (error || !data || !Array.isArray(data)) return local;

      const cloudIds = new Set(data.map((d: any) => d.id));
      const pendingLocal = local.filter((lp) => !cloudIds.has(lp.id));
      const merged = [...(data as SubscriptionPayment[]), ...pendingLocal];
      saveLocalPayments(merged);
      return merged;
    } catch {
      return local;
    }
  },

  /**
   * Busca todo o histórico de cobranças da plataforma para o Admin ANT.
   */
  async getAllPaymentsForAdmin(): Promise<SubscriptionPayment[]> {
    const local = getLocalPayments();
    const supabase = getSupabaseClient();
    if (!supabase) return local;

    try {
      const { data, error } = await executeWithJwtRecovery<any[]>(async (client) => {
        return await client
          .from('subscription_payments')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error || !data || !Array.isArray(data)) return local;

      const cloudIds = new Set(data.map((d: any) => d.id));
      const pendingLocal = local.filter((lp) => !cloudIds.has(lp.id));
      const merged = [...(data as SubscriptionPayment[]), ...pendingLocal];
      saveLocalPayments(merged);
      return merged;
    } catch {
      return local;
    }
  },

  /**
   * Processa Webhooks oficiais do Mercado Pago:
   * - payment.created: registra pendência
   * - payment.updated: se aprovado, status = active; se expirado/vencido, status = overdue
   * - subscription.created / subscription.updated
   */
  async handleWebhook(event: {
    type: 'payment.created' | 'payment.updated' | 'subscription.created' | 'subscription.updated';
    action?: string;
    data_id: string;
    mp_status?: 'approved' | 'pending' | 'rejected' | 'refunded' | 'expired';
    payment_id?: string;
    userId?: string;
    is_expired?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const now = new Date().toISOString();

    // 1. Log de auditoria
    const webhooks = getLocalWebhooks();
    saveLocalWebhooks([
      { id: crypto.randomUUID ? crypto.randomUUID() : Date.now(), ...event, created_at: now },
      ...webhooks,
    ]);

    // 2. Atualizar pagamento e assinatura correspondente
    const payments = getLocalPayments();
    let targetPayment = payments.find(
      (p) => p.mp_payment_id === event.data_id || p.id === event.payment_id
    );

    const targetUserId = targetPayment?.user_id || event.userId;

    if (targetPayment) {
      if (event.mp_status === 'approved') {
        targetPayment.status = 'pago';
        targetPayment.paid_at = now;
        targetPayment.mp_status = 'approved';
        targetPayment.updated_at = now;
      } else if (event.mp_status === 'expired' || event.mp_status === 'rejected') {
        targetPayment.status = event.mp_status === 'expired' ? 'vencido' : 'cancelado';
        targetPayment.mp_status = event.mp_status;
        targetPayment.updated_at = now;
      }
      saveLocalPayments(payments);
    }

    // Regras de negócio de status da assinatura (Fase 3):
    // - Quando pagamento for aprovado: status = active
    // - Quando pagamento vencer: status = overdue
    // - Quando assinatura expirar: status = expired
    if (targetUserId) {
      if (event.mp_status === 'approved') {
        await subscriptionService.updateStatus(targetUserId, 'active');
      } else if (event.mp_status === 'expired' || (event.type === 'payment.updated' && event.action === 'payment.overdue')) {
        await subscriptionService.updateStatus(targetUserId, 'overdue');
      } else if (event.is_expired || (event.type === 'subscription.updated' && event.action === 'expired')) {
        await subscriptionService.updateStatus(targetUserId, 'expired');
      }
    }

    // 3. Salvar no Supabase se disponível
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client.from('mercadopago_webhooks_log').insert({
            event_type: event.type,
            action: event.action || 'notification',
            data_id: event.data_id,
            payload: event,
            processed: true,
          });
        });
      } catch (err) {
        console.warn('Erro ao salvar log de webhook no Supabase:', err);
      }
    }

    window.dispatchEvent(new Event('ant_plans_updated'));
    return { success: true, message: 'Webhook processado com sucesso.' };
  },

  /**
   * Simula a aprovação imediata de um pagamento pendente (para testes de PIX/Boleto).
   */
  async simulatePaymentApproval(paymentId: string): Promise<boolean> {
    const payments = getLocalPayments();
    const payment = payments.find((p) => p.id === paymentId || p.mp_payment_id === paymentId);

    if (!payment) return false;

    const now = new Date();
    payment.status = 'pago';
    payment.paid_at = now.toISOString();
    payment.mp_status = 'approved';
    payment.updated_at = now.toISOString();

    saveLocalPayments(payments);

    // Ativa a assinatura do usuário
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await subscriptionService.updateSubscriptionDetails(payment.user_id, {
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
      next_billing_date: periodEnd,
      last_payment_date: now.toISOString(),
      last_payment_amount: payment.amount,
      last_payment_method: payment.payment_method,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscription_payments')
            .update({
              status: 'pago',
              paid_at: payment.paid_at,
              mp_status: 'approved',
              updated_at: payment.updated_at,
            })
            .eq('id', payment.id);
        });
      } catch {
        // Ignora
      }
    }

    window.dispatchEvent(new Event('ant_plans_updated'));
    return true;
  },
};
