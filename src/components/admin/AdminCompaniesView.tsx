import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Users,
  Calendar,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Edit,
  Trash2,
  ShieldAlert,
  Play,
  Pause,
  PlusCircle,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAllAdminCompanies,
  updateAdminCompanySubscription,
  extendCompanyTrial,
  suspendCompany,
  reactivateCompany,
  deleteCompanyPermanently,
} from '../../services/adminService';
import { AdminCompanyItem } from '../../types/admin';
import { SubscriptionStatus, PlanId } from '../../types/subscription';

export const AdminCompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modais
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyItem | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Form states for manage modal
  const [targetStatus, setTargetStatus] = useState<SubscriptionStatus>('active');
  const [targetPlan, setTargetPlan] = useState<PlanId>('starter');
  const [companyNotes, setCompanyNotes] = useState<string>('');

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllAdminCompanies();
      setCompanies(list);
    } catch (err) {
      console.warn('Erro ao carregar lista de empresas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.responsible_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.subscription_status === statusFilter;
      const matchesPlan = planFilter === 'all' || c.plan_id === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [companies, searchQuery, statusFilter, planFilter]);

  // Abertura de modais
  const handleOpenManageModal = (comp: AdminCompanyItem) => {
    setSelectedCompany(comp);
    setTargetStatus(comp.subscription_status);
    setTargetPlan(comp.plan_id);
    setCompanyNotes(comp.notes || '');
    setIsManageModalOpen(true);
  };

  const handleOpenExtendModal = (comp: AdminCompanyItem) => {
    setSelectedCompany(comp);
    setIsExtendModalOpen(true);
  };

  const handleOpenDeleteModal = (comp: AdminCompanyItem) => {
    setSelectedCompany(comp);
    setDeleteConfirmationInput('');
    setIsDeleteModalOpen(true);
  };

  // 1. Salvar Alteração de Status & Plano
  const handleSaveStatusAndPlan = async () => {
    if (!selectedCompany) return;
    setIsProcessing(true);
    try {
      const res = await updateAdminCompanySubscription(
        selectedCompany.id,
        targetStatus,
        targetPlan,
        companyNotes
      );
      if (res.success) {
        showToast(`Empresa "${selectedCompany.company_name}" atualizada com sucesso!`);
        setIsManageModalOpen(false);
        await loadCompanies();
      } else {
        showToast(res.error || 'Erro ao atualizar empresa.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro inesperado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Suspender / Reativar Rápido
  const handleToggleSuspend = async (comp: AdminCompanyItem) => {
    setIsProcessing(true);
    try {
      if (comp.subscription_status === 'suspended') {
        const res = await reactivateCompany(comp.id);
        if (res.success) {
          showToast(`Empresa "${comp.company_name}" reativada com sucesso!`);
          await loadCompanies();
        } else {
          showToast(res.error || 'Erro ao reativar empresa.', 'error');
        }
      } else {
        const res = await suspendCompany(comp.id);
        if (res.success) {
          showToast(`Empresa "${comp.company_name}" suspensa com sucesso!`);
          await loadCompanies();
        } else {
          showToast(res.error || 'Erro ao suspender empresa.', 'error');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Renovar Trial (+7, +15, +30 dias)
  const handleExtendTrial = async (days: 7 | 15 | 30) => {
    if (!selectedCompany) return;
    setIsProcessing(true);
    try {
      const res = await extendCompanyTrial(selectedCompany.id, days);
      if (res.success) {
        showToast(`Trial de "${selectedCompany.company_name}" prorrogado em +${days} dias!`);
        setIsExtendModalOpen(false);
        await loadCompanies();
      } else {
        showToast(res.error || 'Erro ao prorrogar trial.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Excluir Empresa
  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    if (deleteConfirmationInput.trim() !== selectedCompany.company_name.trim()) {
      showToast('O nome digitado não corresponde ao nome da empresa.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await deleteCompanyPermanently(selectedCompany.id);
      if (res.success) {
        showToast(`Empresa "${selectedCompany.company_name}" excluída com sucesso!`);
        setIsDeleteModalOpen(false);
        await loadCompanies();
      } else {
        showToast(res.error || 'Erro ao excluir empresa.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

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

  // Métricas de contagem rápida
  const activeCount = companies.filter((c) => c.subscription_status === 'active').length;
  const trialCount = companies.filter((c) => c.subscription_status === 'trial').length;
  const suspendedCount = companies.filter((c) => c.subscription_status === 'suspended').length;
  const expiredCount = companies.filter((c) => c.subscription_status === 'expired').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Controle de Clientes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestão de Empresas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administre status, renove períodos de teste, altere planos e gerencie acessos de todas as empresas cadastradas.
          </p>
        </div>
        <button
          onClick={loadCompanies}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Cards de Métricas de Empresas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-left cursor-pointer hover:border-purple-300 transition-all"
        >
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Empresas</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {companies.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Cadastradas na base</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs text-left cursor-pointer transition-all ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ativas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Em operação regular</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'trial' ? 'all' : 'trial')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs text-left cursor-pointer transition-all ${
            statusFilter === 'trial'
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="text-purple-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Em Trial</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
            {trialCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Período de avaliação</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs text-left cursor-pointer transition-all ${
            statusFilter === 'suspended'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Suspensas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {suspendedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Bloqueio administrativo</p>
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, responsável ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filtro Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas</option>
            <option value="trial">Em Trial</option>
            <option value="suspended">Suspensas</option>
            <option value="expired">Expiradas</option>
            <option value="canceled">Canceladas</option>
          </select>

          {/* Filtro Plano */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos os Planos</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || planFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                planFilter !== 'all' && setPlanFilter('all');
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-xs font-semibold">Consultando empresas cadastradas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma empresa encontrada</p>
            <p className="text-xs text-slate-500">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Nome da Empresa</th>
                  <th className="py-3.5 px-4">Data Cadastro</th>
                  <th className="py-3.5 px-4">Plano Atual</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dias Restantes (Trial)</th>
                  <th className="py-3.5 px-4 text-center">Usuários</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCompanies.map((c) => {
                  const initial = (c.company_name || 'E').charAt(0).toUpperCase();

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Nome da Empresa & Responsável */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{c.company_name}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Resp: <strong>{c.responsible_name}</strong> {c.email ? `• ${c.email}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Data de Cadastro */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                        {formatDate(c.created_at)}
                      </td>

                      {/* Plano Atual */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Crown className="w-3 h-3 text-purple-600" />
                          <span>{c.plan_name}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {c.subscription_status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : c.subscription_status === 'trial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Trial
                          </span>
                        ) : c.subscription_status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Suspenso
                          </span>
                        ) : c.subscription_status === 'canceled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Expirado
                          </span>
                        )}
                      </td>

                      {/* Dias Restantes de Trial */}
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {c.subscription_status === 'trial' ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              c.days_remaining <= 3 ? 'text-rose-600 animate-pulse' : 'text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{c.days_remaining} {c.days_remaining === 1 ? 'dia restante' : 'dias restantes'}</span>
                          </span>
                        ) : c.subscription_status === 'active' ? (
                          <span className="text-slate-400">Plano Ativo</span>
                        ) : (
                          <span className="text-rose-500">Encerrado</span>
                        )}
                      </td>

                      {/* Quantidade de Usuários */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{c.users_count}</span>
                        </span>
                      </td>

                      {/* Ações Administrativas */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Renovar Trial */}
                          {c.subscription_status === 'trial' && (
                            <button
                              onClick={() => handleOpenExtendModal(c)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 transition-colors cursor-pointer"
                              title="Prorrogar período de Trial (+7, +15 ou +30 dias)"
                            >
                              + Trial
                            </button>
                          )}

                          {/* Botão Suspender / Reativar */}
                          <button
                            onClick={() => handleToggleSuspend(c)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              c.subscription_status === 'suspended'
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                            title={c.subscription_status === 'suspended' ? 'Reativar Empresa' : 'Suspender Empresa'}
                          >
                            {c.subscription_status === 'suspended' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Botão Gerenciar Status/Plano */}
                          <button
                            onClick={() => handleOpenManageModal(c)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                            title="Alterar Status e Plano"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleOpenDeleteModal(c)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir Empresa Definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Alterar Status e Plano */}
      {/* ------------------------------------------------------------- */}
      {isManageModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Gerenciar Assinatura</h3>
                  <p className="text-xs text-slate-500">{selectedCompany.company_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status da Empresa
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as SubscriptionStatus)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="trial">Trial (Período de Avaliação)</option>
                  <option value="suspended">Suspenso (Bloqueio Administrativo)</option>
                  <option value="expired">Expirado (Assinatura Vencida)</option>
                  <option value="canceled">Cancelado (Encerramento de Conta)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plano Atribuído
                </label>
                <select
                  value={targetPlan}
                  onChange={(e) => setTargetPlan(e.target.value as PlanId)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                >
                  <option value="starter">Starter (Básico)</option>
                  <option value="business">Business (Mais Escolhido)</option>
                  <option value="enterprise">Enterprise (Ilimitado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Anotações Internas do Admin (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={companyNotes}
                  onChange={(e) => setCompanyNotes(e.target.value)}
                  placeholder="Ex: Liberado desconto especial, suporte prioritário..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStatusAndPlan}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Renovar Período de Trial */}
      {/* ------------------------------------------------------------- */}
      {isExtendModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Renovar Trial</h3>
                  <p className="text-xs text-slate-500">{selectedCompany.company_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Selecione quantos dias deseja conceder para o período de teste de{' '}
              <strong>{selectedCompany.company_name}</strong>. O status será mantido ou restaurado para{' '}
              <strong>Trial</strong> automaticamente.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleExtendTrial(7)}
                disabled={isProcessing}
                className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 font-bold text-center cursor-pointer transition-all disabled:opacity-50"
              >
                <div className="text-base">+7</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase">Dias</div>
              </button>

              <button
                type="button"
                onClick={() => handleExtendTrial(15)}
                disabled={isProcessing}
                className="p-3.5 rounded-2xl border border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-800/60 text-purple-900 dark:text-purple-100 font-bold text-center cursor-pointer transition-all disabled:opacity-50"
              >
                <div className="text-base">+15</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase">Dias</div>
              </button>

              <button
                type="button"
                onClick={() => handleExtendTrial(30)}
                disabled={isProcessing}
                className="p-3.5 rounded-2xl border border-purple-400 dark:border-purple-600 bg-purple-200/80 dark:bg-purple-800/40 hover:bg-purple-300 dark:hover:bg-purple-700/60 text-purple-950 dark:text-white font-bold text-center cursor-pointer transition-all disabled:opacity-50"
              >
                <div className="text-base">+30</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300 uppercase">Dias</div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Exclusão Segura de Empresa */}
      {/* ------------------------------------------------------------- */}
      {isDeleteModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Excluir Empresa</h3>
                  <p className="text-xs text-slate-500">{selectedCompany.company_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1.5 leading-relaxed">
              <strong>Atenção: Ação irreversível!</strong>
              <p>
                Esta ação removerá a empresa e revogará todos os acessos dos seus colaboradores.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Para confirmar, digite exatamente o nome da empresa abaixo:{' '}
                <span className="text-rose-600 select-all font-mono">"{selectedCompany.company_name}"</span>
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder={selectedCompany.company_name}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/30 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={isProcessing || deleteConfirmationInput.trim() !== selectedCompany.company_name.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
              >
                {isProcessing ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
