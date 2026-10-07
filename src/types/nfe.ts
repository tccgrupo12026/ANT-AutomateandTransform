/**
 * ANT — Automate and Transform
 * Type Definitions para Módulo Fiscal & Importação de NF-e (Fase 4 — TCC)
 */

export interface NfeItem {
  id?: string;
  nfe_import_id?: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface NfeImport {
  id: string;
  company_id: string;
  imported_by_user_id?: string;
  imported_by_user_name?: string;
  access_key: string; // 44 dígitos
  supplier_name: string;
  supplier_cnpj: string;
  number: string;
  series: string;
  issue_date: string;
  total_amount: number;
  items_count: number;
  notes?: string;
  created_at: string;
  items?: NfeItem[];
}

export interface SimulatedNfeData {
  access_key: string;
  supplier_name: string;
  supplier_cnpj: string;
  number: string;
  series: string;
  issue_date: string;
  total_amount: number;
  items: NfeItem[];
}

export interface NfeImportResult {
  success: boolean;
  importRecord?: NfeImport;
  newProductsCount: number;
  updatedProductsCount: number;
  totalItemsImported: number;
  totalAmount: number;
  error?: string;
}
