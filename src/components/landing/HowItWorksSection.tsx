import React from 'react';
import { UserPlus, Building, PackagePlus, Rocket, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onSignUpClick: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onSignUpClick,
}) => {
  const steps = [
    {
      step: '01',
      title: 'Crie sua conta',
      subtitle: 'Passo 1',
      description:
        'Faça seu cadastro gratuitamente em menos de 1 minuto, informando apenas seu e-mail e nome. Sem necessidade de cartão de crédito.',
      icon: UserPlus,
      color: 'purple',
    },
    {
      step: '02',
      title: 'Configure sua empresa',
      subtitle: 'Passo 2',
      description:
        'Defina o nome da sua microempresa, moeda padrão e parâmetros básicos para personalizar toda a experiência do seu negócio.',
      icon: Building,
      color: 'emerald',
    },
    {
      step: '03',
      title: 'Cadastre seus produtos',
      subtitle: 'Passo 3',
      description:
        'Adicione seu catálogo com preço de custo, preço de venda e quantidades iniciais. O ANT já calcula suas margens automaticamente.',
      icon: PackagePlus,
      color: 'purple',
    },
    {
      step: '04',
      title: 'Comece a gerenciar seu negócio',
      subtitle: 'Passo 4',
      description:
        'Lance movimentações de entrada e saída, monitore o fluxo de caixa diário e acompanhe o índice de saúde da sua empresa em tempo real.',
      icon: Rocket,
      color: 'emerald',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 sm:py-28 bg-white dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200 dark:border-emerald-800">
            <span>Fluxo Simples e Rápido</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Como funciona o <span className="text-purple-600 dark:text-purple-400">ANT</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Em apenas 4 passos simples você sai da desorganização e assume o controle estratégico da sua empresa.
          </p>
        </div>

        {/* 4-Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const isPurple = item.color === 'purple';

            return (
              <div
                key={item.step}
                id={`how-it-works-step-${index + 1}`}
                className="relative bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200"
              >
                {/* Step badge */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`text-2xl font-black ${
                        isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.step}
                    </span>
                    <div
                      className={`p-3 rounded-xl ${
                        isPurple
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Etapa {index + 1} de 4</span>
                  {index < 3 ? (
                    <span className="text-purple-600 dark:text-purple-400">&rarr; Próximo</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">&check; Pronto!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA within How it Works */}
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={onSignUpClick}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm shadow-purple-600/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Criar Minha Conta Agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
