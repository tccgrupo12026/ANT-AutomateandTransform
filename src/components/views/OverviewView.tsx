import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Activity,
  Zap,
  Building2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { NavigationSection } from '../../types';

interface OverviewViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Tip of the Day Banner - Inspired by ANT Reference */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-purple-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-purple-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-xs">
        <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
            Dica ANT do Dia
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-relaxed">
            Separe as contas pessoais das profissionais hoje. Organização financeira simples e gestão de estoque são os alicerces do crescimento da sua microempresa.
          </p>
        </div>
        <Badge variant="green" size="md">
          Gestão Ativa
        </Badge>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita / Faturamento */}
        <Card
          id="stat-revenue"
          className="hover:border-emerald-300 transition-colors"
          accent="green"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Faturamento Bruto
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            R$ 0,00
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Entradas de vendas do período
          </div>
        </Card>

        {/* Despesas */}
        <Card
          id="stat-expenses"
          className="hover:border-purple-300 transition-colors"
          accent="purple"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Despesas &amp; Custos
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            R$ 0,00
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Custos de mercadoria e fixos
          </div>
        </Card>

        {/* Lucro Operacional */}
        <Card
          id="stat-profit"
          className="hover:border-emerald-300 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lucro Real
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            R$ 0,00
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Cálculo matemático real (DRE)
          </div>
        </Card>

        {/* Itens em Estoque */}
        <Card
          id="stat-inventory"
          className="hover:border-purple-300 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Itens em Estoque
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            0 itens
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Alertas de estoque mínimo
          </div>
        </Card>
      </div>

      {/* Main Pillars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foundation & Roadmap (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            id="ant-core-principles"
            title="Base do Sistema ANT"
            subtitle="Automate and Transform — Gestão para Microempresas"
            description="Ambiente preparado de acordo com os pilares fundamentais do ANT. Esta etapa define a arquitetura, identidade visual e integrações de nuvem."
            badge={<Badge variant="purple">Etapa 1 Concluída</Badge>}
          >
            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Gestão de Produtos &amp; Estoque Simplificada
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Preparado para cadastro com digitação manual de código de barras (sem necessidade de câmera), controle de entradas/saídas e alertas de reposição.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Saúde do Negócio &amp; Precificação Baseada em Dados Reais
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Fórmulas e regras de negócio precisas para precificação e saúde financeira da empresa — 100% determinístico e livre de IA.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Controle Financeiro &amp; DRE Simplificado
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Acompanhamento visual de entradas, despesas operacionais e cálculo da lucratividade real do negócio de forma clara e descomplicada.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Status & Modules Access (1 col) */}
        <div className="space-y-6">
          <Card
            id="quick-modules"
            title="Módulos do Sistema"
            description="Navegue pelos módulos estruturados para as próximas implementações."
          >
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('empresa')}
                className="w-full p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-600 text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dados da Empresa
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">Gerenciar &rarr;</span>
              </button>

              <button
                onClick={() => onNavigate('produtos')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Produtos
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 font-semibold">Gerenciar &rarr;</span>
              </button>

              <button
                onClick={() => onNavigate('movimentacoes')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Movimentações &amp; DRE
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Acessar &rarr;</span>
              </button>

              <button
                onClick={() => onNavigate('precificacao')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Precificação
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 font-semibold">Acessar &rarr;</span>
              </button>

              <button
                onClick={() => onNavigate('saude_negocio')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Saúde do Negócio
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Acessar &rarr;</span>
              </button>
            </div>
          </Card>

          {/* Quick Business Overview */}
          <Card id="business-summary-card" title="Resumo Operacional">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-600 dark:text-slate-400">Status Operacional</span>
                <Badge variant="green">Em dia</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-600 dark:text-slate-400">Regras de Negócio</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Determinísticas</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
