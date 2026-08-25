import React, { useState, useEffect } from 'react';
import { AntLogo } from '../common/AntLogo';
import { ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="landing-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer flex items-center gap-2 group"
          id="landing-logo-btn"
        >
          <AntLogo size={42} showText={true} subtitle={true} textVariant="header" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => scrollToSection('beneficios')}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            Benefícios
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('como-funciona')}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            Como Funciona
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('diferenciais')}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            Diferenciais
          </button>
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            id="header-login-btn"
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            Entrar
          </button>
          <button
            id="header-signup-btn"
            type="button"
            onClick={onSignUpClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-sm shadow-purple-600/20 transition-all hover:shadow-md cursor-pointer"
          >
            <span>Começar Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onLoginClick}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            Entrar
          </button>
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => scrollToSection('beneficios')}
              className="text-left text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
            >
              Benefícios
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('como-funciona')}
              className="text-left text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
            >
              Como Funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('diferenciais')}
              className="text-left text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
            >
              Diferenciais
            </button>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onLoginClick}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={onSignUpClick}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <span>Começar Teste Gratuito</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
