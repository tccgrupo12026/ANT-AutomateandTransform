/**
 * ANT — Automate and Transform
 * Tela de Aceite de Convite de Colaborador
 *
 * Permite ao colaborador validar o token seguro, conferir os dados da empresa,
 * criar sua senha no Supabase Auth e ingressar na empresa sem criar nova empresa.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { AntLogo } from '../common/AntLogo';
import { getInvitationByToken, acceptInvitation } from '../../services/rbacService';
import { CompanyMember, isInviteExpired } from '../../types/rbac';
import { getSupabaseClient } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AcceptInviteViewProps {
  token: string;
  onAccepted: () => void;
  onGoToLogin: () => void;
}

export const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({
  token,
  onAccepted,
  onGoToLogin,
}) => {
  const { signIn } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [invitation, setInvitation] = useState<CompanyMember | null>(null);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const member = await getInvitationByToken(token);
        if (isMounted) {
          setInvitation(member);
        }
      } catch (err) {
        console.warn('Erro ao carregar convite:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!invitation) return;

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      let createdUserId = '';

      if (supabase) {
        // 1. Tenta criar o usuário no Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.email.trim(),
          password: password,
          options: {
            data: {
              full_name: invitation.name,
              company_name: invitation.company_name || 'Minha Empresa',
              company_id: invitation.company_id,
              role: invitation.role,
              is_invited: true,
            },
          },
        });

        if (signUpError) {
          const msg = signUpError.message || '';
          // Se já cadastrado, tenta efetuar login com a senha fornecida
          if (msg.includes('already registered') || msg.includes('User already registered')) {
            const loginRes = await signIn(invitation.email.trim(), password);
            if (!loginRes.success) {
              setErrorMessage(
                'Este e-mail já possui conta no ANT. A senha informada não corresponde à sua conta existente ou o e-mail requer confirmação.'
              );
              setIsSubmitting(false);
              return;
            }
            const sessionRes = await supabase.auth.getSession();
            createdUserId = sessionRes.data.session?.user?.id || '';
          } else {
            setErrorMessage(signUpError.message || 'Falha ao registrar conta no servidor.');
            setIsSubmitting(false);
            return;
          }
        } else if (signUpData?.user) {
          createdUserId = signUpData.user.id;
          // Se não houver sessão ativa, realiza login imediato
          if (!signUpData.session) {
            await signIn(invitation.email.trim(), password);
          }
        }
      }

      // 2. Aceita o convite na tabela company_members vinculando o userId
      const acceptRes = await acceptInvitation(token, createdUserId || `user_${Date.now()}`);
      if (!acceptRes.success && acceptRes.error) {
        setErrorMessage(acceptRes.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Convite aceito com sucesso! Redirecionando para o painel...');
      setTimeout(() => {
        onAccepted();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao aceitar convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AntLogo size={48} showText={true} />
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
            Validando link seguro de convite...
          </div>
        </div>
      </div>
    );
  }

  // 2. Convite não encontrado
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Convite Não Encontrado</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Este link de convite é inválido, não existe ou foi revogado pelo proprietário da empresa.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Ir para a Página Inicial
          </button>
        </div>
      </div>
    );
  }

  const isExpired = isInviteExpired(invitation);
  const isAlreadyActive = invitation.status === 'active' && Boolean(invitation.user_id);

  // 3. Convite já aceito
  if (isAlreadyActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Convite Já Aceito</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Este convite para a empresa <strong>{invitation.company_name || 'sua empresa'}</strong> já foi aceito anteriormente. Você pode entrar diretamente com seu e-mail e senha.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Fazer Login no ANT
          </button>
        </div>
      </div>
    );
  }

  // 4. Convite expirado
  if (isExpired) {
    const expiredDateFormatted = invitation.expires_at
      ? new Date(invitation.expires_at).toLocaleDateString('pt-BR')
      : 'recentemente';

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Convite Expirado
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Validade Expirada</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Este convite expirou em <strong>{expiredDateFormatted}</strong> (limite de 7 dias). Entre em contato com o proprietário de <strong>{invitation.company_name || 'sua empresa'}</strong> para solicitar a renovação do seu convite.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = invitation.role === 'owner' ? 'Proprietário' : 'Funcionário (Operacional)';

  // 5. Convite Válido e Pendente -> Formulário de Criação de Senha
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 selection:bg-purple-600 selection:text-white">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header com branding */}
        <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Convite Exclusivo de Equipe
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Bem-vindo ao ANT!</h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Você foi convidado para integrar a equipe de gestão da empresa.
          </p>
        </div>

        {/* Informações da Empresa & Cargo */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Empresa</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {invitation.company_name || 'Microempresa'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Papel / Acesso</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                <Check className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">E-mail</span>
              </div>
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                {invitation.email}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Formulário de Criação de Senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invitation.name}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Crie sua Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirme sua Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Configurando Acesso...</span>
                  </>
                ) : (
                  <>
                    <span>Aceitar Convite e Acessar Empresa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Já possui uma conta existente?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-purple-700 dark:text-purple-400 font-bold hover:underline cursor-pointer"
              >
                Faça login direto
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
