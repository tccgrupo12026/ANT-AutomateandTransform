import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  FileText,
  Phone,
  Mail,
  MapPin,
  Map,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import { companyService } from '../../services/companyService';
import { CompanyFormData } from '../../types';

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

export const CompanyView: React.FC = () => {
  const { user, companyName, fullName, updateUserMetadata } = useAuth();

  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: '',
    responsible_name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Format helpers
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
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  // Load existing company data on component mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await companyService.getCompany(user.id);
        if (isMounted && data) {
          setFormData({
            company_name: data.company_name || companyName || '',
            responsible_name: data.responsible_name || fullName || '',
            cnpj: data.cnpj || '',
            phone: data.phone || '',
            email: data.email || user.email || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
          });
        } else if (isMounted) {
          // Pre-populate with auth info if empty
          setFormData({
            company_name: companyName || '',
            responsible_name: fullName || '',
            cnpj: '',
            phone: '',
            email: user.email || '',
            address: '',
            city: '',
            state: '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados da empresa:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, companyName, fullName, user?.email]);

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    let formattedValue = value;
    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    if (feedback.type) {
      setFeedback({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setFeedback({
        type: 'error',
        message: 'Você precisa estar autenticado para salvar os dados da empresa.',
      });
      return;
    }

    if (!formData.company_name.trim()) {
      setFeedback({
        type: 'error',
        message: 'O Nome da empresa é obrigatório.',
      });
      return;
    }

    if (!formData.responsible_name.trim()) {
      setFeedback({
        type: 'error',
        message: 'O Nome do responsável é obrigatório.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await companyService.saveCompany(user.id, formData);

      if (error) {
        setFeedback({
          type: 'error',
          message: error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Dados da empresa salvos e atualizados com sucesso no Supabase!',
        });

        // Sincronizar contexto visual imediatamente
        updateUserMetadata({
          companyName: formData.company_name.trim(),
          fullName: formData.responsible_name.trim(),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao salvar dados da empresa.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Empresa
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastro e gerenciamento dos dados cadastrais da sua microempresa vinculada à sua conta no ANT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-purple-600 dark:text-purple-400" />
            Row Level Security (RLS) Ativo
          </Badge>
        </div>
      </div>

      {/* Main Grid: Form + Summary / Identity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Dados Cadastrais da Empresa"
            subtitle="Preencha as informações para registrar ou atualizar sua empresa."
          >
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xs font-medium">Carregando dados da empresa...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Feedback Alerts */}
                {feedback.type === 'success' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feedback.message}</span>
                  </div>
                )}

                {feedback.type === 'error' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Nome da Empresa */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="company_name"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Nome da Empresa <span className="text-purple-600">*</span>
                    </label>
                    <input
                      id="company_name"
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Ex: Mercearia do Bairro Ltda"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* 2. Nome do Responsável */}
                  <div>
                    <label
                      htmlFor="responsible_name"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Nome do Responsável <span className="text-purple-600">*</span>
                    </label>
                    <input
                      id="responsible_name"
                      type="text"
                      required
                      value={formData.responsible_name}
                      onChange={(e) => handleChange('responsible_name', e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* 3. CNPJ */}
                  <div>
                    <label
                      htmlFor="cnpj"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      CNPJ
                    </label>
                    <input
                      id="cnpj"
                      type="text"
                      maxLength={18}
                      value={formData.cnpj}
                      onChange={(e) => handleChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                    />
                  </div>

                  {/* 4. Telefone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="phone"
                      type="text"
                      maxLength={15}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                    />
                  </div>

                  {/* 5. E-mail da Empresa */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      E-mail da Empresa
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contato@minhaempresa.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* 6. Endereço */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Endereço (Rua, Número, Bairro)
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Ex: Av. Principal, 100 - Centro"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* 7. Cidade */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Cidade
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* 8. Estado */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
                    >
                      <Map className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Estado (UF)
                    </label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                    >
                      <option value="">Selecione o Estado...</option>
                      {BRAZILIAN_STATES.map((st) => (
                        <option key={st.uf} value={st.uf}>
                          {st.uf} — {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    <span className="text-purple-600 font-bold">*</span> Campos obrigatórios para identificação no ANT.
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando dados...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Dados da Empresa</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Official ANT Identity & Live Card Preview */}
        <div className="space-y-6">
          {/* Official Visual Card with MANDATORY White Background Logo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            {/* Center Logo with mandatory white background */}
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100 mb-3 flex items-center justify-center">
                <AntLogo size={56} showText={false} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formData.company_name || companyName || 'Minha Microempresa'}
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-0.5">
                {formData.responsible_name || fullName || 'Empreendedor Responsável'}
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">CNPJ:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {formData.cnpj || 'Não informado'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Telefone:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formData.phone || 'Não informado'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Localização:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formData.city && formData.state
                    ? `${formData.city} / ${formData.state}`
                    : formData.city || formData.state || 'Não informado'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <Badge variant="purple" size="sm">
                Empresa Ativa
              </Badge>
              <Badge variant="green" size="sm">
                Supabase RLS
              </Badge>
            </div>
          </div>

          {/* Security & RLS Explanation Card */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Privacidade &amp; Segurança ANT</span>
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
              Os dados cadastrais desta empresa são vinculados exclusivamente ao seu identificador de usuário no Supabase através de políticas de <strong>Row Level Security</strong>. Nenhum outro usuário ou empresa tem acesso a essas informações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
