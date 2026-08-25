import React from 'react';
import {
  Smile,
  Store,
  Layers,
  ShieldCheck,
  Globe,
  LineChart,
  CheckCircle2,
} from 'lucide-react';

export const DifferentialsSection: React.FC = () => {
  const differentials = [
    {
      id: 'diff-easy',
      icon: Smile,
      title: 'Fácil de usar',
      description:
        'Sem termos contábeis complexos ou configurações labirínticas. A interface do ANT é limpa, direta e desenhada para qualquer pessoa utilizar sem treinamento prévio.',
      color: 'purple',
    },
    {
      id: 'diff-micro',
      icon: Store,
      title: 'Desenvolvido para microempresas',
      description:
        'Não tentamos ser um ERP gigantesco e burocrático. O ANT foi moldado exatamente para a realidade prática e ágil de quem toca um pequeno negócio.',
      color: 'emerald',
    },
    {
      id: 'diff-all-in-one',
      icon: Layers,
      title: 'Tudo em um único lugar',
      description:
        'Chega de abrir três planilhas diferentes. Controle estoque físico, vendas diárias, fluxo financeiro e precificação de margem dentro do mesmo ecossistema.',
      color: 'purple',
    },
    {
      id: 'diff-security',
      icon: ShieldCheck,
      title: 'Dados protegidos',
      description:
        'Seus registros comerciais e financeiros contam com autenticação segura e isolamento estrito por usuário, garantindo privacidade e integridade permanente.',
      color: 'emerald',
    },
    {
      id: 'diff-online',
      icon: Globe,
      title: 'Acesso online',
      description:
        'Acesse a qualquer hora e de qualquer dispositivo: computador, tablet ou celular. Seus dados estão sincronizados em nuvem sem você precisar instalar nada.',
      color: 'purple',
    },
    {
      id: 'diff-analytics',
      icon: LineChart,
      title: 'Relatórios e indicadores inteligentes',
      description:
        'Algoritmos matemáticos e determinísticos que calculam ponto de equilíbrio, margem real de produtos e score de sustentabilidade para orientar seu crescimento.',
      color: 'emerald',
    },
  ];

  return (
    <section
      id="diferenciais"
      className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200 dark:border-purple-800">
            <span>Por que escolher o ANT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Diferenciais pensados para a sua{' '}
            <span className="text-emerald-600 dark:text-emerald-400">rotina real</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Construído para simplificar o seu dia e impulsionar seus resultados sem complicação tecnológica.
          </p>
        </div>

        {/* 6 Differentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {differentials.map((item) => {
            const Icon = item.icon;
            const isPurple = item.color === 'purple';

            return (
              <div
                key={item.id}
                id={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isPurple
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                  {item.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Garantido no ANT</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
