import React from 'react';
import { AntLogo } from '../common/AntLogo';
import {
  ArrowRight,
  TrendingUp,
  Package,
  Activity,
  DollarSign,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Boxes,
} from 'lucide-react';

interface HeroSectionProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  return (
    <section id="hero" className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Soft Ambient Background Elements in Purple and Emerald */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-72 sm:w-96 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Centered Brand Badge with Official Logo */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-3 p-2 pr-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs mb-8 transition-transform hover:scale-[1.01]">
            <AntLogo size={36} showText={false} />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-purple-900 dark:text-purple-300">ANT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Plataforma SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Automate and Transform
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
            Centralize <span className="text-purple-600 dark:text-purple-400">estoque</span>,{' '}
            <span className="text-emerald-600 dark:text-emerald-400">finanças</span> e{' '}
            gestão em um único lugar
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            O ANT foi desenvolvido especificamente para microempresas que buscam organização, clareza e previsibilidade financeira. Elimine o caos das planilhas e tenha controle total do seu negócio em uma interface simples e moderna.
          </p>

          {/* Slogan Card (Ant Philosophy) */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 max-w-2xl text-left sm:text-center relative">
            <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-200 italic leading-relaxed">
              &ldquo;Muitos empreendedores trabalham como formigas: organizados, persistentes e incansáveis. O ANT nasceu para automatizar processos e transformar a forma como esses negócios crescem.&rdquo;
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              id="hero-start-free-btn"
              type="button"
              onClick={onSignUpClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Começar Teste Gratuito</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="hero-login-btn"
              type="button"
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
            >
              Entrar
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Sem necessidade de cartão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Acesso online imediato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Dados 100% protegidos</span>
            </div>
          </div>
        </div>

        {/* Product UI Preview Mockup */}
        <div className="mt-14 sm:mt-18 max-w-5xl mx-auto">
          <div className="relative rounded-3xl bg-slate-900 p-2 sm:p-3.5 shadow-2xl shadow-purple-900/15 border border-slate-800">
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-3 py-1 rounded-md bg-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                app.ant-gestao.com / painel
              </div>
              <div className="w-12" />
            </div>

            {/* Inner Dashboard Canvas */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 text-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Stat Card 1: Faturamento & Lucro */}
              <div className="md:col-span-4 bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Faturamento Mensal
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl sm:text-3xl font-black text-white">R$ 28.450,00</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.4% vs. mês anterior</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
                  <span>Lucro Líquido:</span>
                  <span className="text-emerald-400 font-bold">R$ 8.920,00</span>
                </div>
              </div>

              {/* Stat Card 2: Estoque & Produtos */}
              <div className="md:col-span-4 bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Controle de Estoque
                  </span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-3">
                  <div className="text-2xl sm:text-3xl font-black text-white">142 itens</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>138 itens em nível seguro</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
                  <span>Valor em Estoque:</span>
                  <span className="text-white font-bold">R$ 41.300,00</span>
                </div>
              </div>

              {/* Stat Card 3: Saúde do Negócio (ANT Score) */}
              <div className="md:col-span-4 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 rounded-xl p-4 border border-purple-800/50 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Saúde do Negócio
                  </span>
                  <div className="p-2 rounded-lg bg-purple-600/20 text-purple-300">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline gap-2">
                  <div className="text-3xl sm:text-4xl font-black text-white">94</div>
                  <span className="text-xs font-bold text-purple-300">/ 100</span>
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Excelente
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-800/40 text-[11px] text-purple-200">
                  Fluxo estável &bull; Margem saudável &bull; Estoque equilibrado
                </div>
              </div>

              {/* Visual Mini Chart & Recent Movements */}
              <div className="md:col-span-8 bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-200">Evolução Financeira Semanal</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Entradas superando custos
                  </span>
                </div>
                <div className="h-28 flex items-end gap-2 sm:gap-4 pt-4 px-2">
                  {[45, 62, 58, 80, 72, 90, 95].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-emerald-400 rounded-t-sm transition-all group-hover:brightness-110"
                        style={{ height: `${val}%` }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Status */}
              <div className="md:col-span-4 bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-300 mb-2 block">
                  Últimas Atividades
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300 truncate">Venda: Produto #104</span>
                    <span className="text-emerald-400 font-bold shrink-0">+R$ 150,00</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300 truncate">Entrada de Estoque</span>
                    <span className="text-purple-300 font-bold shrink-0">+25 un</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300 truncate">Despesa Operacional</span>
                    <span className="text-rose-400 font-bold shrink-0">-R$ 85,00</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
