/**
 * ANT — Automate and Transform
 * Plataforma web simples, moderna e acessível para gestão de microempresas
 *
 * Módulo de Autenticação com Supabase Auth, RBAC & Suporte a Convites com Links Seguros
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { RbacProvider, useRbac } from './contexts/RbacContext';
import { AuthView } from './components/auth/AuthView';
import { AcceptInviteView } from './components/auth/AcceptInviteView';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AntLogo } from './components/common/AntLogo';
import { SubscriptionBanner } from './components/subscription/SubscriptionBanner';
import { NavigationSection } from './types';

import { OverviewView } from './components/views/OverviewView';
import { QuickSaleView } from './components/views/QuickSaleView';
import { ProductsView } from './components/views/ProductsView';
import { StockView } from './components/views/StockView';
import { MovementsView } from './components/views/MovementsView';
import { FinancialView } from './components/views/FinancialView';
import { PricingView } from './components/views/PricingView';
import { BusinessHealthView } from './components/views/BusinessHealthView';
import { ChartsView } from './components/views/ChartsView';
import { ReportsView } from './components/views/ReportsView';
import { CompanyView } from './components/views/CompanyView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsView } from './components/views/SettingsView';
import { PlansView } from './components/views/PlansView';
import { UsersView } from './components/views/UsersView';
import { AccessDeniedView } from './components/views/AccessDeniedView';
import { NotFoundView } from './components/views/NotFoundView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AdminCompaniesView } from './components/admin/AdminCompaniesView';
import { AdminSubscriptionsView } from './components/admin/AdminSubscriptionsView';
import { AdminPlatformView } from './components/admin/AdminPlatformView';
import { AdminSupportView } from './components/admin/AdminSupportView';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { canAccess, refreshMembers, currentRole, isAdmin } = useRbac();
  const [currentSection, setCurrentSection] = useState<NavigationSection>(() => {
    return currentRole === 'ant_admin' ? 'admin_dashboard' : 'inicio';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync default route if user role becomes ant_admin
  useEffect(() => {
    if (currentRole === 'ant_admin' && (currentSection === 'inicio' || !currentSection.startsWith('admin_'))) {
      setCurrentSection('admin_dashboard');
    } else if (currentRole !== 'ant_admin' && currentSection.startsWith('admin_')) {
      setCurrentSection('inicio');
    }
  }, [currentRole]);

  // Detecção de link de convite na URL
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('invite_token');
      if (token) return token;

      // Fallback para hash (ex: /#invite_token=xxx)
      if (window.location.hash.includes('invite_token=')) {
        const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
        const hashParams = new URLSearchParams(hashQuery);
        return hashParams.get('invite_token');
      }
    }
    return null;
  });

  // Unauthenticated view state: 'landing' or 'auth'
  const [unauthView, setUnauthView] = useState<'landing' | 'auth'>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  const cleanInviteUrl = () => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

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

  // 2. Fluxo Especial: Link Seguro de Convite de Colaborador
  if (inviteToken) {
    return (
      <AcceptInviteView
        token={inviteToken}
        onAccepted={async () => {
          cleanInviteUrl();
          setInviteToken(null);
          await refreshMembers();
        }}
        onGoToLogin={() => {
          cleanInviteUrl();
          setInviteToken(null);
          setUnauthView('auth');
          setAuthInitialMode('login');
        }}
      />
    );
  }

  // 3. Unauthenticated State (Public SaaS Landing Page & Auth Flow)
  if (!user) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onLoginClick={() => {
            setAuthInitialMode('login');
            setUnauthView('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSignUpClick={() => {
            setAuthInitialMode('signup');
            setUnauthView('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }

    return (
      <AuthView
        initialMode={authInitialMode}
        onBackToLanding={() => {
          setUnauthView('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  // 4. Authenticated State -> Workspace & Dashboard with RBAC Guard
  const renderActiveView = () => {
    // RBAC Route Permission Check
    if (!canAccess(currentSection)) {
      const fallbackHome: NavigationSection = currentRole === 'ant_admin' ? 'admin_dashboard' : 'inicio';
      return <AccessDeniedView onNavigateHome={() => setCurrentSection(fallbackHome)} />;
    }

    switch (currentSection) {
      // Rotas Exclusivas dos Criadores ANT (Admin SaaS)
      case 'admin_dashboard':
        return <AdminDashboardView onNavigate={setCurrentSection} />;
      case 'admin_companies':
        return <AdminCompaniesView />;
      case 'admin_subscriptions':
        return <AdminSubscriptionsView />;
      case 'admin_platform':
        return <AdminPlatformView />;
      case 'admin_support':
        return <AdminSupportView />;

      // Rotas Padrão de Clientes / Gestão de Empresas
      case 'inicio':
        return <OverviewView onNavigate={setCurrentSection} />;
      case 'venda_rapida':
        return <QuickSaleView />;
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
        return <BusinessHealthView onNavigate={setCurrentSection} />;
      case 'graficos':
        return <ChartsView onNavigate={setCurrentSection} />;
      case 'relatorios':
        return <ReportsView onNavigate={setCurrentSection} />;
      case 'empresa':
        return <CompanyView />;
      case 'usuarios':
        return <UsersView />;
      case 'perfil':
        return <CompanyView />;
      case 'planos':
        return <PlansView />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <NotFoundView onNavigate={setCurrentSection} />;
    }
  };

  const isAntAdmin = currentRole === 'ant_admin' || isAdmin;

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
          onNavigate={setCurrentSection}
        />

        <main id="main-content" className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Top Trial & Subscription Notification Banner (apenas para clientes) */}
          {!isAntAdmin && currentSection !== 'planos' && (
            <SubscriptionBanner onNavigateToPlans={() => setCurrentSection('planos')} />
          )}

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
      <SubscriptionProvider>
        <RbacProvider>
          <AppContent />
        </RbacProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
