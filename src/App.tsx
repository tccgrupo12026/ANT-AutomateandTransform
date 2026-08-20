/**
 * ANT — Automate and Transform
 * Plataforma web simples, moderna e acessível para gestão de microempresas
 *
 * Módulo de Autenticação com Supabase Auth & Proteção de Rotas
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AntLogo } from './components/common/AntLogo';
import { NavigationSection } from './types';

import { OverviewView } from './components/views/OverviewView';
import { ProductsView } from './components/views/ProductsView';
import { StockView } from './components/views/StockView';
import { MovementsView } from './components/views/MovementsView';
import { FinancialView } from './components/views/FinancialView';
import { PricingView } from './components/views/PricingView';
import { BusinessHealthView } from './components/views/BusinessHealthView';
import { ReportsView } from './components/views/ReportsView';
import { CompanyView } from './components/views/CompanyView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsView } from './components/views/SettingsView';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState<NavigationSection>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Loading State Screen
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="animate-pulse">
            <AntLogo size={56} showText={true} subtitle={true} />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
            Carregando ambiente seguro...
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Private Route Guard -> Login/Cadastro)
  if (!user) {
    return <AuthView />;
  }

  // 3. Authenticated State -> Workspace & Dashboard
  const renderActiveView = () => {
    switch (currentSection) {
      case 'inicio':
        return <OverviewView onNavigate={setCurrentSection} />;
      case 'produtos':
        return <ProductsView />;
      case 'estoque':
        return <ProductsView />;
      case 'movimentacoes':
        return <MovementsView />;
      case 'financeiro':
        return <FinancialView />;
      case 'precificacao':
        return <PricingView />;
      case 'saude_negocio':
        return <BusinessHealthView />;
      case 'relatorios':
        return <ReportsView />;
      case 'empresa':
        return <CompanyView />;
      case 'perfil':
        return <CompanyView />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <OverviewView onNavigate={setCurrentSection} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Workspace (with margin offset for fixed desktop sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          id="main-header"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main id="main-content" className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        <Footer id="main-footer" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

