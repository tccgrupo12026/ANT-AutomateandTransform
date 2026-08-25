import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Briefcase,
  Mail,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  RefreshCw,
  Send,
  KeyRound,
  Lock,
  Lightbulb,
  Search,
  UserX,
  Sparkles,
} from 'lucide-react';
import { useRbac } from '../../contexts/RbacContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, CompanyMember, ANT_ROLES } from '../../types/rbac';

export const UsersView: React.FC = () => {
  const {
    currentRole,
    members,
    isLoading,
    isOwner,
    inviteMember,
    editMember,
    updateRole,
    removeMember,
    resendInvite,
    refreshMembers,
  } = useRbac();

  const { companyName, user } = useAuth();

  // Filtros e busca
  const [activeTab, setActiveTab] = useState<'all' | 'owners' | 'employees' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do formulário de convite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para Edição Completa de Colaborador (Nome, Email, Cargo)
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('employee');

  // Estado para confirmação de remoção
  const [deletingMember, setDeletingMember] = useState<CompanyMember | null>(null);

  // Métricas
  const totalMembers = members.length;
  const ownerCount = members.filter((m) => m.role === 'owner').length;
  const employeeCount = members.filter((m) => m.role === 'employee').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  // Filtragem da lista
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Filtro por Tab
      if (activeTab === 'owners' && m.role !== 'owner') return false;
      if (activeTab === 'employees' && m.role !== 'employee') return false;
      if (activeTab === 'pending' && m.status !== 'pending') return false;

      // Filtro por Busca
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(query);
        const matchEmail = m.email?.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      return true;
    });
  }, [members, activeTab, searchTerm]);

  const handleOpenInvite = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('employee');
    setShowInviteModal(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!inviteName.trim()) {
      setErrorMessage('Por favor, informe o nome do colaborador.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inviteMember(inviteName, inviteEmail, inviteRole);
      if (res.success) {
        setSuccessMessage(`Convite enviado com sucesso para ${inviteEmail}!`);
        setShowInviteModal(false);
      } else {
        setErrorMessage(res.error || 'Não foi possível convidar o usuário.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao enviar convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (member: CompanyMember) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!editName.trim()) {
      setErrorMessage('O nome não pode estar vazio.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await editMember(editingMember.id, {
        name: editName,
        email: editEmail,
        role: editRole,
      });

      if (res.success) {
        setSuccessMessage(`Dados de ${editName} atualizados com sucesso!`);
        setEditingMember(null);
      } else {
        setErrorMessage(res.error || 'Erro ao atualizar dados do colaborador.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao salvar alterações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await removeMember(deletingMember.id);
      if (res.success) {
        setSuccessMessage(`Membro ${deletingMember.name} removido da empresa.`);
        setDeletingMember(null);
      } else {
        setErrorMessage(res.error || 'Erro ao remover membro.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao remover usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (member: CompanyMember) => {
    const res = await resendInvite(member.id);
    if (res.success) {
      setSuccessMessage(res.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Usuários da Empresa
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gerencie a equipe de <span className="font-semibold text-purple-700 dark:text-purple-300">{companyName}</span> e defina permissões de acesso
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshMembers()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Atualizar lista de membros"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isOwner && (
            <button
              onClick={handleOpenInvite}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Convidar Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold hover:underline text-emerald-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline text-rose-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Resumo da Equipe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total de Membros</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalMembers}</p>
          <span className="text-[11px] text-slate-500">Membros vinculados à empresa</span>
        </div>

        <div
          onClick={() => setActiveTab('owners')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'owners'
              ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Proprietários</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-2">{ownerCount}</p>
          <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-medium">Acesso total permanente</span>
        </div>

        <div
          onClick={() => setActiveTab('employees')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Funcionários</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">{employeeCount}</p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            {employeeCount === 0 ? 'Nenhum cadastrado' : 'Acesso Operacional'}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Convites Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
            {pendingCount === 0 ? 'Tudo confirmado' : 'Aguardando aceite'}
          </span>
        </div>
      </div>

      {/* Card Informativo de Boas Práticas (Recomendação ANT) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5 shadow-2xs">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200/60 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 uppercase tracking-wider">
                  Boas Práticas de Acesso
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recomendação de Segurança</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                <strong className="font-bold text-purple-900 dark:text-purple-200">Dica ANT:</strong> sempre que possível, utilize e-mails corporativos para seus colaboradores. Isso facilita a gestão de acessos, aumenta a segurança da empresa e simplifica processos em casos de desligamento ou troca de funcionários.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300">Exemplos:</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                  estoque@suaempresa.com.br
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                  financeiro@suaempresa.com.br
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                  atendimento@suaempresa.com.br
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={handleOpenInvite}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0 self-start md:self-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Convidar com E-mail</span>
            </button>
          )}
        </div>
      </div>

      {/* Matriz Explicativa dos Papéis do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Proprietário */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Proprietário</h3>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Acesso Total e Estratégico</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Ativo
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Acesso total a todas as áreas do sistema, configurações, relatórios, métricas financeiras e gestão da equipe da empresa.
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Dashboard & Gráficos</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Financeiro & DRE</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Saúde do Negócio (Score)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Relatórios Completos</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Gestão de Usuários</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Configurações & Planos</span>
            </div>
          </div>
        </div>

        {/* Card Funcionário */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Funcionário</h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Acesso Operacional</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Ativo
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Focado no dia a dia da loja ou estoque: controle de produtos, estoque e movimentações, com bloqueio automático de dados financeiros e estratégicos.
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Consulta de Produtos</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Controle de Estoque</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Entradas e Saídas</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Calculadora de Preço</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Bloqueio: Financeiro</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Bloqueio: Relatórios/Config</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Membros da Empresa com Filtros e Empty States */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Cabeçalho da Lista + Filtros */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Membros da Equipe</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usuários vinculados a esta empresa e seus respectivos níveis de permissão
              </p>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Abas de Filtro */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {totalMembers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('owners')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'owners'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Proprietários</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'owners' ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {ownerCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'employees'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Funcionários</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'employees' ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {employeeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Convites Pendentes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {pendingCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tabela ou Estado Vazio */}
        {filteredMembers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto">
              {activeTab === 'employees' ? (
                <Briefcase className="w-7 h-7" />
              ) : activeTab === 'pending' ? (
                <Clock className="w-7 h-7" />
              ) : searchTerm ? (
                <Search className="w-7 h-7" />
              ) : (
                <UserX className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'employees'
                  ? 'Nenhum funcionário cadastrado ainda'
                  : activeTab === 'pending'
                  ? 'Nenhum convite pendente no momento'
                  : searchTerm
                  ? 'Nenhum usuário encontrado'
                  : 'Nenhum membro encontrado'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activeTab === 'employees'
                  ? 'Convide os membros da sua equipe para delegar funções operacionais (como controle de estoque e lançamento de produtos) mantendo a segurança dos dados financeiros da sua empresa.'
                  : activeTab === 'pending'
                  ? 'Todos os colaboradores convidados já aceitaram o convite e estão com acesso ativo.'
                  : searchTerm
                  ? `Não encontramos nenhum membro com o termo "${searchTerm}". Verifique a digitação ou limpe o filtro.`
                  : 'Comece adicionando seu primeiro colaborador para trabalhar em equipe.'}
              </p>
            </div>

            {isOwner && (
              <div className="pt-2">
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Limpar Busca
                  </button>
                ) : (
                  <button
                    onClick={handleOpenInvite}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Convidar Primeiro Funcionário</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Usuário</th>
                  <th className="py-3.5 px-4">Papel (Cargo)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Data de Inclusão</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMembers.map((member) => {
                  const roleDef = ANT_ROLES[member.role] || ANT_ROLES.owner;
                  const isCurrentUser = member.email.toLowerCase() === (user?.email || '').toLowerCase();
                  const initial = (member.name || member.email || 'U').charAt(0).toUpperCase();

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Nome / Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              member.role === 'owner'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Papel */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            member.role === 'owner'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {member.role === 'owner' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Briefcase className="w-3.5 h-3.5" />
                          )}
                          <span>{roleDef.name}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <Clock className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                            {isOwner && (
                              <button
                                onClick={() => handleResend(member)}
                                className="text-[10px] text-purple-600 hover:underline font-semibold cursor-pointer"
                                title="Reenviar convite por e-mail"
                              >
                                Reenviar
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-500">
                        {new Date(member.invited_at || member.created_at || Date.now()).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {isOwner ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                              title="Editar dados e papel deste colaborador"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingMember(member)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remover membro da empresa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Somente leitura</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Convidar Novo Usuário */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Convidar Novo Usuário</h3>
                  <p className="text-xs text-slate-500">Adicione um novo colaborador à empresa {companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: Maria Fernandes"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="exemplo@suaempresa.com.br"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                {/* Card Informativo de Boas Práticas: E-mail Corporativo */}
                <div className="mt-2.5 p-3 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/70 text-slate-700 dark:text-slate-300 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5 shadow-2xs">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong className="font-bold text-purple-900 dark:text-purple-200">Dica ANT:</strong> sempre que possível, utilize e-mails corporativos para seus colaboradores. Isso facilita a gestão de acessos, aumenta a segurança da empresa e simplifica processos em casos de desligamento ou troca de funcionários.
                      </p>
                      <div className="pt-0.5">
                        <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 block mb-1">
                          Exemplos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                            estoque@suaempresa.com.br
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                            financeiro@suaempresa.com.br
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono shadow-2xs">
                            atendimento@suaempresa.com.br
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Definição do Papel (Nível de Acesso)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole('employee')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteRole === 'employee'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Funcionário</span>
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Operacional (Produtos & Estoque)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteRole('owner')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteRole === 'owner'
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Proprietário</span>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Acesso Total (Finanças & Equipe)
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                O colaborador convidado receberá acesso com base no papel selecionado e terá seus acessos vinculados exclusivamente à sua empresa.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Convite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Colaborador */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Colaborador</h3>
                  <p className="text-xs text-slate-500">Atualize os dados e o papel de acesso na empresa</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Papel de Acesso (Cargo)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('employee')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'employee'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Funcionário</span>
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Operacional
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('owner')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'owner'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Proprietário</span>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Acesso Total
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Remover Usuário</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tem certeza que deseja remover <strong className="text-slate-900 dark:text-white">{deletingMember.name}</strong> ({deletingMember.email}) da equipe da empresa? Este usuário perderá o acesso imediato ao sistema.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteMember}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
