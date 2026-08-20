import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Package,
  ShieldCheck,
  KeyRound,
  LogOut,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Save,
  Sliders,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  FileText,
  Info,
  Layers,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import { companyService } from '../../services/companyService';
import {
  settingsService,
  TIMEZONE_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
} from '../../services/settingsService';
import { SettingsFormData, CurrencyType, DateFormatType } from '../../types';

const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

type SettingsTab = 'todas' | 'empresa' | 'sistema' | 'financeiro' | 'estoque' | 'seguranca';

export const SettingsView: React.FC = () => {
  const { user, companyName, fullName, updateUserMetadata, changePassword, signOutAllDevices } =
    useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('todas');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<SettingsFormData>({
    // Dados da Empresa
    company_name: companyName || '',
    responsible_name: fullName || '',
    cnpj: '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    state: 'SP',

    // Preferências do Sistema
    currency: 'BRL',
    date_format: 'DD/MM/YYYY',
    timezone: 'America/Sao_Paulo',

    // Preferências Financeiras
    default_profit_margin: '30',
    default_tax_rate: '6.0',
    financial_alert_threshold: '0',

    // Preferências de Estoque
    default_min_stock: '5',
    low_stock_alert_enabled: true,
    block_zero_stock_sales: false,
  });

  // Feedback Notifications
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Sign out all devices modal
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  // Load initial settings and company data
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [companyRes, settingsRes] = await Promise.all([
          companyService.getCompany(user.id),
          settingsService.getSettings(user.id),
        ]);

        if (isMounted) {
          const comp = companyRes.data;
          const sett = settingsRes.data;

          setFormData((prev) => ({
            ...prev,
            // Dados da Empresa
            company_name: comp?.company_name || prev.company_name,
            responsible_name: comp?.responsible_name || prev.responsible_name,
            cnpj: comp?.cnpj || '',
            phone: comp?.phone || '',
            email: comp?.email || user.email || '',
            address: comp?.address || '',
            city: comp?.city || '',
            state: comp?.state || 'SP',

            // Preferências do Sistema
            currency: sett?.currency || 'BRL',
            date_format: sett?.date_format || 'DD/MM/YYYY',
            timezone: sett?.timezone || 'America/Sao_Paulo',

            // Preferências Financeiras
            default_profit_margin: String(sett?.default_profit_margin ?? 30),
            default_tax_rate: String(sett?.default_tax_rate ?? 6.0),
            financial_alert_threshold: String(sett?.financial_alert_threshold ?? 0),

            // Preferências de Estoque
            default_min_stock: String(sett?.default_min_stock ?? 5),
            low_stock_alert_enabled: sett?.low_stock_alert_enabled ?? true,
            block_zero_stock_sales: sett?.block_zero_stock_sales ?? false,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar dados de configuração:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  // Formaters
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleInputChange = (field: keyof SettingsFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save All Settings
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user?.id) {
      setFeedback({
        type: 'error',
        message: 'Você precisa estar autenticado para salvar as preferências.',
      });
      return;
    }

    if (!formData.company_name.trim()) {
      setFeedback({
        type: 'error',
        message: 'O nome da empresa é obrigatório.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      // 1. Salvar dados da empresa
      const companyPromise = companyService.saveCompany(user.id, {
        company_name: formData.company_name.trim(),
        responsible_name: formData.responsible_name.trim() || 'Empreendedor',
        cnpj: formData.cnpj.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
      });

      // 2. Salvar preferências de sistema, finanças e estoque
      const settingsPromise = settingsService.saveSettings(user.id, {
        currency: formData.currency,
        date_format: formData.date_format,
        timezone: formData.timezone,
        default_profit_margin: Number(formData.default_profit_margin) || 30,
        default_tax_rate: Number(formData.default_tax_rate) || 0,
        financial_alert_threshold: Number(formData.financial_alert_threshold) || 0,
        default_min_stock: Number(formData.default_min_stock) || 5,
        low_stock_alert_enabled: formData.low_stock_alert_enabled,
        block_zero_stock_sales: formData.block_zero_stock_sales,
      });

      const [compRes, settRes] = await Promise.all([companyPromise, settingsPromise]);

      if (compRes.error) {
        setFeedback({
          type: 'error',
          message: `Erro ao salvar dados da empresa: ${compRes.error}`,
        });
        return;
      }

      // Atualiza o estado global de nome da empresa e usuário
      updateUserMetadata({
        companyName: formData.company_name.trim(),
        fullName: formData.responsible_name.trim(),
      });

      setFeedback({
        type: 'success',
        message: 'Configurações e preferências salvas com sucesso no ANT!',
      });

      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao salvar as configurações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password Action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback({ type: null, message: '' });

    if (!newPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Informe a nova senha.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'A confirmação de senha não coincide com a nova senha digitada.',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(newPassword);

      if (!result.success) {
        setPasswordFeedback({
          type: 'error',
          message: result.error || 'Não foi possível alterar a senha.',
        });
      } else {
        setPasswordFeedback({
          type: 'success',
          message: 'Senha alterada com sucesso!',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordFeedback({ type: null, message: '' }), 4000);
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado ao alterar a senha.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Sign out all devices action
  const handleSignOutAllDevices = async () => {
    setIsSigningOutAll(true);
    try {
      await signOutAllDevices();
      setIsSignOutModalOpen(false);
    } catch (err) {
      console.warn('Erro ao encerrar todas as sessões:', err);
    } finally {
      setIsSigningOutAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Carregando configurações do sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Configurações
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralize preferências da empresa, regras de estoque, finanças e segurança da sua conta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedback.type === 'success' && (
            <Badge variant="green" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
              {feedback.message}
            </Badge>
          )}

          {feedback.type === 'error' && (
            <Badge variant="red" size="md">
              <AlertCircle className="w-3.5 h-3.5 mr-1 inline" />
              {feedback.message}
            </Badge>
          )}

          <Button
            onClick={() => handleSaveAll()}
            isLoading={isSaving}
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('todas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'todas'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Todas as Seções
          </span>
        </button>

        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'empresa'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Dados da Empresa
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sistema')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sistema'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Preferências do Sistema
          </span>
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'financeiro'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Preferências Financeiras
          </span>
        </button>

        <button
          onClick={() => setActiveTab('estoque')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'estoque'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Preferências de Estoque
          </span>
        </button>

        <button
          onClick={() => setActiveTab('seguranca')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'seguranca'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Segurança &amp; Acesso
          </span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* ======================================================== */}
        {/* SEÇÃO 1: DADOS DA EMPRESA */}
        {/* ======================================================== */}
        {(activeTab === 'todas' || activeTab === 'empresa') && (
          <Card
            id="settings-section-company"
            title="Dados da Empresa"
            description="Informações cadastrais e de contato da sua microempresa utilizadas em documentos e relatórios."
            badge={<Badge variant="purple">Cadastro Oficial</Badge>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {/* Nome da Empresa */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Empresa / Razão Social <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Ex: Padaria & Confeitaria Estrela Ltda"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Responsável / Empreendedor
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formData.responsible_name}
                    onChange={(e) => handleInputChange('responsible_name', e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  CNPJ (opcional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone / WhatsApp Comercial
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail de Contato
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço Completo (Rua, Número, Bairro)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              {/* Estado UF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estado (UF)
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {BRAZILIAN_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.uf} — {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* ======================================================== */}
        {/* SEÇÃO 2: PREFERÊNCIAS DO SISTEMA */}
        {/* ======================================================== */}
        {(activeTab === 'todas' || activeTab === 'sistema') && (
          <Card
            id="settings-section-system"
            title="Preferências do Sistema"
            description="Padronização de moeda, fuso horário e formatos de exibição temporal para todas as telas do ANT."
            badge={<Badge variant="neutral">Interface &amp; Regional</Badge>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              {/* Moeda Utilizada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Moeda Utilizada</span>
                  <Badge variant="purple" size="sm">
                    {formData.currency}
                  </Badge>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value as CurrencyType)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent cursor-pointer font-semibold"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Exemplo: </span>
                  {settingsService.formatCurrency(1250.5, formData.currency)}
                </div>
              </div>

              {/* Formato de Data */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Formato de Data</span>
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                </label>
                <select
                  value={formData.date_format}
                  onChange={(e) =>
                    handleInputChange('date_format', e.target.value as DateFormatType)
                  }
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent cursor-pointer font-semibold"
                >
                  {DATE_FORMAT_OPTIONS.map((df) => (
                    <option key={df.value} value={df.value}>
                      {df.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Exibição: </span>
                  {settingsService.formatDate(new Date(), formData.date_format)}
                </div>
              </div>

              {/* Fuso Horário */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Fuso Horário</span>
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent cursor-pointer font-semibold"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Hora Local: </span>
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ======================================================== */}
        {/* SEÇÃO 3: PREFERÊNCIAS FINANCEIRAS */}
        {/* ======================================================== */}
        {(activeTab === 'todas' || activeTab === 'financeiro') && (
          <Card
            id="settings-section-financial"
            title="Preferências Financeiras"
            description="Parâmetros base de precificação de produtos, cálculo de margem de lucro e tributação estimada."
            badge={<Badge variant="green">Finanças</Badge>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              {/* Margem de Lucro Alvo Padrão */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Margem Alvo Padrão (%)</span>
                  <span className="text-xs font-bold text-purple-600">
                    {formData.default_profit_margin}%
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.default_profit_margin}
                    onChange={(e) => handleInputChange('default_profit_margin', e.target.value)}
                    placeholder="30"
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent font-semibold"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Margem de contribuição sugerida automaticamente ao cadastrar novos produtos.
                </p>
              </div>

              {/* Alíquota de Impostos / Taxas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Impostos e Taxas Médias (%)</span>
                  <span className="text-xs font-bold text-purple-600">
                    {formData.default_tax_rate}%
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={formData.default_tax_rate}
                    onChange={(e) => handleInputChange('default_tax_rate', e.target.value)}
                    placeholder="6.0"
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent font-semibold"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Estimativa de alíquota do Simples Nacional / MEI / taxas de cartão.
                </p>
              </div>

              {/* Teto de Alerta de Despesa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teto de Alerta Financeiro (R$)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-bold text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.financial_alert_threshold}
                    onChange={(e) =>
                      handleInputChange('financial_alert_threshold', e.target.value)
                    }
                    placeholder="0 (sem teto)"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Limite de despesas mensais para notificação no painel de saúde do negócio.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ======================================================== */}
        {/* SEÇÃO 4: PREFERÊNCIAS DE ESTOQUE */}
        {/* ======================================================== */}
        {(activeTab === 'todas' || activeTab === 'estoque') && (
          <Card
            id="settings-section-stock"
            title="Preferências de Estoque"
            description="Políticas de reposição de mercadorias, ponto de pedido padrão e regras de segurança de saldo."
            badge={<Badge variant="purple">Estoque &amp; Giro</Badge>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              {/* Estoque Mínimo Padrão */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Estoque Mínimo Padrão</span>
                  <Badge variant="purple" size="sm">
                    {formData.default_min_stock} un
                  </Badge>
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={formData.default_min_stock}
                  onChange={(e) => handleInputChange('default_min_stock', e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent font-semibold"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Quantidade mínima sugerida automaticamente ao cadastrar novos produtos.
                </p>
              </div>

              {/* Alerta de Estoque Baixo */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                <div className="flex items-start gap-2.5 pr-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Alerta de Estoque Crítico
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Destacar produtos que atingirem o estoque mínimo de reposição.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.low_stock_alert_enabled}
                  onChange={(e) =>
                    handleInputChange('low_stock_alert_enabled', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* Bloqueio de Saída com Saldo Zerado */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                <div className="flex items-start gap-2.5 pr-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Aviso de Estoque Insuficiente
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Exibir alerta ao registrar saídas com quantidade maior que o saldo em estoque.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.block_zero_stock_sales}
                  onChange={(e) =>
                    handleInputChange('block_zero_stock_sales', e.target.checked)
                  }
                  className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Botão de Salvar Geral para Seções */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            isLoading={isSaving}
            variant="primary"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Todas as Preferências
          </Button>
        </div>
      </form>

      {/* ======================================================== */}
      {/* SEÇÃO 5: SEGURANÇA DA CONTA & ACESSO */}
      {/* ======================================================== */}
      {(activeTab === 'todas' || activeTab === 'seguranca') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Alteração de Senha */}
          <Card
            id="settings-section-password"
            title="Alteração de Senha"
            description="Mantenha sua conta protegida atualizando sua senha de acesso periodicamente."
            badge={<Badge variant="purple">Credenciais</Badge>}
          >
            <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
              {passwordFeedback.type === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              {passwordFeedback.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nova Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  isLoading={isChangingPassword}
                  variant="outline"
                  size="md"
                  className="w-full border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Atualizar Senha
                </Button>
              </div>
            </form>
          </Card>

          {/* Encerramento de Sessão em Todos os Dispositivos */}
          <Card
            id="settings-section-sessions"
            title="Sessões &amp; Acessos Conectados"
            description="Controle de acesso à conta e desconexão de emergência em caso de perda ou troca de dispositivo."
            badge={<Badge variant="red">Segurança Global</Badge>}
          >
            <div className="space-y-4 mt-2">
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Encerramento de Sessões Ativas
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                      Ao acionar esta opção, sua conta será desconectada de todos os computadores, celulares e navegadores onde estiver logada atualmente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">E-mail da Conta:</span>
                  <span className="font-bold text-purple-600">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">ID de Usuário:</span>
                  <span className="font-mono text-[10px] text-slate-500">{user?.id?.slice(0, 18)}...</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsSignOutModalOpen(true)}
                variant="danger"
                size="md"
                className="w-full"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Encerrar Sessão em Todos os Dispositivos
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* IDENTIDADE DO SISTEMA ANT & BANCO DE DADOS */}
      {/* ======================================================== */}
      <Card
        id="settings-system-identity"
        className="bg-linear-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo oficial do ANT com fundo branco obrigatório */}
            <div className="p-1 rounded-xl bg-white shadow-xs border border-slate-100 dark:border-slate-800">
              <AntLogo size={36} showText={false} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>ANT — Automate and Transform</span>
                <Badge variant="purple" size="sm">
                  v1.0 Oficial
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Plataforma de gestão simplificada para microempresas • 100% Determinístico &amp; Seguro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase PostgreSQL RLS Ativo</span>
          </div>
        </div>
      </Card>

      {/* Modal de Confirmação para Desconectar de Todos os Dispositivos */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Encerrar todas as sessões?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta ação desconectará sua conta em todos os navegadores e dispositivos.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você precisará fazer login novamente com seu e-mail e senha para acessar o ANT em qualquer dispositivo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                disabled={isSigningOutAll}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <Button
                type="button"
                onClick={handleSignOutAllDevices}
                isLoading={isSigningOutAll}
                variant="danger"
                size="md"
              >
                Sim, Encerrar Tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
