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
import { AdminUsersView } from './components/admin/AdminUsersView';
import { AdminSubscriptionsView } from './components/admin/AdminSubscriptionsView';
import { AdminPlatformView } from './components/admin/AdminPlatformView';
import { AdminSupportView } from './components/admin/AdminSupportView';

/**
 * Extrai token de convite e detecta se a URL atual é uma rota de aceite de convite.
 * Suporta rota dedicada #/aceitar-convite?token=xxx, /aceitar-convite, e retrocompatibilidade com invite_token.
 */
function extractInviteFromUrl(): { isInviteRoute: boolean; token: string | null } {
  if (typeof window === 'undefined') {
    return { isInviteRoute: false, token: null };
  }

  try {
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const pathname = window.location.pathname || '';
    const href = window.location.href || '';

    const isInviteRoute =
      pathname.includes('/aceitar-convite') ||
      pathname.includes('/accept-invite') ||
      pathname.includes('/convite') ||
      hash.includes('aceitar-convite') ||
      hash.includes('accept-invite') ||
      hash.includes('convite') ||
      search.includes('invite_token') ||
      search.includes('token=') ||
      hash.includes('invite_token') ||
      hash.includes('token=');

    // 1. Busca em query parameters padrão (?token=xxx ou ?invite_token=xxx)
    if (search) {
      const sp = new URLSearchParams(search);
      const t =
        sp.get('token') ||
        sp.get('invite_token') ||
        sp.get('inviteToken') ||
        sp.get('invitation_token');
      if (t) return { isInviteRoute: true, token: t.trim() };
    }

    // 2. Busca em hash (#/aceitar-convite?token=xxx ou #invite_token=xxx)
    if (hash) {
      if (hash.includes('?')) {
        const queryPart = hash.substring(hash.indexOf('?') + 1);
        const hp = new URLSearchParams(queryPart);
        const t =
          hp.get('token') ||
          hp.get('invite_token') ||
          hp.get('inviteToken') ||
          hp.get('invitation_token');
        if (t) return { isInviteRoute: true, token: t.trim() };
      }

      const cleanHash = hash.replace(/^#\/?/, '');
      const hpDirect = new URLSearchParams(cleanHash);
      const tDirect =
        hpDirect.get('token') ||
        hpDirect.get('invite_token') ||
        hpDirect.get('inviteToken');
      if (tDirect) return { isInviteRoute: true, token: tDirect.trim() };

      const hashSegments = cleanHash.split('/');
      const keywords = ['aceitar-convite', 'accept-invite', 'convite', 'invite'];
      for (let i = 0; i < hashSegments.length; i++) {
        if (keywords.includes(hashSegments[i]) && hashSegments[i + 1]) {
          const segToken = hashSegments[i + 1].split('?')[0];
          if (segToken && segToken.length > 5) {
            return { isInviteRoute: true, token: segToken.trim() };
          }
        }
      }
    }

    // 3. Busca em pathname (/aceitar-convite/TOKEN)
    if (pathname) {
      const pathSegments = pathname.split('/').filter(Boolean);
      const keywords = ['aceitar-convite', 'accept-invite', 'convite', 'invite'];
      for (let i = 0; i < pathSegments.length; i++) {
        if (keywords.includes(pathSegments[i]) && pathSegments[i + 1]) {
          const segToken = pathSegments[i + 1].split('?')[0];
          if (segToken && segToken.length > 5) {
            return { isInviteRoute: true, token: segToken.trim() };
          }
        }
      }
    }

    // 4. Regex fallback em toda a URL
    const match = href.match(/[?&#](?:invite_)?token=([a-zA-Z0-9_\-]+)/i);
    if (match && match[1]) {
      return { isInviteRoute: true, token: match[1].trim() };
    }

    return { isInviteRoute, token: null };
  } catch (err) {
    console.warn('Erro ao verificar rota de convite:', err);
    return { isInviteRoute: false, token: null };
  }
}

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

  // Detecção e monitoramento da rota exclusiva de aceite de convite na URL
  const [inviteState, setInviteState] = useState<{ isInviteRoute: boolean; token: string | null }>(() => {
    return extractInviteFromUrl();
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const extracted = extractInviteFromUrl();
      if (extracted.isInviteRoute) {
        setInviteState(extracted);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

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

  // 2. Fluxo Especial: Rota Exclusiva de Aceite de Convite de Colaborador
  // NUNCA redireciona para a tela pública de Criar Conta nem Landing Page!
  if (inviteState.isInviteRoute) {
    return (
      <AcceptInviteView
        token={inviteState.token || ''}
        onAccepted={async () => {
          cleanInviteUrl();
          setInviteState({ isInviteRoute: false, token: null });
          await refreshMembers();
        }}
        onGoToLogin={() => {
          cleanInviteUrl();
          setInviteState({ isInviteRoute: false, token: null });
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
      case 'admin_users':
        return <AdminUsersView />;
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
        return currentRole === 'ant_admin' ? <AdminCompaniesView /> : <CompanyView />;
      case 'usuarios':
        return currentRole === 'ant_admin' ? <AdminUsersView /> : <UsersView />;
      case 'perfil':
        return <CompanyView />;
      case 'planos':
        return currentRole === 'ant_admin' ? <AdminSubscriptionsView /> : <PlansView />;
      case 'configuracoes':
        return currentRole === 'ant_admin' ? <AdminPlatformView /> : <SettingsView />;
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
