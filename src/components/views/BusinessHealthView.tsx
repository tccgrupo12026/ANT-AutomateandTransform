import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const BusinessHealthView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500 text-white">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Saúde do Negócio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Diagnóstico financeiro e operacional fundamentado em regras, cálculos e dados reais da sua empresa (sem IA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="green" size="md">
            Métricas Reais
          </Badge>
        </div>
      </div>

      {/* Pillars of Real Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card id="health-metric-1" accent="green">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">
            Capital de Giro &amp; Caixa
          </div>
          <p className="text-xs text-slate-500">
            Regra de autonomia: mede quantos dias ou meses a microempresa se sustenta com a reserva atual.
          </p>
        </Card>

        <Card id="health-metric-2" accent="purple">
          <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase mb-1">
            Giro de Estoque
          </div>
          <p className="text-xs text-slate-500">
            Identifica mercadorias paradas sem vendas e calcula o custo de oportunidade do capital imobilizado.
          </p>
        </Card>

        <Card id="health-metric-3" accent="green">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">
            Margem de Segurança
          </div>
          <p className="text-xs text-slate-500">
            Diferença entre o faturamento atual e o ponto de equilíbrio mínimo da operação.
          </p>
        </Card>
      </div>

      <Card
        id="health-rules-card"
        title="Estrutura de Regras de Negócio"
        subtitle="Auditoria transparente baseada em métricas financeiras"
        badge={<Badge variant="purple">Regras Determinísticas</Badge>}
      >
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Cálculo determinístico:</span> As avaliações de saúde da empresa utilizam fórmulas padronizadas de contabilidade e gestão de microempresas.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Transparência total:</span> Sem geração automática por IA ou alucinações. Cada alerta é diretamente rastreável às entradas, saídas e estoque cadastrados no ANT.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
