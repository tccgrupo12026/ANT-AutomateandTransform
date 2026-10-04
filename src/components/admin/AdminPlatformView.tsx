import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Mail,
  Server,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Save,
  Radio,
  Bell,
  Clock,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRbac } from '../../contexts/RbacContext';
import { config } from '../../lib/config';
import { fetchPlatformSettings, savePlatformSettings, getDefaultPlatformSettings } from '../../services/adminService';
import { PlatformGeneralSettings } from '../../types/admin';

export const AdminPlatformView: React.FC = () => {
  const { user } = useAuth();
  const { currentRole } = useRbac();
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estado do formulário de Configurações da Plataforma
  const [platformSettings, setPlatformSettings] = useState<PlatformGeneralSettings>(fetchPlatformSettings());

  useEffect(() => {
    setPlatformSettings(fetchPlatformSettings());
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      savePlatformSettings(platformSettings);
      showToast('Configurações da plataforma ANT atualizadas com sucesso!');
    } catch {
      showToast('Falha ao salvar configurações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações gerais para os valores padrão?')) {
      const defaults = getDefaultPlatformSettings();
      setPlatformSettings(defaults);
      savePlatformSettings(defaults);
      showToast('Configurações restauradas para o padrão.');
    }
  };

  const supabaseConfigured = config.supabase.isConfigured;

  const sqlInstruction = `-- Exemplo de atribuição de ant_admin para o criador da plataforma no Supabase:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "ant_admin"}'::jsonb
WHERE email = '${user?.email || 'admin@ant.app'}';`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlInstruction);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

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
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
            <span className="text-xs text-slate-400 font-medium">Seção Exclusiva</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Configurações do ANT
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalize parâmetros institucionais, período padrão de avaliação, mensagens aos usuários e integridade da infraestrutura.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </div>

      {/* Formulário Principal: Configurações Gerais do ANT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Identidade & Contato da Plataforma
                </h3>
                <p className="text-xs text-slate-500">Dados públicos exibidos nos termos e comunicados.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Plataforma
                </label>
                <input
                  type="text"
                  value={platformSettings.platformName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Oficial de Contato & Suporte
                </label>
                <input
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Dias Padrão de Trial */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dias Padrão de Período de Testes (Trial)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Período concedido automaticamente para novas empresas cadastradas no sistema.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPlatformSettings({ ...platformSettings, defaultTrialDays: days })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        platformSettings.defaultTrialDays === days
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {days} dias
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mensagens Institucionais */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Aviso Institucional Global (Banner)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Exibe um comunicado em destaque no topo do sistema para todas as empresas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlatformSettings({ ...platformSettings, showNoticeBanner: !platformSettings.showNoticeBanner })}
                  className={`w-9 h-5 rounded-full flex items-center transition-colors px-0.5 cursor-pointer ${
                    platformSettings.showNoticeBanner ? 'bg-purple-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {platformSettings.showNoticeBanner && (
                <textarea
                  rows={2}
                  value={platformSettings.institutionalNotice}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, institutionalNotice: e.target.value })}
                  placeholder="Digite a mensagem que aparecerá para os usuários..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/40 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 resize-none animate-fadeIn"
                />
              )}
            </div>

            {/* Modo de Manutenção */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Modo de Manutenção Preventiva
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Informa aos clientes que o sistema está em manutenção sem desconectar contas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlatformSettings({ ...platformSettings, maintenanceMode: !platformSettings.maintenanceMode })}
                  className={`w-9 h-5 rounded-full flex items-center transition-colors px-0.5 cursor-pointer ${
                    platformSettings.maintenanceMode ? 'bg-amber-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {platformSettings.maintenanceMode && (
                <input
                  type="text"
                  value={platformSettings.maintenanceMessage}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMessage: e.target.value })}
                  placeholder="Mensagem de manutenção..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/40 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-600 animate-fadeIn"
                />
              )}
            </div>

            {/* Novos Cadastros */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Permitir Novos Cadastros Públicos
                </h4>
                <p className="text-[11px] text-slate-500">
                  Habilita ou suspende o botão "Criar Conta" na página inicial pública do ANT.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlatformSettings({ ...platformSettings, allowNewSignups: !platformSettings.allowNewSignups })}
                className={`w-9 h-5 rounded-full flex items-center transition-colors px-0.5 cursor-pointer ${
                  platformSettings.allowNewSignups ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Status da Infraestrutura e Permissões */}
        <div className="space-y-6">
          {/* Status dos Serviços */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Integridade da Infraestrutura
            </h4>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supabase PostgreSQL</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Conectado
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Row Level Security ativo e tabelas de isolamento por empresa.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Fluxo Oficial de Convites</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Links Seguros
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Disparos diretos de links manuais com validade de 7 dias via WhatsApp, e-mail e Slack.
              </p>
            </div>
          </div>

          {/* SQL de Atribuição de ant_admin */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-600" />
                <span>Atribuição de Papel ant_admin</span>
              </h4>
              <button
                type="button"
                onClick={copySql}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
{sqlInstruction}
            </pre>
            <p className="text-[11px] text-slate-500">
              Execute no SQL Editor do Supabase para transformar qualquer conta em superadministrador do ANT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
