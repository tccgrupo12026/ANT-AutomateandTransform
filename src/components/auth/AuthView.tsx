import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Building2,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  Calculator,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AntLogo } from '../common/AntLogo';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthViewProps {
  initialMode?: AuthMode;
  onBackToLanding?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onBackToLanding,
}) => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetFormStatus = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetFormStatus();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormStatus();

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      const res = await resetPassword(email);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(
          'Instruções de recuperação foram enviadas para seu e-mail (verifique a caixa de entrada ou spam).'
        );
      } else {
        setErrorMessage(res.error || 'Não foi possível enviar o e-mail de recuperação.');
      }
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUp(email, password, {
        fullName: fullName.trim(),
        companyName: companyName.trim(),
      });
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(
          'Conta criada com sucesso! Conectando ao painel do ANT...'
        );
      } else {
        setErrorMessage(res.error || 'Falha ao criar conta. Tente novamente.');
      }
      return;
    }

    // Login mode
    setIsSubmitting(true);
    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'E-mail ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Container Card */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Brand & Feature Value Showcase (Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 space-y-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl w-fit border border-white/10 shadow-xs">
              <AntLogo size={44} showText={false} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">ANT</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wider border border-emerald-400/30 uppercase">
                  Gestão ME
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium tracking-wide uppercase mt-0.5">
                Automate and Transform
              </p>
            </div>

            <p className="text-sm text-purple-100/90 leading-relaxed pt-2">
              A plataforma web moderna e descomplicada para organizar as finanças, estoque e crescimento da sua microempresa.
            </p>
          </div>

          {/* Center Pillars */}
          <div className="relative z-10 space-y-3.5 my-8">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Controle Financeiro Real</div>
                <div className="text-[11px] text-purple-200">Faturamento, custos e lucratividade matemática sem complicação.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-purple-400/20 text-purple-200 shrink-0 mt-0.5">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Estoque &amp; Produtos</div>
                <div className="text-[11px] text-purple-200">Organização clara do catálogo com alerta de reposição.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Precificação &amp; Saúde</div>
                <div className="text-[11px] text-purple-200">Cálculo de margem justa baseado 100% em regras e dados reais.</div>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-purple-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Acesso seguro e dados protegidos na nuvem.</span>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div className="max-w-md w-full mx-auto">
            
            {/* Back to landing page button */}
            {onBackToLanding && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <span>&larr; Voltar à página inicial</span>
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' ? (
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Fazer Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mb-6"
              >
                &larr; Voltar para o Login
              </button>
            )}

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {mode === 'login' && 'Bem-vindo de volta ao ANT'}
                {mode === 'signup' && 'Comece a transformar sua gestão'}
                {mode === 'forgot' && 'Recuperar acesso à conta'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'login' && 'Entre com seu e-mail e senha para acessar o painel da sua empresa.'}
                {mode === 'signup' && 'Crie sua conta em poucos segundos e organize seu negócio.'}
                {mode === 'forgot' && 'Informe o e-mail cadastrado para receber o link de redefinição.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <div className="font-bold">Atenção</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <div className="font-bold">Sucesso!</div>
                  <div>{successMessage}</div>
                </div>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Extra fields for Sign Up */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nome do Responsável
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nome da Microempresa
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Padaria &amp; Confeitaria Central"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email field (all modes) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@empresa.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Password field (login and signup) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleModeChange('forgot')}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Mínimo de 6 caracteres' : '••••••••'}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm password (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita sua senha"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-purple-600/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Entrar na Minha Conta'}
                      {mode === 'signup' && 'Criar Conta e Acessar'}
                      {mode === 'forgot' && 'Enviar Link de Redefinição'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Alternator */}
            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login' && (
                <p>
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Cadastre-se gratuitamente
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Já tem uma conta cadastrada?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Fazer Login
                  </button>
                </p>
              )}
            </div>

          </div>

          {/* Micro Footer Note */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
            ANT — Automate and Transform &bull; Gestão de Microempresas
          </div>
        </div>

      </div>
    </div>
  );
};
