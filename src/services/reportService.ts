/**
 * ANT — Automate and Transform
 * Serviço de Consolidação de Relatórios e Gráficos
 *
 * Utiliza dados reais das tabelas:
 * - companies
 * - products
 * - stock_movements
 * - financial_transactions
 *
 * 100% Determinístico — SEM Inteligência Artificial (IA), Gemini, OpenAI ou Chatbot.
 */

import { productService } from './productService';
import { movementService } from './movementService';
import { financialService } from './financialService';
import { companyService } from './companyService';
import { businessHealthService, BusinessHealthData } from './businessHealthService';
import { Product, StockMovement, FinancialTransaction, Company } from '../types';

export type ReportType =
  | 'estoque_atual'
  | 'movimentacoes'
  | 'financeiro'
  | 'estoque_baixo'
  | 'saude_resumida';

export interface MonthlyFinancialPoint {
  monthKey: string; // "2026-03"
  monthLabel: string; // "Mar/26"
  revenue: number;
  expense: number;
  profit: number;
  marginPercent: number;
  transactionCount: number;
}

export interface MonthlyMovementPoint {
  monthKey: string;
  monthLabel: string;
  entriesCount: number;
  entriesQty: number;
  exitsCount: number;
  exitsQty: number;
  balanceQty: number;
}

export interface TopMovedProductItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  totalQuantityMoved: number;
  totalExitsQty: number;
  totalEntriesQty: number;
  movementCount: number;
  estimatedRevenue: number;
}

export interface CriticalStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  deficit: number;
  costPrice: number;
  replacementCost: number;
  status: 'zerado' | 'critico' | 'adequado';
}

export interface CategoryDistributionItem {
  category: string;
  productCount: number;
  percentage: number;
  totalStockUnits: number;
  totalCostValue: number;
  totalSaleValue: number;
  estimatedMarginPercent: number;
  color: string;
}

export interface ChartsData {
  company: Company | null;
  monthlyFinancials: MonthlyFinancialPoint[];
  monthlyMovements: MonthlyMovementPoint[];
  topMovedProducts: TopMovedProductItem[];
  criticalStockProducts: CriticalStockItem[];
  categoryDistribution: CategoryDistributionItem[];
  totals: {
    totalRevenueLast12M: number;
    totalExpenseLast12M: number;
    totalProfitLast12M: number;
    totalInventoryCost: number;
    totalInventorySale: number;
    totalProductsCount: number;
    criticalCount: number;
  };
}

export interface ReportItemEstoque {
  id: string;
  barcode: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  totalCostValue: number;
  totalSaleValue: number;
  marginPercent: number;
  status: 'zerado' | 'baixo' | 'normal';
}

export interface ReportItemMovimentacao {
  id: string;
  date: string;
  productName: string;
  category: string;
  type: 'entrada' | 'saida';
  quantity: number;
  unitPrice: number;
  totalValue: number;
  reason: string;
  notes?: string;
}

export interface ReportItemFinanceiro {
  id: string;
  date: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  notes?: string;
  status: string;
}

export interface ReportItemEstoqueBaixo {
  id: string;
  name: string;
  category: string;
  barcode: string;
  currentStock: number;
  minStock: number;
  deficit: number;
  costPrice: number;
  salePrice: number;
  replacementCost: number;
  gravity: 'Crítico (Zerado)' | 'Atenção (Abaixo do Mínimo)';
}

export interface ConsolidatedReportsData {
  company: Company | null;
  generatedAt: string;
  estoqueAtual: ReportItemEstoque[];
  movimentacoes: ReportItemMovimentacao[];
  financeiro: ReportItemFinanceiro[];
  estoqueBaixo: ReportItemEstoqueBaixo[];
  saudeResumida: BusinessHealthData;
  summary: {
    totalProducts: number;
    totalStockUnits: number;
    totalCostCapital: number;
    totalSalePotential: number;
    totalMovements: number;
    totalRevenues: number;
    totalExpenses: number;
    netBalance: number;
    criticalStockItemsCount: number;
    replacementBudgetNeeded: number;
  };
}

