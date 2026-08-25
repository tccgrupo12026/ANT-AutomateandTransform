import React from 'react';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { DifferentialsSection } from './DifferentialsSection';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onSignUpClick,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Navigation Header */}
      <LandingHeader
        onLoginClick={onLoginClick}
        onSignUpClick={onSignUpClick}
      />

      {/* Main Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onLoginClick={onLoginClick}
          onSignUpClick={onSignUpClick}
        />

        {/* 2. Benefícios */}
        <BenefitsSection />

        {/* 3. Como Funciona */}
        <HowItWorksSection onSignUpClick={onSignUpClick} />

        {/* 4. Diferenciais ANT */}
        <DifferentialsSection />

        {/* 5. Chamada Final (CTA) */}
        <CtaSection
          onLoginClick={onLoginClick}
          onSignUpClick={onSignUpClick}
        />
      </main>

      {/* Footer */}
      <LandingFooter
        onLoginClick={onLoginClick}
        onSignUpClick={onSignUpClick}
      />
    </div>
  );
};
