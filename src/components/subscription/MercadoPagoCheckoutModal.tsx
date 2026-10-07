/**
 * ANT — Automate and Transform
 * Modal de Checkout Demonstrativo (Fase 3 — Projeto Acadêmico / TCC)
 *
 * Características da Arquitetura Acadêmica:
 * - Pagamento Simulado: PIX, Boleto e Cartão de Crédito
 * - QR Code demonstrativo para validação do fluxo operacional
 * - Independente de tokens ou serviços externos de cobrança
 * - Validação integral de regras de negócio: estados da assinatura, bloqueio e reativação
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
  Info,
  GraduationCap,
} from 'lucide-react';
import {
  BillingCycle,
  PaymentMethodType,
  PlanDetails,
  SubscriptionPayment,
} from '../../types/subscription';
import { mercadoPagoService, generateDemonstrativeQrCodeSvg } from '../../services/mercadoPagoService';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface MercadoPagoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanDetails;
  initialCycle?: BillingCycle;
  onSuccess?: () => void;
}

export const MercadoPagoCheckoutModal: React.FC<MercadoPagoCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  initialCycle = 'monthly',
  onSuccess,
}) => {
  const { user, companyName, fullName } = useAuth();
  const { refreshSubscription } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedBarcode, setCopiedBarcode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dados do Cartão (Simulação)
  const [cardNumber, setCardNumber] = useState<string>('4532 1178 9012 3456');
  const [cardName, setCardName] = useState<string>(fullName || companyName || 'NOME NO CARTAO');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [installments, setInstallments] = useState<number>(1);

  // Pagamento gerado (PIX ou Boleto para exibição)
  const [completedPayment, setCompletedPayment] = useState<SubscriptionPayment | null>(null);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState<boolean>(false);

  const basePrice = selectedPlan.priceMonthly;
  const totalPrice =
    billingCycle === 'yearly' ? Number((basePrice * 10).toFixed(2)) : basePrice;

  // Função central para gerar cobrança simulada
  const generateCharge = useCallback(
    async (methodToUse: PaymentMethodType = paymentMethod) => {
      if (!user?.id) return;

      setIsProcessing(true);
      setErrorMsg(null);

      try {
        const res = await mercadoPagoService.processCheckout(
          user.id,
          user.id,
          companyName || 'Minha Empresa',
          {
            planId: selectedPlan.id,
            billingCycle,
            paymentMethod: methodToUse,
            payerEmail: user?.email,
            payerName: fullName || companyName,
            cardData:
              methodToUse === 'credit_card'
                ? {
                    cardNumber,
                    cardholderName: cardName,
                    cardExpiration: cardExpiry,
                    securityCode: cardCvv,
                    installments,
                  }
                : undefined,
          }
        );

        if (res.success && res.payment) {
          setCompletedPayment(res.payment);
          await refreshSubscription();
          if (methodToUse === 'credit_card' && res.payment.status === 'pago') {
            if (onSuccess) onSuccess();
          }
        } else {
          setErrorMsg(res.error || 'Erro ao processar simulação de pagamento.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro inesperado no checkout.');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      user,
      companyName,
      selectedPlan,
      billingCycle,
      paymentMethod,
      cardNumber,
      cardName,
      cardExpiry,
      cardCvv,
      installments,
      fullName,
      refreshSubscription,
      onSuccess,
    ]
  );

  // Geração imediata ao abrir o modal com PIX
  useEffect(() => {
    if (isOpen && user?.id && !completedPayment && paymentMethod === 'pix') {
      generateCharge('pix');
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'pix' | 'barcode' = 'pix') => {
    navigator.clipboard.writeText(text);
    if (type === 'pix') {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 3000);
    }
  };

  const handleMethodChange = (newMethod: PaymentMethodType) => {
    setPaymentMethod(newMethod);
    setErrorMsg(null);
    setCompletedPayment(null);
    // Ao alternar para PIX ou Boleto, gera imediatamente o fluxo simulado
    if (newMethod === 'pix' || newMethod === 'boleto') {
      generateCharge(newMethod);
    }
  };

  const handleCycleChange = (newCycle: BillingCycle) => {
    setBillingCycle(newCycle);
    setCompletedPayment(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    generateCharge(paymentMethod);
  };

  const handleSimulateApproval = async () => {
    if (!completedPayment) return;
    setIsSimulatingApproval(true);
    try {
      await mercadoPagoService.simulatePaymentApproval(completedPayment.id);
      await refreshSubscription();
      setCompletedPayment((prev) => (prev ? { ...prev, status: 'pago' } : null));
      if (onSuccess) onSuccess();
    } finally {
      setIsSimulatingApproval(false);
    }
  };

  // Garante uma imagem SVG demonstrativa se o base64 ainda não estiver setado
  const demonstrativeQrSrc =
    completedPayment?.qr_code_base64 || generateDemonstrativeQrCodeSvg();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header do Checkout */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Checkout Demonstrativo
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Simulação TCC
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Plano {selectedPlan.name} • {companyName || 'Sua Empresa'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Esclarecimento Acadêmico */}
        <div className="px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-900/40 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-snug">
            <strong>Ambiente de Demonstração Acadêmica:</strong> Os dados de pagamento, QR Code e códigos exibidos são representações fiéis simuladas para validação das regras de negócio do ANT. Nenhuma cobrança financeira real é realizada.
          </p>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Carregando Simulação */}
          {isProcessing && !completedPayment && (
            <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Gerando dados demonstrativos...
              </h4>
            </div>
          )}

          {/* Estado 1: Pagamento Aprovado */}
          {completedPayment && completedPayment.status === 'pago' && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  Pagamento Simulado Aprovado!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  A assinatura do plano <strong>{selectedPlan.name}</strong> foi reativada com sucesso. Os módulos operacionais da empresa estão liberados.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Concluir e Voltar ao Painel
                </button>
              </div>
            </div>
          )}

          {/* Estado 2: Pagamento Pendente (PIX ou Boleto) */}
          {completedPayment && completedPayment.status !== 'pago' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Aguardando Simulação de Pagamento
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {paymentMethod === 'pix' ? 'Pagamento PIX Demonstrativo' : 'Boleto Bancário Demonstrativo'}
                </h4>
                <p className="text-xs text-slate-500">
                  Valor simulado:{' '}
                  <strong className="text-slate-900 dark:text-slate-100 text-sm">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </strong>
                </p>
              </div>

              {/* SEÇÃO DO PIX DEMONSTRATIVO */}
              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  {/* QR Code Demonstrativo */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <img
                      src={demonstrativeQrSrc}
                      alt="QR Code Pix Demonstrativo"
                      className="w-48 h-48 object-contain mx-auto rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 bg-white p-2"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        QR Code Demonstrativo (TCC)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Representação gráfica para validação da interface e usabilidade
                      </p>
                    </div>
                  </div>

                  {/* Código Copia e Cola Simulado */}
                  {completedPayment.pix_copy_paste && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Código Pix Copia e Cola (Simulado)</span>
                        <span className="text-[10px] text-purple-600 font-semibold">Chave de Demonstração</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={completedPayment.pix_copy_paste}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-700 dark:text-slate-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(completedPayment.pix_copy_paste!, 'pix')}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botão de Simulação Imediata */}
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Aprovar Pagamento Simulado
                      </div>
                      <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                        Simula o webhook de confirmação bancária e ativa o plano imediatamente.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSimulatingApproval}
                      onClick={handleSimulateApproval}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSimulatingApproval ? 'Confirmando...' : 'Aprovar Agora'}
                    </button>
                  </div>
                </div>
              )}

              {/* SEÇÃO DO BOLETO DEMONSTRATIVO */}
              {paymentMethod === 'boleto' && (
                <div className="space-y-4">
                  {completedPayment.boleto_barcode && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Linha Digitável Demonstrativa
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={completedPayment.boleto_barcode}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-700 dark:text-slate-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(completedPayment.boleto_barcode!, 'barcode')}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedBarcode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBarcode ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Simular Compensação do Boleto
                      </div>
                      <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                        Dispensa os 3 dias úteis de espera bancária e ativa o plano na hora.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSimulatingApproval}
                      onClick={handleSimulateApproval}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSimulatingApproval ? 'Compensando...' : 'Compensar Boleto'}
                    </button>
                  </div>
                </div>
              )}

              {/* Ação para Trocar de Método */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletedPayment(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← Alterar forma de pagamento
                </button>
              </div>
            </div>
          )}

          {/* Estado 3: Formulário de Configuração / Troca de Método */}
          {(!completedPayment || completedPayment.status === 'pendente') && !isProcessing && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Seleção do Ciclo */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleCycleChange('monthly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Mensal (R$ {basePrice.toFixed(2).replace('.', ',')}/mês)
                </button>
                <button
                  type="button"
                  onClick={() => handleCycleChange('yearly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Anual (2 meses grátis)</span>
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 rounded font-bold">ECONOMIA</span>
                </button>
              </div>

              {/* Métodos de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Escolha como deseja pagar (Simulação):
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleMethodChange('pix')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'pix'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-bold">PIX</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodChange('credit_card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span className="text-xs font-bold">Cartão</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Até 12x</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodChange('boleto')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'boleto'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">Boleto</span>
                    <span className="text-[10px] text-slate-400 font-semibold">3 dias úteis</span>
                  </button>
                </div>
              </div>

              {/* Campos do Cartão de Crédito Simulado */}
              {paymentMethod === 'credit_card' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                    <span>Cartão de Teste (Valores pré-preenchidos para avaliação)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Nome impresso no Cartão
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        CVV / Código
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Parcelamento
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                    >
                      <option value={1}>
                        1x de R$ {totalPrice.toFixed(2).replace('.', ',')} (sem juros)
                      </option>
                      <option value={2}>
                        2x de R$ {(totalPrice / 2).toFixed(2).replace('.', ',')} (sem juros)
                      </option>
                      <option value={3}>
                        3x de R$ {(totalPrice / 3).toFixed(2).replace('.', ',')} (sem juros)
                      </option>
                      <option value={6}>
                        6x de R$ {(totalPrice / 6).toFixed(2).replace('.', ',')} (sem juros)
                      </option>
                      <option value={12}>
                        12x de R$ {(totalPrice / 12).toFixed(2).replace('.', ',')} (sem juros)
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* Resumo do Pedido */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Plano Selecionado:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Ciclo de Cobrança:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Simulado:</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Simulação...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {paymentMethod === 'pix'
                          ? 'Gerar PIX Simulado'
                          : paymentMethod === 'boleto'
                          ? 'Gerar Boleto Simulado'
                          : `Confirmar Pagamento (R$ ${totalPrice.toFixed(2).replace('.', ',')})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
