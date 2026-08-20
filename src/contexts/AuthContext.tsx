/**
 * ANT — Automate and Transform
 * Authentication Context & Hook Scaffold
 *
 * Prepared for Supabase Auth in subsequent steps.
 * Does not block UI access in this foundational phase.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConnected } from '../lib/supabase';

export interface SignUpMetadata {
  companyName?: string;
  fullName?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  companyName: string;
  fullName: string;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, metadata?: SignUpMetadata) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateUserMetadata: (data: { companyName?: string; fullName?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: false,
  isConfigured: false,
  companyName: 'Minha Empresa',
  fullName: 'Empreendedor',
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false }),
  updateUserMetadata: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConnected();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      // Get initial session
      supabase.auth
        .getSession()
        .then(({ data: { session: currentSession }, error }) => {
          if (error) {
            console.warn('Erro ao obter sessão inicial:', error.message);
          }
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });

      // Listen for auth changes
      const authChangeRes = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      });

      subscription = authChangeRes.data.subscription;
    } catch {
      setIsLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const translateAuthError = (err: AuthError | Error | null): string => {
    if (!err) return 'Ocorreu um erro inesperado na autenticação.';
    const msg = err.message || '';
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    }
    if (msg.includes('User already registered') || msg.includes('already registered')) {
      return 'Este e-mail já está cadastrado. Tente fazer login.';
    }
    if (msg.includes('Password should be at least')) {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }
    if (msg.includes('rate limit') || msg.includes('Too many requests')) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
    }
    return msg || 'Falha ao autenticar. Tente novamente.';
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'O serviço de autenticação Supabase não está inicializado.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: translateAuthError(error) };
      }

      setSession(data.session);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: SignUpMetadata
  ): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'O serviço de autenticação Supabase não está inicializado.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            company_name: metadata?.companyName?.trim() || 'Minha Empresa',
            full_name: metadata?.fullName?.trim() || 'Empreendedor',
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error) };
      }

      // If Supabase auto-confirms email or returns a session
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro durante signOut:', err);
      }
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'O serviço de autenticação Supabase não está inicializado.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, error: translateAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  };

  const updateUserMetadata = (data: { companyName?: string; fullName?: string }) => {
    if (user) {
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...(data.companyName ? { company_name: data.companyName, companyName: data.companyName } : {}),
          ...(data.fullName ? { full_name: data.fullName, fullName: data.fullName } : {}),
        },
      });
    }
  };

  const companyName =
    user?.user_metadata?.company_name ||
    user?.user_metadata?.companyName ||
    'Minha Empresa';

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.fullName ||
    (user?.email ? user.email.split('@')[0] : 'Empreendedor');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        companyName,
        fullName,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
