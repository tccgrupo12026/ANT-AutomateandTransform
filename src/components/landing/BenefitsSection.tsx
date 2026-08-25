import React from 'react';
import {
  PackageCheck,
  TrendingUp,
  Activity,
  BarChart2,
  LayoutDashboard,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      id: 'benefit-stock',
      icon: PackageCheck,
      color: 'purple',
      title: 'Controle de Estoque',
      description:
        'Acompanhe entradas, saídas e saldos de produtos em tempo real. Receba alertas inteligentes quando itens atingirem o estoque mínimo de segurança.',
      tag: 'Organização Total',
      highlight: 'Alerta de reposição automático',
    },
    {
      id: 'benefit-financial',
      icon: TrendingUp,
      color: 'emerald',
      title: 'Gestão Financeira',
      description:
        'Registre receitas e despesas com agilidade. Tenha visibilidade clara do fluxo de caixa, custos fixos, variáveis e faturamento mensal.',
      tag: 'Clareza de Caixa',
      highlight: 'Cálculo de margem e lucratividade',
    },
    {
      id: 'benefit-health',
      icon: Activity,
      color: 'purple',
      title: 'Saúde do Negócio',
      description:
        'Avalie a sustentabilidade da sua microempresa com um score determinístico de 0 a 100 baseado em liquidez, giro e eficiência operacional.',
      tag: 'Diagnóstico ANT',
      highlight: 'Score de sustentabilidade de 0 a 100',
    },
    {
      id: 'benefit-reports',
      icon: BarChart2,
      color: 'emerald',
      title: 'Relatórios e Gráficos',
      description:
        'Visualize gráficos intuitivos de desempenho, evolução de vendas e comportamento financeiro para tomar decisões seguras sem adivinhação.',
      tag: 'Tomada de Decisão',
      highlight: 'Gráficos comparativos e exportação',
    },
    {
      id: 'benefit-dashboard',
      icon: LayoutDashboard,
      color: 'purple',
      title: 'Dashboard em Tempo Real',
      description:
        'Um painel de controle consolidado que reúne os números vitais da sua empresa em uma única tela limpa, rápida e sem poluição visual.',
      tag: 'Visão Executiva',
      highlight: 'Indicadores chave consolidados',
    },
    {
      id: 'benefit-simplified',
      icon: Sparkles,
      color: 'emerald',
      title: 'Gestão Simplificada',
      description:
        'Zero burocracia e zero termos complicados. Interface moderna projetada para economizar seu tempo e facilitar a rotina do microempreendedor.',
      tag: 'Simplicidade',
      highlight: 'Feito para quem não tem tempo a perder',
    },
  ];

  return (
    <section
      id="beneficios"
      className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200 dark:border-purple-800">
            <span>Benefícios do ANT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Tudo o que sua microempresa precisa para{' '}
            <span className="text-purple-600 dark:text-purple-400">crescer com solidez</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Elimine planilhas manuais e retrabalho. O ANT reúne as ferramentas fundamentais de gestão em módulos interligados e intuitivos.
          </p>
        </div>

        {/* Benefits Grid (6 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((item) => {
            const Icon = item.icon;
            const isPurple = item.color === 'purple';

            return (
              <div
                key={item.id}
                id={item.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`p-3 rounded-xl ${
                        isPurple
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      } transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2.5">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Highlight */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500'
                    }`}
                  />
                  <span>{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
