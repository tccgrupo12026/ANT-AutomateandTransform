import React from 'react';
import { AntLogo } from '../common/AntLogo';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface CtaSectionProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  return (
    <section id="cta-final" className="py-20 sm:py-28 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl border border-purple-700/50">
          
          {/* Subtle Ambient Light Blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
            
            {/* Top Logo (Official with white background) */}
            <div className="mb-6">
              <AntLogo size={52} showText={false} />
            </div>

            {/* Sub-pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ANT &bull; Automate and Transform</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Transforme sua gestão hoje.
            </h2>

            {/* Text */}
            <p className="mt-4 text-base sm:text-lg lg:text-xl text-purple-100/90 max-w-xl leading-relaxed">
              Organize, acompanhe e faça sua empresa crescer com o ANT.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button
                id="cta-start-free-btn"
                type="button"
                onClick={onSignUpClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                id="cta-login-btn"
                type="button"
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              >
                Entrar
              </button>
            </div>

            {/* Bottom Security Assurance */}
            <div className="mt-8 flex items-center gap-2 text-xs text-purple-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Acesso instantâneo e seguro. Desenvolvido para a realidade do seu negócio.</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
