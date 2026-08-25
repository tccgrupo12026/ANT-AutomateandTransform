import React from 'react';
import { AntLogo } from '../common/AntLogo';
import { ArrowUp, ShieldCheck } from 'lucide-react';

interface LandingFooterProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="landing-footer" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Slogan Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <AntLogo size={40} showText={true} subtitle={true} textVariant="header" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Plataforma web simples, moderna e acessível desenvolvida especialmente para centralizar estoque, finanças e impulsionar a gestão de microempresas.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente seguro e determinístico para o seu negócio</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('beneficios')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Benefícios
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('como-funciona')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('diferenciais')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Diferenciais
                </button>
              </li>
            </ul>
          </div>

          {/* Access CTAs */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Acesso à Plataforma
            </h4>
            <p className="text-xs text-slate-400">
              Comece agora mesmo a organizar sua microempresa com total autonomia.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSignUpClick}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center shadow-xs transition-colors cursor-pointer"
              >
                Criar Conta Grátis
              </button>
              <button
                type="button"
                onClick={onLoginClick}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs text-center border border-slate-700 transition-colors cursor-pointer"
              >
                Acessar Minha Conta
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} ANT — Automate and Transform. Todos os direitos reservados.
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
