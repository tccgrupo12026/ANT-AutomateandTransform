import React from 'react';
import { BarChart3, FileSpreadsheet, Download, Calendar, Filter } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Relatórios
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualização consolidada de desempenho, histórico de vendas, giro de estoque e balanço mensal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Módulo em Estruturação
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card id="report-sales" title="Relatório de Vendas">
          <p className="text-xs text-slate-500 mb-3">
            Evolução de faturamento por período diário, semanal e mensal.
          </p>
          <Badge variant="neutral">Pronto para Etapa de Dados</Badge>
        </Card>

        <Card id="report-stock" title="Relatório de Estoque">
          <p className="text-xs text-slate-500 mb-3">
            Histórico de entradas de produtos, saídas por venda e perdas.
          </p>
          <Badge variant="neutral">Pronto para Etapa de Dados</Badge>
        </Card>

        <Card id="report-financial" title="Fechamento Mensal">
          <p className="text-xs text-slate-500 mb-3">
            Consolidado de receitas versus despesas para prestação de contas.
          </p>
          <Badge variant="neutral">Pronto para Etapa de Dados</Badge>
        </Card>
      </div>
    </div>
  );
};
