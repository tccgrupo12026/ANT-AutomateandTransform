import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  BellRing,
  Download,
  ShieldCheck,
  Percent,
  AlertTriangle,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const SettingsView: React.FC = () => {
  const [defaultMargin, setDefaultMargin] = useState('30');
  const [taxRate, setTaxRate] = useState('6.0');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [showDailyTips, setShowDailyTips] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Configurações do Negócio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Defina os parâmetros operacionais, regras de precificação e preferências de notificações da sua empresa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <Badge variant="green" size="md">
              <Check className="w-3.5 h-3.5 mr-1 inline" />
              Salvo com sucesso
            </Badge>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            Salvar Preferências
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parametros Financeiros e Precificação */}
        <Card
          id="settings-financial-defaults"
          title="Parâmetros Financeiros & Precificação"
          description="Valores padrão utilizados pelo módulo de precificação e cálculo de margem de contribuição."
          badge={<Badge variant="purple">Precificação</Badge>}
        >
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Moeda do Sistema
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Real Brasileiro (R$ BRL)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Margem de Lucro Alvo Padrão (%)</span>
                <span className="text-[11px] text-purple-600 font-bold">{defaultMargin}%</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={defaultMargin}
                  onChange={(e) => setDefaultMargin(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  placeholder="Ex: 30"
                />
                <span className="text-xs font-bold text-slate-400 p-2">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Usada como sugestão inicial ao cadastrar novos produtos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Alíquota Média de Imposto / Taxas (%)</span>
                <span className="text-[11px] text-purple-600 font-bold">{taxRate}%</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  placeholder="Ex: 6.0"
                />
                <span className="text-xs font-bold text-slate-400 p-2">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Estimativa para Simples Nacional / MEI / taxas de máquina de cartão.
              </p>
            </div>
          </div>
        </Card>

        {/* Alertas e Notificações Operacionais */}
        <Card
          id="settings-alerts"
          title="Alertas & Preferências da Interface"
          description="Controle os avisos visuais que auxiliam na gestão diária da microempresa."
          badge={<Badge variant="neutral">Operação</Badge>}
        >
          <div className="space-y-4 mt-2 text-xs">
            <div className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Alerta de Estoque Mínimo
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Destacar automaticamente produtos que atingirem o nível de reposição.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
            </div>

            <div className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-start gap-2.5">
                <BellRing className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Dicas Diárias de Gestão
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Exibir orientações práticas de finanças e estoque no painel inicial.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showDailyTips}
                onChange={(e) => setShowDailyTips(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                Todas as regras de negócio e limites configurados são aplicados de forma determinística e segura.
              </span>
            </div>
          </div>
        </Card>

        {/* Exportação de Dados e Relatórios */}
        <Card
          id="settings-data-export"
          className="md:col-span-2"
          title="Exportação de Dados & Relatórios"
          description="Baixe seus registros e movimentações para manter arquivos e relatórios contábeis da empresa."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Catálogo de Produtos &amp; Estoque
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Arquivo compatível com Excel e Google Sheets (CSV)
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Movimentações &amp; Histórico Financeiro
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Extrato de entradas, saídas e custos
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
