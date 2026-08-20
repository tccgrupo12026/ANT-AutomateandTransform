/**
 * ANT — Automate and Transform
 * Type Definitions & Domain Contracts
 *
 * Structured for progressive implementation:
 * - Produtos e Estoque (com digitação manual de código de barras, sem câmera)
 * - Entradas e Saídas (Movimentações)
 * - Precificação (baseada em custos e margens)
 * - Saúde do Negócio (baseada em regras e cálculos reais, SEM IA)
 * - Relatórios e Configurações da Empresa
 */

export type NavigationSection =
  | 'inicio'
  | 'produtos'
  | 'estoque'
  | 'movimentacoes'
  | 'precificacao'
  | 'saude_negocio'
  | 'relatorios'
  | 'empresa'
  | 'configuracoes'
  | 'perfil';

export interface Company {
  id?: string;
  user_id: string;
  company_name: string;
  responsible_name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyFormData {
  company_name: string;
  responsible_name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface Product {
  id?: string;
  user_id: string;
  company_id?: string;
  name: string;
  category: string;
  barcode?: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  barcode: string;
  cost_price: number | string;
  sale_price: number | string;
  current_stock: number | string;
  min_stock: number | string;
}

export interface CompanyProfile {
  name: string;
  tradeName?: string;
  cnpj?: string;
  segment?: string;
  foundationYear?: number;
  contactEmail?: string;
  ownerName?: string;
  mainGoal?: string;
}

export interface SystemModuleInfo {
  id: NavigationSection;
  label: string;
  shortDescription: string;
  iconName: string;
  badgeText?: string;
  plannedFeatures: string[];
  isBaseReady: boolean;
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasPublishableKey: boolean;
}
