/**
 * ANT — Automate and Transform
 * Modal de Checkout Oficial Mercado Pago (Fase 3)
 *
 * Suporta PIX, Cartão de Crédito e Boleto Bancário com simulação comercial real
 * e integração com o webhook do gateway de pagamento.
 */

import React, { useState } from 'react';
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
  ExternalLink,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  PlanId,
  BillingCycle,
  PaymentMethodType,
  PlanDetails,
  SubscriptionPayment,
} from '../../types/subscription';
import { mercadoPagoService } from '../../services/mercadoPagoService';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dados do Cartão
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>(fullName || '');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);

  // Pagamento gerado (PIX ou Boleto para exibição)
  const [completedPayment, setCompletedPayment] = useState<SubscriptionPayment | null>(null);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState<boolean>(false);

  if (!isOpen) return null;

  const basePrice = selectedPlan.priceMonthly;
  const totalPrice =
    billingCycle === 'yearly' ? Number((basePrice * 10).toFixed(2)) : basePrice;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
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
          paymentMethod,
          cardData:
            paymentMethod === 'credit_card'
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
        if (paymentMethod === 'credit_card') {
          if (onSuccess) onSuccess();
        }
      } else {
        setErrorMsg(res.error || 'Erro ao processar pagamento com o Mercado Pago.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado no checkout.');
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header com Branding Mercado Pago */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-50/50 via-purple-50/30 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-xs">
              <span className="text-sm font-black tracking-tighter">MP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Checkout Mercado Pago
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  Ambiente Seguro
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Estado 1: Pagamento Aprovado ou Instruções de PIX/Boleto */}
          {completedPayment ? (
            <div className="space-y-4">
              {completedPayment.status === 'pago' ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                      Pagamento Confirmado com Sucesso!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Sua assinatura do plano <strong>{selectedPlan.name}</strong> está 100% ativa. Todos os módulos operacionais foram liberados.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Acessar Meu Painel ANT
                    </button>
                  </div>
                </div>
              ) : (
                /* Pagamento Pendente (PIX ou Boleto) */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      Aguardando Pagamento
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {paymentMethod === 'pix' ? 'Pague com Chave PIX' : 'Boleto Bancário Gerado'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Valor total: <strong>R$ {totalPrice.toFixed(2).replace('.', ',')}</strong>
                    </p>
                  </div>

                  {paymentMethod === 'pix' && completedPayment.pix_copy_paste && (
                    <div className="space-y-3">
                      <div className="flex justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-400">
                          <QrCode className="w-24 h-24 text-slate-700 dark:text-slate-200" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Código Copia e Cola (PIX)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={completedPayment.pix_copy_paste}
                            className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-600 dark:text-slate-300 select-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopy(completedPayment.pix_copy_paste!)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'boleto' && completedPayment.boleto_barcode && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Linha Digitável do Boleto
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={completedPayment.boleto_barcode}
                          className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-600 dark:text-slate-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(completedPayment.boleto_barcode!)}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Vencimento em 3 dias úteis. A confirmação do boleto ocorre automaticamente via compensação bancária.
                      </p>
                    </div>
                  )}

                  {/* Simulação de Webhook Mercado Pago para Teste Imediato */}
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Ambiente de Testes / Demonstração
                      </div>
                      <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                        Você pode simular o retorno do webhook aprovando o pagamento agora mesmo.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSimulatingApproval}
                      onClick={handleSimulateApproval}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSimulatingApproval ? 'Aprovando...' : 'Aprovar Pagamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Formulário de Escolha de Método e Pagamento */
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Seleção do Ciclo */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
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
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Anual (2 meses grátis)</span>
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 rounded">ECONOMIA</span>
                </button>
              </div>

              {/* Métodos de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Escolha como deseja pagar:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'pix'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs font-bold">PIX</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-bold">Cartão</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Até 12x</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'boleto'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-bold">Boleto</span>
                    <span className="text-[10px] text-slate-400 font-semibold">3 dias úteis</span>
                  </button>
                </div>
              </div>

              {/* Campos do Cartão de Crédito */}
              {paymentMethod === 'credit_card' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0000 0000 0000 0000"
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
                      placeholder="NOME COMPLETO"
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
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
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
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
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
                  <span>Total:</span>
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
                      <span>Processando no Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        Pagar R$ {totalPrice.toFixed(2).replace('.', ',')}
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
