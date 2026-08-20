import React from 'react';
import { Calculator, Percent, DollarSign, Target, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const PricingView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Precificação
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cálculo determinístico de preço de venda com base no custo de aquisição, despesas variáveis e margem de lucro desejada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Cálculo por Regras
          </Badge>
        </div>
      </div>

      {/* Pricing Formula Scaffold */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card id="pricing-cost-card" accent="purple">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase mb-2">
            <DollarSign className="w-4 h-4" />
            Custo Base do Produto
          </div>
          <p className="text-xs text-slate-500">
            Valor pago ao fornecedor por unidade somado ao frete e embalagem.
          </p>
        </Card>

        <Card id="pricing-margin-card" accent="purple">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase mb-2">
            <Percent className="w-4 h-4" />
            Despesas &amp; Impostos (%)
          </div>
          <p className="text-xs text-slate-500">
            Percentual de taxas de cartão, impostos e despesas administrativas por venda.
          </p>
        </Card>

        <Card id="pricing-target-card" accent="green">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase mb-2">
            <Target className="w-4 h-4" />
            Margem de Lucro Alvo (%)
          </div>
          <p className="text-xs text-slate-500">
            Margem líquida real que sua microempresa deseja obter em cada item vendido.
          </p>
        </Card>
      </div>

      <Card
        id="pricing-formula-card"
        title="Simulador de Markup &amp; Preço de Venda"
        description="O simulador de precificação baseado na fórmula de Markup Divisor e Multiplicador será ativado na etapa de regras de negócio."
        badge={<Badge variant="green">100% Livre de IA</Badge>}
      >
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <div className="font-mono text-purple-700 dark:text-purple-400 font-bold">
            Fórmula ANT: Preço de Venda = Custo Unitário / (1 - (Taxas% + Impostos% + Margem%))
          </div>
          <p className="text-slate-500 text-[11px]">
            Garante que sua microempresa nunca venda abaixo do ponto de equilíbrio, protegendo seu fluxo de caixa de maneira simples e transparente.
          </p>
        </div>
      </Card>
    </div>
  );
};
