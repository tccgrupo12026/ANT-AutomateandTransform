import React from 'react';
import { Building2, User, Mail, Shield, LogOut, KeyRound, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileView: React.FC = () => {
  const { user, fullName, companyName, signOut } = useAuth();
  const initial = (fullName || user?.email || 'E').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Perfil da Empresa &amp; Acesso
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Informações cadastrais, credenciais de acesso Supabase Auth e sessão do usuário no ANT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Identidade Autenticada
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Form Scaffold (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card id="profile-info-card" title="Dados da Microempresa">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    Nome da Microempresa
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={companyName}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    Nome do Empreendedor
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={fullName}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    E-mail de Acesso
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || 'contato@empresa.com'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    Identificador de Usuário (UID)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.id ? `${user.id.slice(0, 16)}...` : 'Sessão Ativa'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-mono text-slate-600 dark:text-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sessão Segura:</span> Você está conectado à plataforma ANT com persistência automática de sessão via Supabase Auth.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Visual Badge Card (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto shadow-md">
              {initial}
            </div>
            <div>
              <h3 className="text-base font-bold">{fullName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{companyName}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="purple" size="sm">MEI / ME</Badge>
              <Badge variant="green" size="sm">Autenticado</Badge>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => signOut()}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão (Logout)</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-200">
              <Shield className="w-4 h-4" />
              Ambiente Seguro
            </div>
            <p className="text-xs text-purple-100/80 leading-relaxed">
              Seus dados são confidenciais e protegidos para uso exclusivo na gestão do seu negócio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
