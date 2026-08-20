import React from 'react';
import { Package, Search, Plus, AlertTriangle, Barcode, ShieldAlert } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const StockView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500 text-white">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Meu Estoque
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão ágil para microempresas: controle de produtos, quantidades e alertas de estoque mínimo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Módulo em Estruturação
          </Badge>
        </div>
      </div>

      {/* Barcode & Manual Entry Notice */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0">
          <Barcode className="w-4 h-4" />
        </div>
        <div className="text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
          <span className="font-bold">Digitação Manual de Código de Barras:</span> O ANT suportará busca e inserção rápida através de digitação manual de código de barras, sem necessidade de scanners ou permissões de câmera.
        </div>
      </div>

      {/* Stock Overview Scaffold Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card id="stock-total-card">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total em Produtos</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">0 itens</div>
          <div className="text-xs text-slate-400 mt-1">Cadastros de mercadorias</div>
        </Card>

        <Card id="stock-alert-card" accent="purple">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Alerta de Estoque Baixo
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">0 em alerta</div>
          <div className="text-xs text-slate-400 mt-1">Itens atingindo nível de reposição</div>
        </Card>

        <Card id="stock-value-card" accent="green">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Valor do Estoque</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">R$ 0,00</div>
          <div className="text-xs text-slate-400 mt-1">Custo acumulado de mercadoria</div>
        </Card>
      </div>

      {/* Table Placeholder Container */}
      <Card
        id="stock-table-card"
        title="Catálogo de Produtos"
        description="A listagem e cadastro de produtos com armazenamento seguro serão disponibilizados nas próximas etapas."
        headerAction={
          <button
            disabled
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/50 text-white text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-80"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Produto
          </button>
        }
      >
        {/* Search Input Mockup */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            disabled
            placeholder="Buscar produto por nome, categoria ou código de barras..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs text-slate-500 cursor-not-allowed"
          />
        </div>

        {/* Empty State / Ready Container */}
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/30">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Módulo de Estoque Preparado
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Esta seção centralizará o cadastro de produtos, histórico de movimentações e controle de estoque mínimo nas próximas etapas do ANT.
          </p>
        </div>
      </Card>
    </div>
  );
};
