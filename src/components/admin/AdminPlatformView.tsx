import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Mail,
  Server,
  Key,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRbac } from '../../contexts/RbacContext';
import { config } from '../../lib/config';

export const AdminPlatformView: React.FC = () => {
  const { user } = useAuth();
  const { currentRole, switchUserRole } = useRbac();
  const [copied, setCopied] = useState<boolean>(false);

  const supabaseConfigured = config.supabase.isConfigured;
  const resendConfigured = config.email.isConfigured;

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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
            Admin ANT
          </span>
          <span className="text-xs text-slate-400 font-medium">Configurações Globais</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Configurações da Plataforma ANT
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitoramento de integrações de infraestrutura, controle de acesso de superusuários e parâmetros operacionais do SaaS.
        </p>
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase DB & Auth */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Supabase PostgreSQL & Auth
                </h4>
                <p className="text-xs text-slate-500">Banco de Dados Principal & RLS</p>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                supabaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {supabaseConfigured ? 'Conectado' : 'Modo Offline / Local'}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Row Level Security (RLS) habilitado em todas as tabelas (companies, products, stock_movements, company_members, subscriptions).
          </div>
        </div>

        {/* Resend E-mail Service */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Resend E-mail Engine
                </h4>
                <p className="text-xs text-slate-500">Convites e Notificações Transacionais</p>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                resendConfigured
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {resendConfigured ? 'Configurado' : 'Aguardando Chave'}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Remetente oficial configurado para disparo de convites de equipe e renovação de acesso.
          </div>
        </div>
      </div>

      {/* Admin Access & SQL Guide */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Instruções de Configuração do Papel ant_admin no Supabase
            </h3>
          </div>
          <button
            onClick={copySql}
            className="cursor-pointer text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copiado!' : 'Copiar SQL'}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Para transformar um usuário registrado no Supabase em <strong>Admin ANT</strong>, execute o comando SQL abaixo no SQL Editor do painel Supabase:
        </p>

        <pre className="p-4 bg-slate-950 text-purple-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
          {sqlInstruction}
        </pre>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
          <span>
            Usuário atual conectado: <strong>{user?.email || 'Nenhum'}</strong> (Papel ativo:{' '}
            <span className="font-bold text-purple-600">{currentRole}</span>)
          </span>
          <div className="flex gap-2">
            {currentRole === 'ant_admin' ? (
              <button
                onClick={() => switchUserRole('owner')}
                className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Alternar para Visão de Empresa (Proprietário)
              </button>
            ) : (
              <button
                onClick={() => switchUserRole('ant_admin')}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold text-xs text-white"
              >
                Ativar Modo Admin ANT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
