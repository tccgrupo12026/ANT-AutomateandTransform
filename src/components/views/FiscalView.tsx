/**
 * ANT — Automate and Transform
 * Módulo Fiscal — Importação e Histórico de NF-e (Fase 4 — TCC / Acadêmico)
 *
 * Funcionalidades:
 * - Validação e digitação assistida de Chave de Acesso de 44 dígitos
 * - Botão demonstrativo para gerar chaves de teste com 1 clique para banca de TCC
 * - Simulação realista de consulta com loading ("Consultando NF-e...")
 * - Retorno de dados fiscais coerentes (Fornecedor, CNPJ, Número, Série, Data e Produtos)
 * - Tabela completa de produtos da nota (Código, Produto, Quantidade, Valor Unitário, Valor Total)
 * - Importação real para o estoque:
 *   - Cadastro automático de novos produtos
 *   - Atualização de estoque e custo em produtos existentes
 *   - Registro automático de movimentações de entrada ('entrada')
 *   - Gravação no banco Supabase (tabelas nfe_imports e nfe_import_items)
 * - Tela de Histórico de NF-e com busca e visualização detalhada de itens
 * - Controle de permissões (fiscal_view e fiscal_import)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Boxes,
  ArrowLeftRight,
  ArrowDownToLine,
  History,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Building2,
  Hash,
  Calendar,
  ChevronRight,
  Info,
  RefreshCw,
  X,
  Eye,
  Sliders,
  DollarSign,
  Tag,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRbac } from '../../contexts/RbacContext';
import { nfeService } from '../../services/nfeService';
import { NfeImport, SimulatedNfeData, NfeImportResult } from '../../types/nfe';
import { NavigationSection } from '../../types';

interface FiscalViewProps {
  onNavigate?: (section: NavigationSection) => void;
  initialTab?: 'import' | 'history';
}

export const FiscalView: React.FC<FiscalViewProps> = ({ onNavigate, initialTab = 'import' }) => {
  const { user, fullName } = useAuth();
  const { isOwner, hasCustomPermission, effectiveCompanyId, effectiveCompanyName } = useRbac();

  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'import' | 'history'>(initialTab);

  // Permissões
  const canViewFiscal = isOwner || hasCustomPermission('fiscal_view') || hasCustomPermission('fiscal_import');
  const canImportFiscal = isOwner || hasCustomPermission('fiscal_import');

  // Estado da Chave e Consulta
  const [accessKeyInput, setAccessKeyInput] = useState<string>('');
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [simulatedNfe, setSimulatedNfe] = useState<SimulatedNfeData | null>(null);

  // Estado da Importação para Estoque
  const [isImportingToStock, setIsImportingToStock] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<NfeImportResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Estado do Histórico
  const [historyList, setHistoryList] = useState<NfeImport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedHistoryNfe, setSelectedHistoryNfe] = useState<NfeImport | null>(null);

  // Feedback de Cópia
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Listener para evento customizado de navegação via submenu
  useEffect(() => {
    const handleSubmenuTab = (e: any) => {
      if (e.detail === 'history' || e.detail === 'import') {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('ant_fiscal_tab', handleSubmenuTab);
    return () => window.removeEventListener('ant_fiscal_tab', handleSubmenuTab);
  }, []);

  // Carregar histórico de NF-e
  const loadHistory = async () => {
    if (!effectiveCompanyId) return;
    setIsLoadingHistory(true);
    try {
      const records = await nfeService.getNfeImports(effectiveCompanyId, user?.id);
      setHistoryList(records);
    } catch (err) {
      console.warn('Erro ao carregar histórico de NF-e:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [effectiveCompanyId, user?.id]);

  // Atualização em tempo real ao importar
  useEffect(() => {
    const handleNfeImported = () => {
      loadHistory();
    };
    window.addEventListener('ant_nfe_imported', handleNfeImported);
    return () => window.removeEventListener('ant_nfe_imported', handleNfeImported);
  }, [effectiveCompanyId]);

  // Chave limpa (apenas dígitos)
  const cleanKey = useMemo(() => nfeService.cleanKey(accessKeyInput), [accessKeyInput]);
  const isKeyValid44 = cleanKey.length === 44;

  // Formata a chave no input com espaços a cada 4 dígitos
  const handleKeyChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 44);
    // Aplica formatação de 4 em 4 dígitos
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setAccessKeyInput(formatted);
    if (consultError) setConsultError(null);
  };

  // Gerador de Chave de Teste com 1 clique (para bancas de TCC)
  const handleGenerateTestKey = () => {
    const testKey = nfeService.generateTestAccessKey();
    const formatted = testKey.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setAccessKeyInput(formatted);
    setConsultError(null);
    setSimulatedNfe(null);
    setImportResult(null);
  };

  // Limpar formulário
  const handleClear = () => {
    setAccessKeyInput('');
    setConsultError(null);
    setSimulatedNfe(null);
    setImportResult(null);
  };

  // Simular Consulta de NF-e
  const handleConsultNfe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isKeyValid44) {
      setConsultError(`A chave de acesso da NF-e precisa ter exatamente 44 dígitos (atualmente possui ${cleanKey.length}).`);
      return;
    }

    setIsConsulting(true);
    setConsultError(null);
    setSimulatedNfe(null);
    setImportResult(null);

    try {
      const res = await nfeService.simulateNfeConsultation(cleanKey);
      if (res.error || !res.data) {
        setConsultError(res.error || 'Não foi possível consultar a NF-e informada.');
      } else {
        setSimulatedNfe(res.data);
      }
    } catch (err: any) {
      setConsultError(err.message || 'Erro inesperado na consulta da NF-e.');
    } finally {
      setIsConsulting(false);
    }
  };

  // Confirmar Importação para Estoque
  const handleImportToStock = async () => {
    if (!simulatedNfe) return;
    if (!user?.id) {
      alert('Você precisa estar autenticado para realizar a importação.');
      return;
    }
    if (!canImportFiscal) {
      alert('Seu perfil não possui permissão para importar NF-e para o estoque (fiscal_import). Solicite ao proprietário.');
      return;
    }

    setIsImportingToStock(true);
    try {
      const companyId = effectiveCompanyId || user.id;
      const userName = fullName || user.email || 'Usuário ANT';

      const result = await nfeService.importNfeToInventory(
        user.id,
        companyId,
        userName,
        simulatedNfe
      );

      setImportResult(result);
      if (result.success) {
        setShowSuccessModal(true);
        loadHistory();
      } else {
        alert(`Erro na importação: ${result.error || 'Falha ao processar produtos no estoque.'}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || 'Ocorreu um erro ao importar para o estoque.'}`);
    } finally {
      setIsImportingToStock(false);
    }
  };

  // Copiar Chave de Acesso
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Formatação de Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Formatação de Data
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtragem do Histórico
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyList;
    const q = historySearch.toLowerCase().trim();
    return historyList.filter(
      (item) =>
        item.access_key.toLowerCase().includes(q) ||
        item.supplier_name.toLowerCase().includes(q) ||
        item.number.toLowerCase().includes(q) ||
        (item.supplier_cnpj && item.supplier_cnpj.toLowerCase().includes(q))
    );
  }, [historyList, historySearch]);

  // Verificação de permissão de visualização
  if (!canViewFiscal) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Acesso Restrito ao Módulo Fiscal
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Seu perfil não possui permissão para visualizar o módulo fiscal (<code>fiscal_view</code>). Solicite acesso ao proprietário da conta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Módulo Fiscal
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Projeto Acadêmico (TCC)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Simulação de Entrada Automatizada
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-purple-600" />
            <span>Gestão e Importação de NF-e</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Importação assistida de notas fiscais eletrônicas por chave de acesso de 44 dígitos com cadastro inteligente de novos itens, atualização de saldos existentes e registro de movimentações de entrada.
          </p>
        </div>

        {/* Submenu / Abas Superiores */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Importação de NF-e</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de NF-e</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banner Acadêmico Explicativo */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-purple-50 to-indigo-50/60 dark:from-purple-950/30 dark:to-slate-900/60 border border-purple-200/70 dark:border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <span>Finalidade Acadêmica & Demonstração para Banca de TCC</span>
              <span className="text-[10px] px-2 py-0.2 bg-purple-200/70 dark:bg-purple-900/60 rounded-md font-semibold text-purple-800 dark:text-purple-300">
                Sem custos de SEFAZ
              </span>
            </div>
            <p className="text-purple-800/80 dark:text-purple-300/80">
              O fluxo fiscal do ERP foi projetado para simular fielmente a consulta da SEFAZ e a geração automática de estoque, sem a necessidade de certificados digitais ou APIs governamentais pagas.
            </p>
          </div>
        </div>

        {activeTab === 'import' && (
          <button
            type="button"
            onClick={handleGenerateTestKey}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0 shadow-xs"
            title="Preenche instantaneamente uma chave de 44 dígitos válida para demonstração"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Gerar Chave de Teste (44 dígitos)</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* ABA 1: IMPORTAÇÃO DE NF-E                                */}
      {/* ======================================================== */}
      {activeTab === 'import' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card de Entrada de Chave de Acesso */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-600" />
                  <span>Chave de Acesso da NF-e</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Digite ou cole a chave de acesso numérica com 44 dígitos presente no DANFE da nota fiscal.
                </p>
              </div>

              {accessKeyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <form onSubmit={handleConsultNfe} className="space-y-3">
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={accessKeyInput}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="Ex: 3526 1000 0000 0000 0000 5500 1000 0123 4510 0000 0001"
                    maxLength={54} // 44 dígitos + 10 espaços
                    disabled={isConsulting}
                    className={`w-full px-4 py-3.5 font-mono text-sm sm:text-base rounded-2xl border transition-all outline-none ${
                      isKeyValid44
                        ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-400/30'
                        : cleanKey.length > 0
                        ? 'border-purple-300 dark:border-purple-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-400/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  />

                  {/* Indicador de Validação à Direita */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isKeyValid44 ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                        44 dígitos
                      </span>
                    ) : cleanKey.length > 0 ? (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {cleanKey.length}/44
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Status da Validação */}
                <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                  <span>
                    {isKeyValid44 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Chave com tamanho correto (44 dígitos). Pronto para consulta!
                      </span>
                    ) : cleanKey.length > 0 ? (
                      <span>
                        Faltam <strong className="text-purple-600">{44 - cleanKey.length}</strong> dígitos para completar os 44 dígitos da NF-e.
                      </span>
                    ) : (
                      'Digite apenas números (a formatação com espaços é aplicada automaticamente).'
                    )}
                  </span>

                  <span className="font-mono text-[11px] text-slate-400">
                    Padrão SEFAZ Modelo 55
                  </span>
                </div>
              </div>

              {/* Erro de Validação ou Consulta */}
              {consultError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{consultError}</span>
                </div>
              )}

              {/* Botão de Ação: Consultar / Importar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isKeyValid44 || isConsulting}
                  className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-sm ${
                    !isKeyValid44 || isConsulting
                      ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-70'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none'
                  }`}
                >
                  {isConsulting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Consultando NF-e...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Importar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ======================================================== */}
          {/* SIMULAÇÃO DE CONSULTA (LOADING ANIMADO)                   */}
          {/* ======================================================== */}
          {isConsulting && (
            <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-purple-800 shadow-sm text-center space-y-4 animate-pulse">
              <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Consultando NF-e...
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Validando schema XML da nota fiscal, identificando emitente e buscando os produtos discriminados para conferência...
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DADOS DA NOTA E TABELA DE PRODUTOS RETORNADOS            */}
          {/* ======================================================== */}
          {simulatedNfe && !isConsulting && (
            <div className="space-y-6 animate-fadeIn">
              {/* Card de Cabeçalho da Nota Fiscal */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        NF-e Autorizada (Simulada)
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Nº {simulatedNfe.number} • Série {simulatedNfe.series}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                      {simulatedNfe.supplier_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      CNPJ: <span className="font-mono">{simulatedNfe.supplier_cnpj}</span> • Emissão: {formatDate(simulatedNfe.issue_date)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-purple-50/80 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200/80 dark:border-purple-800/60">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                      Valor Total da Nota
                    </span>
                    <span className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                      {formatCurrency(simulatedNfe.total_amount)}
                    </span>
                    <span className="text-[11px] text-purple-900/70 dark:text-purple-400 block mt-0.5 font-medium">
                      {simulatedNfe.items.length} itens discriminados
                    </span>
                  </div>
                </div>

                {/* Linha de Chave de Acesso Formatada */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Chave de Acesso Oficial (44 dígitos)
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 break-all select-all">
                      {nfeService.formatKey(simulatedNfe.access_key)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(simulatedNfe.access_key)}
                    className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 transition-all cursor-pointer"
                    title="Copiar chave completa"
                  >
                    {copiedKey === simulatedNfe.access_key ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tabela de Produtos da Nota (Requirement 4) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span>Produtos da Nota Fiscal ({simulatedNfe.items.length} itens)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confira os produtos identificados. Ao importar, produtos novos serão cadastrados e os existentes terão seu estoque atualizado.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    {simulatedNfe.items.length} produtos gerados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Produto</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-center">Un.</th>
                        <th className="py-3 px-4 text-right">Quantidade</th>
                        <th className="py-3 px-4 text-right">Valor Unitário</th>
                        <th className="py-3 px-4 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {simulatedNfe.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700 dark:text-purple-400">
                            {item.code}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                            <div className="font-semibold">{item.name}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-purple-50/50 dark:bg-purple-950/20 font-bold border-t border-purple-200 dark:border-purple-800/60">
                        <td colSpan={4} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Total Geral da Nota:
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-purple-700 dark:text-purple-300">
                          {simulatedNfe.items.reduce((acc, it) => acc + it.quantity, 0)} un.
                        </td>
                        <td className="py-3.5 px-4" />
                        <td className="py-3.5 px-4 text-right font-mono text-base font-black text-purple-700 dark:text-purple-300">
                          {formatCurrency(simulatedNfe.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Ação de Importação para Estoque (Requirement 5) */}
              <div className="p-6 bg-linear-to-r from-purple-50/80 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 rounded-3xl border border-purple-200 dark:border-purple-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-purple-600" />
                    <span>Pronto para dar entrada no estoque?</span>
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Ao clicar no botão ao lado, o ANT irá cadastrar produtos inexistentes, somar as quantidades ao estoque dos produtos existentes e registrar movimentações de entrada do tipo <strong>'entrada'</strong> com rastreabilidade completa.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleImportToStock}
                    disabled={isImportingToStock || !canImportFiscal}
                    className={`cursor-pointer inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-extrabold text-white transition-all shadow-md ${
                      isImportingToStock || !canImportFiscal
                        ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-70'
                        : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none'
                    }`}
                  >
                    {isImportingToStock ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Processando Estoque...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-5 h-5" />
                        <span>Importar Produtos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!canImportFiscal && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Aviso: Seu usuário possui acesso apenas de visualização. Para importar produtos para o estoque, solicite a permissão <code>fiscal_import</code> ao proprietário da conta.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: HISTÓRICO DE NF-E (Requirement 6)                 */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Barra de Busca e Ações do Histórico */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por fornecedor, chave ou número..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm outline-none focus:border-purple-500"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadHistory}
                disabled={isLoadingHistory}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="Recarregar histórico"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Nova Importação</span>
              </button>
            </div>
          </div>

          {/* Tabela do Histórico de NF-e */}
          {isLoadingHistory ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Carregando histórico de notas fiscais...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {historySearch ? 'Nenhuma NF-e encontrada na busca' : 'Nenhuma NF-e importada ainda'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {historySearch
                    ? 'Tente buscar por outro termo, CNPJ ou número de nota.'
                    : 'Importe sua primeira nota fiscal eletrônica digitando ou gerando uma chave de 44 dígitos.'}
                </p>
              </div>
              {!historySearch && (
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Importar Primeira NF-e</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Chave de Acesso</th>
                      <th className="py-3 px-4">Fornecedor</th>
                      <th className="py-3 px-4">Número / Série</th>
                      <th className="py-3 px-4">Data Emissão</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                      <th className="py-3 px-4 text-center">Itens</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                              {nfeService.formatKey(item.access_key).slice(0, 19)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(item.access_key)}
                              className="p-1 rounded-md text-slate-400 hover:text-purple-600 cursor-pointer transition-colors"
                              title="Copiar chave de 44 dígitos"
                            >
                              {copiedKey === item.access_key ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {item.supplier_name}
                          </div>
                          {item.supplier_cnpj && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.supplier_cnpj}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          Nº {item.number} / {item.series}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {formatDate(item.issue_date || item.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                            {item.items_count || (item.items ? item.items.length : 0)} un
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryNfe(item)}
                            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-700 text-xs font-semibold transition-all"
                            title="Ver itens da nota fiscal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Itens</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE SUCESSO APÓS IMPORTAÇÃO PARA ESTOQUE            */}
      {/* ======================================================== */}
      {showSuccessModal && importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800 shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Importação Concluída com Sucesso!
              </h3>
              <p className="text-xs text-slate-500">
                Os itens da nota fiscal foram processados e integrados ao estoque da empresa.
              </p>
            </div>

            {/* Métricas de Sucesso */}
            <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Novos Produtos</span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-400">
                  +{importResult.newProductsCount}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estoque Atualizado</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {importResult.updatedProductsCount} produtos
                </span>
              </div>
              <div className="space-y-0.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Entradas no Estoque</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {importResult.totalItemsImported} movimentações
                </span>
              </div>
              <div className="space-y-0.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total da Nota</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {formatCurrency(importResult.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('history');
                }}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-xs"
              >
                Ver no Histórico de NF-e
              </button>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onNavigate('produtos');
                  }}
                  className="cursor-pointer w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Conferir Produtos no Estoque
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleClear();
                }}
                className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 font-medium py-1"
              >
                Importar Outra Nota Fiscal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE DETALHES DE ITENS DO HISTÓRICO                  */}
      {/* ======================================================== */}
      {selectedHistoryNfe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedHistoryNfe.supplier_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  NF-e Nº {selectedHistoryNfe.number} • Série {selectedHistoryNfe.series} • Emissão: {formatDate(selectedHistoryNfe.issue_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryNfe(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chave de Acesso */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {nfeService.formatKey(selectedHistoryNfe.access_key)}
              </span>
              <button
                type="button"
                onClick={() => handleCopyKey(selectedHistoryNfe.access_key)}
                className="text-purple-600 hover:text-purple-700 font-bold ml-2 shrink-0 cursor-pointer text-[11px]"
              >
                {copiedKey === selectedHistoryNfe.access_key ? 'Copiada!' : 'Copiar'}
              </button>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Itens Vinculados ({selectedHistoryNfe.items ? selectedHistoryNfe.items.length : 0})
              </h4>

              {selectedHistoryNfe.items && selectedHistoryNfe.items.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {selectedHistoryNfe.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          <span className="font-mono text-purple-600 mr-1.5">[{it.code}]</span>
                          {it.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Categoria: {it.category} • Quantidade: <strong className="text-slate-700 dark:text-slate-300">{it.quantity} {it.unit}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(it.total_price)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatCurrency(it.unit_price)} / un
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Itens gravados na movimentação do estoque.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Consolidado</span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">
                  {formatCurrency(selectedHistoryNfe.total_amount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryNfe(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
