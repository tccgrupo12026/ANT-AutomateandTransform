import React from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const MovementsView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500 text-white">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Movimentações &amp; DRE
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro de entradas de vendas, saídas de mercadorias, despesas fixas e apuração de lucro líquido simples.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="green" size="md">
            Financeiro Simples
          </Badge>
        </div>
      </div>

      {/* DRE Summary Card Scaffold */}
      <Card
        id="dre-summary-card"
        title="DRE Simplificada (Demonstrativo de Resultado)"
        subtitle="Cálculo financeiro direto para microempresas"
        badge={<Badge variant="purple">Base Estruturada</Badge>}
      >
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                (+) Faturamento Bruto (Vendas e Serviços)
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-600">R$ 0,00</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                (-) Custos de Mercadorias Vendidas (CMV) &amp; Impostos
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-purple-600">R$ 0,00</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                (-) Despesas Fixas (Aluguel, Energia, Internet)
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-purple-600">R$ 0,00</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold">(=) Lucro Líquido Real</span>
            </div>
            <span className="text-base font-black text-emerald-400">R$ 0,00</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
