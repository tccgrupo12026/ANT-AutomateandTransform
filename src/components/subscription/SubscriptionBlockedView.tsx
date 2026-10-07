/**
 * ANT — Automate and Transform
 * Tela de Bloqueio Automático de Assinatura (Fase 3 & 4)
 *
 * Bloqueia módulos operacionais quando:
 * - Trial de 30 dias expirou
 * - Assinatura está vencida / inadimplente (overdue)
 * - Assinatura está suspensa administrativamente (suspended)
 * - Assinatura expirou (expired)
 *
 * Permite acesso apenas à tela de Assinatura (para pagamento via Mercado Pago)
 * e Central de Suporte. Admin ANT possui acesso total contínuo.
 */

import React from 'react';
import {
  ShieldAlert,
  Crown,
  Zap,
  LifeBuoy,
  CreditCard,
  QrCode,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { NavigationSection } from '../../types';

interface SubscriptionBlockedViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const SubscriptionBlockedView: React.FC<SubscriptionBlockedViewProps> = ({ onNavigate }) => {
  const { companyName } = useAuth();
  const { summary } = useSubscription();

  const isTrialExpired = summary?.isExpired && summary?.subscription?.status === 'trial';
  const isOverdue = summary?.isOverdue;
  const isSuspended = summary?.isSuspended;

  const getBlockTitle = () => {
    if (isTrialExpired) return 'Período de Testes de 30 Dias Finalizado';
    if (isOverdue) return 'Assinatura com Pagamento Pendente ou Vencido';
    if (isSuspended) return 'Assinatura Temporariamente Suspensa';
    return 'Assinatura Expirada';
  };

  const getBlockDescription = () => {
    if (isTrialExpired) {
      return `O período de avaliação gratuita da sua empresa (${companyName || 'Sua Empresa'}) terminou. Todos os seus dados de estoque, produtos e financeiro estão 100% seguros e preservados. Para continuar operando e desbloquear todos os módulos, escolha seu plano ANT.`;
    }
    if (isOverdue) {
      return `Identificamos uma fatura pendente de quitação para a empresa ${companyName || 'Sua Empresa'}. Para restabelecer o acesso completo imediato aos módulos operacionais, efetue o pagamento via PIX ou Cartão de Crédito no Mercado Pago.`;
    }
    if (isSuspended) {
      return `O acesso operacional da empresa ${companyName || 'Sua Empresa'} encontra-se suspenso preventivamente. Regularize sua assinatura ou entre em contato com nosso time de atendimento para reativação.`;
    }
    return `Sua assinatura anterior expirou. Renove seu plano para recuperar o acesso instantâneo a todos os recursos da plataforma.`;
  };

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200 dark:border-rose-900/60 shadow-xl overflow-hidden">
        {/* Top Accent Strip */}
        <div className="h-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Bloqueio Preventivo de Módulos
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Empresa: <strong>{companyName || 'Minha Empresa'}</strong>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {getBlockTitle()}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {getBlockDescription()}
              </p>
            </div>
          </div>

          {/* Card de Informações e Benefícios de Regularização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Dados Preservados</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Produtos, clientes, fluxo de caixa e notas permanecem salvos com segurança.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-bold">
                <Zap className="w-4 h-4" />
                <span>Reativação Imediata</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagamentos via PIX e Cartão liberam todos os módulos operacionais instantaneamente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CreditCard className="w-4 h-4" />
                <span>Simulação de Gateway</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fluxo simulado com PIX (QR Code demonstrativo), Cartão de Crédito e Boleto Bancário.
              </p>
            </div>
          </div>

          {/* Formas de Pagamento Aceitas */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ANT
              </div>
              <div>
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200 block">
                  Simulação de Pagamento (Ambiente Acadêmico — TCC)
                </span>
                <span className="text-[11px] text-purple-800 dark:text-purple-300">
                  PIX Instantâneo • Cartão de Crédito • Boleto Bancário (Demonstrativo)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ambiente de Demonstração</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('suporte')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-purple-600" />
              <span>Precisa de Ajuda? Falar com Suporte</span>
            </button>

            <button
              onClick={() => onNavigate('planos')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Ir para Assinatura & Pagar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
