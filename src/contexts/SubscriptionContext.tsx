/**
 * ANT — Automate and Transform
 * Subscription Context
 *
 * Provê o estado global da assinatura (Plano, Status, Dias Restantes de Trial, Expiração)
 * com reatividade em todo o sistema e recarregamento automático.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscriptionService,
  createDefaultTrialSubscription,
  buildSubscriptionSummary,
} from '../services/subscriptionService';
import {
  UserSubscription,
  SubscriptionSummary,
  PlanId,
  SubscriptionStatus,
  BillingCycle,
  ANT_PLANS,
} from '../types';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  summary: SubscriptionSummary | null;
  isLoading: boolean;
  isSaving: boolean;
  refreshSubscription: () => Promise<void>;
  changePlan: (planId: PlanId) => Promise<boolean>;
  activateSubscription: (planId: PlanId, cycle?: BillingCycle) => Promise<boolean>;
  updateStatus: (status: SubscriptionStatus) => Promise<boolean>;
  resetTrial: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await subscriptionService.getSubscription(user.id);
      if (data) {
        setSubscription(data);
        setSummary(buildSubscriptionSummary(data));
      } else {
        const fallback = createDefaultTrialSubscription(user.id);
        setSubscription(fallback);
        setSummary(buildSubscriptionSummary(fallback));
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura no SubscriptionProvider:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const changePlan = async (planId: PlanId): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSaving(true);
    try {
      const { data, error } = await subscriptionService.changePlan(user.id, planId);
      if (!error && data) {
        setSubscription(data);
        setSummary(buildSubscriptionSummary(data));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao trocar de plano:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const activateSubscription = async (
    planId: PlanId,
    cycle: BillingCycle = 'monthly'
  ): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSaving(true);
    try {
      const { data, error } = await subscriptionService.activateSubscription(user.id, planId, cycle);
      if (!error && data) {
        setSubscription(data);
        setSummary(buildSubscriptionSummary(data));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao ativar assinatura:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (status: SubscriptionStatus): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSaving(true);
    try {
      const { data, error } = await subscriptionService.updateStatus(user.id, status);
      if (!error && data) {
        setSubscription(data);
        setSummary(buildSubscriptionSummary(data));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao atualizar status da assinatura:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetTrial = async (): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSaving(true);
    try {
      const { data, error } = await subscriptionService.resetTrial(user.id);
      if (!error && data) {
        setSubscription(data);
        setSummary(buildSubscriptionSummary(data));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao reiniciar trial:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        summary,
        isLoading,
        isSaving,
        refreshSubscription: loadSubscription,
        changePlan,
        activateSubscription,
        updateStatus,
        resetTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de um SubscriptionProvider');
  }
  return context;
};