const CATEGORY_COLORS = [
  '#6D28D9', // ANT Purple
  '#00C48C', // ANT Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Light Purple
  '#10B981', // Emerald 500
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

class ReportService {
  /**
   * Obtém os dados consolidados para todos os 6 gráficos principais
   */
  async getChartsData(userId: string): Promise<ChartsData> {
    const [companyRes, productsRes, movementsRes, financialRes] = await Promise.all([
      companyService.getCompany(userId),
      productService.getProducts(userId),
      movementService.getMovements(userId),
      financialService.getTransactions(userId),
    ]);

    const company = companyRes.data || null;
    const products = productsRes.data || [];
    const movements = movementsRes.data || [];
    const transactions = financialRes.data || [];

    // 1. Agrupar dados financeiros pelos últimos 12 meses
    const monthlyFinancials = this.computeMonthlyFinancials(transactions);

    // 2. Agrupar entradas e saídas de estoque por mês
    const monthlyMovements = this.computeMonthlyMovements(movements);

    // 3. Produtos mais movimentados
    const topMovedProducts = this.computeTopMovedProducts(products, movements);

    // 4. Produtos com estoque crítico
    const criticalStockProducts = this.computeCriticalStockProducts(products);

    // 5. Distribuição de produtos por categoria
    const categoryDistribution = this.computeCategoryDistribution(products);

    // Totais gerais
    const totalRevenueLast12M = monthlyFinancials.reduce((acc, m) => acc + m.revenue, 0);
    const totalExpenseLast12M = monthlyFinancials.reduce((acc, m) => acc + m.expense, 0);
    const totalProfitLast12M = totalRevenueLast12M - totalExpenseLast12M;

    const totalInventoryCost = products.reduce(
      (acc, p) => acc + Number(p.current_stock || 0) * Number(p.cost_price || 0),
      0
    );
    const totalInventorySale = products.reduce(
      (acc, p) => acc + Number(p.current_stock || 0) * Number(p.sale_price || 0),
      0
    );
    const criticalCount = products.filter(
      (p) => Number(p.current_stock || 0) <= Number(p.min_stock || 0)
    ).length;

    return {
      company,
      monthlyFinancials,
      monthlyMovements,
      topMovedProducts,
      criticalStockProducts,
      categoryDistribution,
      totals: {
        totalRevenueLast12M,
        totalExpenseLast12M,
        totalProfitLast12M,
        totalInventoryCost,
        totalInventorySale,
        totalProductsCount: products.length,
        criticalCount,
      },
    };
  }

  /**
   * Obtém os relatórios completos e tabulares com sumarização para exportação
   */
  async getConsolidatedReports(userId: string): Promise<ConsolidatedReportsData> {
    const [companyRes, productsRes, movementsRes, financialRes, healthRes] = await Promise.all([
      companyService.getCompany(userId),
      productService.getProducts(userId),
      movementService.getMovements(userId),
      financialService.getTransactions(userId),
      businessHealthService.getBusinessHealth(userId),
    ]);

    const company = companyRes.data || null;
    const products = productsRes.data || [];
    const movements = movementsRes.data || [];
    const transactions = financialRes.data || [];
    const healthData = healthRes.data || businessHealthService.getEmptyHealthData();

    // Relatório 1: Estoque Atual
    const estoqueAtual: ReportItemEstoque[] = products.map((p) => {
      const stock = Number(p.current_stock || 0);
      const min = Number(p.min_stock || 0);
      const cost = Number(p.cost_price || 0);
      const sale = Number(p.sale_price || 0);
      const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;

      let status: 'zerado' | 'baixo' | 'normal' = 'normal';
      if (stock <= 0) status = 'zerado';
      else if (stock <= min) status = 'baixo';

      return {
        id: p.id || Math.random().toString(),
        barcode: p.barcode || '—',
        name: p.name,
        category: p.category || 'Geral',
        currentStock: stock,
        minStock: min,
        costPrice: cost,
        salePrice: sale,
        totalCostValue: stock * cost,
        totalSaleValue: stock * sale,
        marginPercent: margin,
        status,
      };
    });

    // Relatório 2: Movimentações
    const productMap = new Map<string, Product>();
    products.forEach((p) => {
      if (p.id) productMap.set(p.id, p);
    });

    const movimentacoes: ReportItemMovimentacao[] = movements.map((m) => {
      const qty = Number(m.quantity || 0);
      const matchedProd = m.product_id ? productMap.get(m.product_id) : undefined;
      const prodName = m.product_name || m.product?.name || matchedProd?.name || 'Produto';
      const category = m.product?.category || matchedProd?.category || 'Geral';
      const unitVal =
        m.type === 'entrada'
          ? Number(m.product?.cost_price || matchedProd?.cost_price || 0)
          : Number(m.product?.sale_price || matchedProd?.sale_price || 0);

      const rawDate = m.movement_date || m.created_at || new Date().toISOString();

      return {
        id: m.id || Math.random().toString(),
        date: rawDate,
        productName: prodName,
        category,
        type: m.type,
        quantity: qty,
        unitPrice: unitVal,
        totalValue: qty * unitVal,
        reason: m.type === 'entrada' ? 'Compra / Reposição' : 'Venda / Baixa',
        notes: m.notes || '',
      };
    });

    // Relatório 3: Financeiro
    const financeiro: ReportItemFinanceiro[] = transactions.map((t) => ({
      id: t.id || Math.random().toString(),
      date: t.transaction_date || t.created_at || new Date().toISOString(),
      type: t.type,
      category: t.category || 'Geral',
      description: t.description,
      amount: Number(t.amount || 0),
      notes: t.notes || '',
      status: 'Concluído',
    }));

    // Relatório 4: Estoque Baixo
    const estoqueBaixo: ReportItemEstoqueBaixo[] = products
      .filter((p) => Number(p.current_stock || 0) <= Number(p.min_stock || 0))
      .map((p) => {
        const current = Number(p.current_stock || 0);
        const min = Number(p.min_stock || 0);
        const cost = Number(p.cost_price || 0);
        const deficit = Math.max(0, min - current);
        return {
          id: p.id || Math.random().toString(),
          name: p.name,
          category: p.category || 'Geral',
          barcode: p.barcode || '—',
          currentStock: current,
          minStock: min,
          deficit,
          costPrice: cost,
          salePrice: Number(p.sale_price || 0),
          replacementCost: deficit * cost,
          gravity: (current <= 0
            ? 'Crítico (Zerado)'
            : 'Atenção (Abaixo do Mínimo)') as 'Crítico (Zerado)' | 'Atenção (Abaixo do Mínimo)',
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock);

    // Sumarização
    const totalStockUnits = estoqueAtual.reduce((acc, p) => acc + p.currentStock, 0);
    const totalCostCapital = estoqueAtual.reduce((acc, p) => acc + p.totalCostValue, 0);
    const totalSalePotential = estoqueAtual.reduce((acc, p) => acc + p.totalSaleValue, 0);
    const totalRevenues = financeiro
      .filter((f) => f.type === 'receita')
      .reduce((acc, f) => acc + f.amount, 0);
    const totalExpenses = financeiro
      .filter((f) => f.type === 'despesa')
      .reduce((acc, f) => acc + f.amount, 0);
    const replacementBudgetNeeded = estoqueBaixo.reduce((acc, p) => acc + p.replacementCost, 0);

    return {
      company,
      generatedAt: new Date().toLocaleString('pt-BR'),
      estoqueAtual,
      movimentacoes,
      financeiro,
      estoqueBaixo,
      saudeResumida: healthData,
      summary: {
        totalProducts: products.length,
        totalStockUnits,
        totalCostCapital,
        totalSalePotential,
        totalMovements: movements.length,
        totalRevenues,
        totalExpenses,
        netBalance: totalRevenues - totalExpenses,
        criticalStockItemsCount: estoqueBaixo.length,
        replacementBudgetNeeded,
      },
    };
  }

  // ==========================================
  // MÉTODOS DE CÁLCULO E AGREGAÇÃO
  // ==========================================

  private computeMonthlyFinancials(transactions: FinancialTransaction[]): MonthlyFinancialPoint[] {
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];

    const monthsMap = new Map<string, { revenue: number; expense: number; count: number; dateObj: Date }>();

    // Inicializar os últimos 6 meses para garantir continuidade no gráfico
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, { revenue: 0, expense: 0, count: 0, dateObj: d });
    }

    // Processar transações
    for (const t of transactions) {
      const rawDate = t.transaction_date || t.created_at;
      if (!rawDate) continue;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let entry = monthsMap.get(key);
      if (!entry) {
        entry = { revenue: 0, expense: 0, count: 0, dateObj: d };
        monthsMap.set(key, entry);
      }

      const amount = Number(t.amount || 0);
      if (t.type === 'receita') {
        entry.revenue += amount;
      } else if (t.type === 'despesa') {
        entry.expense += amount;
      }
      entry.count += 1;
    }

    // Ordenar cronologicamente
    const sortedKeys = Array.from(monthsMap.keys()).sort();
    return sortedKeys.map((key) => {
      const entry = monthsMap.get(key)!;
      const profit = entry.revenue - entry.expense;
      const margin = entry.revenue > 0 ? (profit / entry.revenue) * 100 : 0;
      const monthIndex = entry.dateObj.getMonth();
      const yearShort = String(entry.dateObj.getFullYear()).slice(-2);
      const monthLabel = `${monthNames[monthIndex]}/${yearShort}`;

      return {
        monthKey: key,
        monthLabel,
        revenue: Math.round(entry.revenue * 100) / 100,
        expense: Math.round(entry.expense * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        marginPercent: Math.round(margin * 10) / 10,
        transactionCount: entry.count,
      };
    });
  }

  private computeMonthlyMovements(movements: StockMovement[]): MonthlyMovementPoint[] {
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];

    const monthsMap = new Map<
      string,
      { entriesCount: number; entriesQty: number; exitsCount: number; exitsQty: number; dateObj: Date }
    >();

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, { entriesCount: 0, entriesQty: 0, exitsCount: 0, exitsQty: 0, dateObj: d });
    }

    for (const m of movements) {
      const rawDate = m.movement_date || m.created_at;
      if (!rawDate) continue;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let entry = monthsMap.get(key);
      if (!entry) {
        entry = { entriesCount: 0, entriesQty: 0, exitsCount: 0, exitsQty: 0, dateObj: d };
        monthsMap.set(key, entry);
      }

      const qty = Number(m.quantity || 0);
      if (m.type === 'entrada') {
        entry.entriesCount += 1;
        entry.entriesQty += qty;
      } else if (m.type === 'saida') {
        entry.exitsCount += 1;
        entry.exitsQty += qty;
      }
    }

    const sortedKeys = Array.from(monthsMap.keys()).sort();
    return sortedKeys.map((key) => {
      const entry = monthsMap.get(key)!;
      const monthIndex = entry.dateObj.getMonth();
      const yearShort = String(entry.dateObj.getFullYear()).slice(-2);
      const monthLabel = `${monthNames[monthIndex]}/${yearShort}`;

      return {
        monthKey: key,
        monthLabel,
        entriesCount: entry.entriesCount,
        entriesQty: entry.entriesQty,
        exitsCount: entry.exitsCount,
        exitsQty: entry.exitsQty,
        balanceQty: entry.entriesQty - entry.exitsQty,
      };
    });
  }

  private computeTopMovedProducts(products: Product[], movements: StockMovement[]): TopMovedProductItem[] {
    const productStats = new Map<
      string,
      { totalQty: number; exitsQty: number; entriesQty: number; count: number; name: string; category: string; salePrice: number }
    >();

    // Inicializar produtos
    for (const p of products) {
      if (p.id) {
        productStats.set(p.id, {
          totalQty: 0,
          exitsQty: 0,
          entriesQty: 0,
          count: 0,
          name: p.name,
          category: p.category || 'Geral',
          salePrice: Number(p.sale_price || 0),
        });
      }
    }

    // Processar movimentações
    for (const m of movements) {
      if (!m.product_id) continue;
      let stat = productStats.get(m.product_id);
      if (!stat) {
        stat = {
          totalQty: 0,
          exitsQty: 0,
          entriesQty: 0,
          count: 0,
          name: m.product_name || m.product?.name || 'Produto',
          category: m.product?.category || 'Geral',
          salePrice: Number(m.product?.sale_price || 0),
        };
        productStats.set(m.product_id, stat);
      }

      const qty = Number(m.quantity || 0);
      stat.totalQty += qty;
      stat.count += 1;
      if (m.type === 'saida') {
        stat.exitsQty += qty;
      } else if (m.type === 'entrada') {
        stat.entriesQty += qty;
      }
    }

    const items: TopMovedProductItem[] = [];
    for (const [id, stat] of productStats.entries()) {
      const prod = products.find((p) => p.id === id);
      const currentStock = prod ? Number(prod.current_stock || 0) : 0;
      items.push({
        id,
        name: stat.name,
        category: stat.category,
        currentStock,
        totalQuantityMoved: stat.totalQty,
        totalExitsQty: stat.exitsQty,
        totalEntriesQty: stat.entriesQty,
        movementCount: stat.count,
        estimatedRevenue: stat.exitsQty * stat.salePrice,
      });
    }

    // Ordenar pelos que mais movimentaram unidades
    return items.sort((a, b) => b.totalQuantityMoved - a.totalQuantityMoved).slice(0, 10);
  }

  private computeCriticalStockProducts(products: Product[]): CriticalStockItem[] {
    return products
      .map((p) => {
        const stock = Number(p.current_stock || 0);
        const min = Number(p.min_stock || 0);
        const cost = Number(p.cost_price || 0);
        const deficit = Math.max(0, min - stock);

        let status: 'zerado' | 'critico' | 'adequado' = 'adequado';
        if (stock <= 0) status = 'zerado';
        else if (stock <= min) status = 'critico';

        return {
          id: p.id || Math.random().toString(),
          name: p.name,
          category: p.category || 'Geral',
          currentStock: stock,
          minStock: min,
          deficit,
          costPrice: cost,
          replacementCost: deficit * cost,
          status,
        };
      })
      .filter((item) => item.status !== 'adequado')
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  private computeCategoryDistribution(products: Product[]): CategoryDistributionItem[] {
    const categoriesMap = new Map<
      string,
      { count: number; totalStock: number; totalCost: number; totalSale: number }
    >();

    for (const p of products) {
      const cat = (p.category || 'Geral').trim();
      let entry = categoriesMap.get(cat);
      if (!entry) {
        entry = { count: 0, totalStock: 0, totalCost: 0, totalSale: 0 };
        categoriesMap.set(cat, entry);
      }

      const stock = Number(p.current_stock || 0);
      const cost = Number(p.cost_price || 0);
      const sale = Number(p.sale_price || 0);

      entry.count += 1;
      entry.totalStock += stock;
      entry.totalCost += stock * cost;
      entry.totalSale += stock * sale;
    }

    const totalProds = products.length || 1;
    const sorted = Array.from(categoriesMap.entries()).sort(
      (a, b) => b[1].count - a[1].count
    );

    return sorted.map(([category, val], idx) => {
      const margin =
        val.totalSale > 0
          ? ((val.totalSale - val.totalCost) / val.totalSale) * 100
          : 0;

      return {
        category,
        productCount: val.count,
        percentage: Math.round((val.count / totalProds) * 1000) / 10,
        totalStockUnits: val.totalStock,
        totalCostValue: Math.round(val.totalCost * 100) / 100,
        totalSaleValue: Math.round(val.totalSale * 100) / 100,
        estimatedMarginPercent: Math.round(margin * 10) / 10,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });
  }

  // ==========================================
  // EXPORTADORES (CSV & IMPRESSÃO PDF)
  // ==========================================

  /**
   * Exporta os dados de um relatório selecionado em formato CSV padrão RFC com BOM UTF-8
   */
  exportToCsv(
    reportType: ReportType,
    data: ConsolidatedReportsData,
    companyName: string = 'ANT'
  ): void {
    let filename = `relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    let csvContent = '';

    const sanitize = (val: any): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatBRL = (num: number): string =>
      num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    switch (reportType) {
      case 'estoque_atual': {
        filename = `ANT_Relatorio_Estoque_Atual_${new Date().toISOString().slice(0, 10)}.csv`;
        const headers = [
          'Código de Barras',
          'Produto',
          'Categoria',
          'Estoque Atual',
          'Estoque Mínimo',
          'Preço Custo (R$)',
          'Preço Venda (R$)',
          'Capital Imobilizado Custo (R$)',
          'Potencial Venda (R$)',
          'Margem Bruta (%)',
          'Status Estoque',
        ];
        const rows = data.estoqueAtual.map((p) => [
          sanitize(p.barcode),
          sanitize(p.name),
          sanitize(p.category),
          p.currentStock,
          p.minStock,
          sanitize(formatBRL(p.costPrice)),
          sanitize(formatBRL(p.salePrice)),
          sanitize(formatBRL(p.totalCostValue)),
          sanitize(formatBRL(p.totalSaleValue)),
          sanitize(`${p.marginPercent.toFixed(1)}%`),
          sanitize(
            p.status === 'zerado'
              ? 'ZERADO'
              : p.status === 'baixo'
              ? 'ABAIXO DO MÍNIMO'
              : 'NORMAL'
          ),
        ]);
        csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
        break;
      }

      case 'movimentacoes': {
        filename = `ANT_Relatorio_Movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`;
        const headers = [
          'Data/Hora',
          'Produto',
          'Categoria',
          'Tipo',
          'Quantidade',
          'Valor Unitário (R$)',
          'Valor Total (R$)',
          'Motivo',
          'Observações',
        ];
        const rows = data.movimentacoes.map((m) => [
          sanitize(new Date(m.date).toLocaleString('pt-BR')),
          sanitize(m.productName),
          sanitize(m.category),
          sanitize(m.type.toUpperCase()),
          m.quantity,
          sanitize(formatBRL(m.unitPrice)),
          sanitize(formatBRL(m.totalValue)),
          sanitize(m.reason),
          sanitize(m.notes || ''),
        ]);
        csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
        break;
      }

      case 'financeiro': {
        filename = `ANT_Relatorio_Financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
        const headers = [
          'Data',
          'Tipo',
          'Categoria',
          'Descrição',
          'Valor (R$)',
          'Observações',
          'Status',
        ];
        const rows = data.financeiro.map((f) => [
          sanitize(new Date(f.date).toLocaleDateString('pt-BR')),
          sanitize(f.type.toUpperCase()),
          sanitize(f.category),
          sanitize(f.description),
          sanitize(formatBRL(f.amount)),
          sanitize(f.notes || ''),
          sanitize(f.status),
        ]);
        csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
        break;
      }

      case 'estoque_baixo': {
        filename = `ANT_Relatorio_Estoque_Baixo_Reposicao_${new Date().toISOString().slice(0, 10)}.csv`;
        const headers = [
          'Produto',
          'Categoria',
          'Código de Barras',
          'Estoque Atual',
          'Estoque Mínimo',
          'Déficit (Qtd a Comprar)',
          'Custo Unitário (R$)',
          'Custo Estimado de Reposição (R$)',
          'Gravidade',
        ];
        const rows = data.estoqueBaixo.map((b) => [
          sanitize(b.name),
          sanitize(b.category),
          sanitize(b.barcode),
          b.currentStock,
          b.minStock,
          b.deficit,
          sanitize(formatBRL(b.costPrice)),
          sanitize(formatBRL(b.replacementCost)),
          sanitize(b.gravity),
        ]);
        csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
        break;
      }

      case 'saude_resumida': {
        filename = `ANT_Relatorio_Saude_Negocio_Resumo_${new Date().toISOString().slice(0, 10)}.csv`;
        const h = data.saudeResumida;
        const lines = [
          ['Empresa', sanitize(companyName)].join(';'),
          ['Data de Emissão', sanitize(new Date().toLocaleString('pt-BR'))].join(';'),
          ['Pontuação Geral de Saúde (0 a 100)', h.healthScore].join(';'),
          ['Status da Empresa', sanitize(h.healthStatus.toUpperCase())].join(';'),
          ['', ''].join(';'),
          ['PILAR', 'PONTUAÇÃO', 'DETALHES'].join(';'),
          [
            'Saúde Financeira',
            `${h.healthScorePillars.financialHealth.score}/${h.healthScorePillars.financialHealth.max}`,
            sanitize(h.healthScorePillars.financialHealth.details),
          ].join(';'),
          [
            'Gestão de Estoque',
            `${h.healthScorePillars.inventoryHealth.score}/${h.healthScorePillars.inventoryHealth.max}`,
            sanitize(h.healthScorePillars.inventoryHealth.details),
          ].join(';'),
          [
            'Margens e Precificação',
            `${h.healthScorePillars.pricingHealth.score}/${h.healthScorePillars.pricingHealth.max}`,
            sanitize(h.healthScorePillars.pricingHealth.details),
          ].join(';'),
          [
            'Atividade Operacional',
            `${h.healthScorePillars.operationalHealth.score}/${h.healthScorePillars.operationalHealth.max}`,
            sanitize(h.healthScorePillars.operationalHealth.details),
          ].join(';'),
          ['', ''].join(';'),
          ['INDICADORES DO MÊS', 'VALOR'].join(';'),
          ['Faturamento Mês Atual', sanitize(formatBRL(h.currentMonthRevenue))].join(';'),
          ['Despesas Mês Atual', sanitize(formatBRL(h.currentMonthExpense))].join(';'),
          ['Lucro Líquido do Mês', sanitize(formatBRL(h.currentMonthProfit))].join(';'),
          ['Capital Parado em Estoque', sanitize(formatBRL(h.totalInventoryCapitalCost))].join(';'),
          ['Produtos com Estoque Crítico', h.belowMinStockTotalCount].join(';'),
          ['Produtos Sem Movimentação (> 30d)', h.stagnantProducts.length].join(';'),
        ];
        csvContent = lines.join('\r\n');
        break;
      }
    }

    // Adiciona o Byte Order Mark (BOM) UTF-8 para garantir acentuação correta no Excel brasileiro
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Aciona a janela de impressão customizada (ou Salvar como PDF) com cabeçalho oficial do ANT
   */
  triggerPrintView(): void {
    window.print();
  }
}

export const reportService = new ReportService();
