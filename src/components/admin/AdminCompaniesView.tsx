import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  Users,
  Calendar,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  EyeOff,
  ShieldCheck,
  Edit,
  ShieldAlert,
  ArrowUpDown,
  X,
  PlusCircle,
} from 'lucide-react';
import {
  fetchAllAdminCompanies,
  updateAdminCompanySubscription,
  extendCompanyTrial,
} from '../../services/adminService';
import { AdminCompanyItem } from '../../types/admin';
import { SubscriptionStatus, PlanId, ANT_PLANS } from '../../types/subscription';

export const AdminCompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyItem | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for modal
  const [targetStatus, setTargetStatus] = useState<SubscriptionStatus>('active');
  const [targetPlan, setTargetPlan] = useState<PlanId>('starter');

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

  const handleOpenManageModal = (comp: AdminCompanyItem) => {
    setSelectedCompany(comp);
    setTargetStatus(comp.subscription_status);
    setTargetPlan(comp.plan_id);
    setIsManageModalOpen(true);
  };

  const handleSaveSubscriptionChanges = async () => {
    if (!selectedCompany) return;
    setIsSaving(true);
    try {
      const res = await updateAdminCompanySubscription(
        selectedCompany.id,
        targetStatus,
        targetPlan
      );
      if (res.success) {
        showToast('Assinatura e plano da empresa atualizados com sucesso!');
        setIsManageModalOpen(false);
        await loadCompanies();
      } else {
        showToast(res.error || 'Falha ao salvar alterações.', 'error');
      }
    } catch {
      showToast('Ocorreu um erro ao atualizar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtendTrial = async (days: number = 15) => {
    if (!selectedCompany) return;
    setIsSaving(true);
    try {
      const res = await extendCompanyTrial(selectedCompany.id, days);
      if (res.success) {
        showToast(`Período de trial prorrogado em +${days} dias!`);
        setIsManageModalOpen(false);
        await loadCompanies();
      } else {
        showToast(res.error || 'Falha ao estender trial.', 'error');
      }
    } catch {
      showToast('Erro ao prorrogar trial.', 'error');
    } finally {
      setIsSaving(false);
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

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ativo
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Trial (Teste)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Expirado
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Suspenso
          </span>
        );
    }
  };

  const getPlanBadge = (planId: PlanId) => {
    switch (planId) {
      case 'enterprise':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
            Enterprise
          </span>
        );
      case 'business':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
            Business
          </span>
        );
      case 'starter':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Starter
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Gestão de Contas SaaS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Empresas Clientes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visão cadastral e gerenciamento de assinaturas da base de clientes da plataforma ANT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCompanies}
            disabled={isLoading}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
        </div>
      </div>

      {/* LGPD Privacy Disclaimer Notice */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <EyeOff className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-900 dark:text-slate-100">
            Conformidade LGPD & Segregação de Dados
          </p>
          <p>
            Esta listagem expõe <strong>estritamente metadados cadastrais</strong> (nome da empresa, data de cadastro, plano contratado, status da assinatura e número de usuários). Produtos, controle de estoque, registros de movimentação e finanças internas dos clientes são completamente confidenciais e inacessíveis para o time da plataforma.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa ou responsável..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativas (Pagantes)</option>
              <option value="trial">Em Trial (Teste)</option>
              <option value="expired">Expiradas</option>
              <option value="suspended">Suspensas</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Crown className="w-3.5 h-3.5" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
            >
              <option value="all">Todos os Planos</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nome da Empresa</th>
                <th className="py-3.5 px-4">Data de Cadastro</th>
                <th className="py-3.5 px-4">Plano Atual</th>
                <th className="py-3.5 px-4">Status da Assinatura</th>
                <th className="py-3.5 px-4 text-center">Quantidade de Usuários</th>
                <th className="py-3.5 px-4 text-right">Ações da Plataforma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Carregando empresas cadastradas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Nome da Empresa */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold shrink-0">
                          {comp.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {comp.company_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Resp: {comp.responsible_name}
                            {comp.phone ? ` • ${comp.phone}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Data de Cadastro */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(comp.created_at)}</span>
                      </div>
                    </td>

                    {/* Plano Atual */}
                    <td className="py-4 px-4">{getPlanBadge(comp.plan_id)}</td>

                    {/* Status da Assinatura */}
                    <td className="py-4 px-4">{getStatusBadge(comp.subscription_status)}</td>

                    {/* Quantidade de Usuários */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        <Users className="w-3 h-3 text-slate-500" />
                        {comp.users_count} {comp.users_count === 1 ? 'usuário' : 'usuários'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenManageModal(comp)}
                        className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold text-xs transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Gerenciar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-xs text-slate-500">
          <span>
            Exibindo <strong>{filteredCompanies.length}</strong> de{' '}
            <strong>{companies.length}</strong> empresas cadastradas
          </span>
          <span className="text-[11px] text-slate-400">
            Plataforma ANT • Painel de Controle dos Fundadores
          </span>
        </div>
      </div>

      {/* Modal de Gestão da Conta / Assinatura */}
      {isManageModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Gestão Administrativa ANT
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedCompany.company_name}
                </h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Summary details */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Responsável:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedCompany.responsible_name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data de Cadastro:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatDate(selectedCompany.created_at)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Usuários Ativos:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedCompany.users_count} membros
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">E-mail de Contato:</span>
                  <strong className="text-slate-800 dark:text-slate-200 truncate block">
                    {selectedCompany.email || 'Não informado'}
                  </strong>
                </div>
              </div>

              {/* Status Change Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status da Assinatura
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as SubscriptionStatus)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="active">Ativo (Assinatura Pagante Regular)</option>
                  <option value="trial">Trial (Período Gratuito de Testes)</option>
                  <option value="expired">Expirado (Período Concluído sem Pagamento)</option>
                  <option value="suspended">Suspenso (Bloqueado por Inadimplência ou Decisão Admin)</option>
                </select>
              </div>

              {/* Plan Change Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Plano da Plataforma
                </label>
                <select
                  value={targetPlan}
                  onChange={(e) => setTargetPlan(e.target.value as PlanId)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="starter">Starter (R$ 49,90/mês)</option>
                  <option value="business">Business (R$ 99,90/mês)</option>
                  <option value="enterprise">Enterprise (R$ 199,90/mês)</option>
                </select>
              </div>

              {/* Quick Actions (Trial Extension) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ações Rápidas de Suporte
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendTrial(15)}
                    disabled={isSaving}
                    className="cursor-pointer flex-1 py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 transition-colors"
                  >
                    +15 Dias de Trial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendTrial(30)}
                    disabled={isSaving}
                    className="cursor-pointer flex-1 py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 transition-colors"
                  >
                    +30 Dias de Trial
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSubscriptionChanges}
                disabled={isSaving}
                className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
