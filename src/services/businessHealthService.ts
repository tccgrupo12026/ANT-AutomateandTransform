/**
 * ANT — Automate and Transform
 * Serviço de Diagnóstico de Saúde do Negócio
 *
 * IMPORTANTE:
 * O ANT NÃO utiliza inteligência artificial (IA), Gemini, OpenAI ou chatbots.
 * Todas as análises são 100% determinísticas, baseadas em regras de negócio,
 * cálculos matemáticos e dados reais das tabelas:
 * - companies
 * - products
 * - stock_movements
 * - financial_transactions
 */

import { productService } from './productService';
import { movementService } from './movementService';
import { financialService } from './financialService';
import { companyService } from './companyService';
import { Product, StockMovement, FinancialTransaction, Company } from '../types';

export interface HealthScorePillars {
  financialHealth: { score: number; max: number; label: string; details: string };
  inventoryHealth: { score: number; max: number; label: string; details: string };
  pricingHealth: { score: number; max: number; label: string; details: string };
  operationalHealth: { score: number; max: number; label: string; details: string };
}

export interface BusinessHealthInsight {
  id: string;
  category: 'good' | 'warning' | 'risk';
  title: string;
  description: string;
  metric?: string;
  impact?: 'alto' | 'medio' | 'baixo';
  actionPrompt?: string;
  targetSection?: 'produtos' | 'movimentacoes' | 'financeiro' | 'precificacao' | 'empresa';
}

export interface BusinessRecommendation {
  id: string;
  title: string;
  priority: 'alta' | 'media' | 'baixa';
  category: 'estoque' | 'financeiro' | 'precificacao' | 'operacional';
  description: string;
  actionText: string;
  targetSection: 'produtos' | 'movimentacoes' | 'financeiro' | 'precificacao' | 'empresa';
  affectedItems?: Array<{ name: string; detail: string }>;
}

export interface ProductMovementStat {
  product: Product;
  movementCount: number;
  totalQuantityOut: number;
  totalQuantityIn: number;
  lastMovementDate: string | null;
  daysSinceLastMovement: number;
  isStagnant: boolean; // sem movimentação > 30 dias
  isCriticallyStagnant: boolean; // sem movimentação > 60 dias
  capitalTiedUp: number;
  marginPercent: number;
}

export interface BusinessHealthData {
  company: Company | null;
  totalProducts: number;
  healthScore: number; // 0 a 100
  healthStatus: 'excelente' | 'saudavel' | 'atencao' | 'critico';
  healthScorePillars: HealthScorePillars;
  
  // Métricas Financeiras
  currentMonthRevenue: number;
  currentMonthExpense: number;
  currentMonthProfit: number;
  previousMonthRevenue: number;
  previousMonthExpense: number;
  previousMonthProfit: number;
  revenueGrowthPercent: number | null;
  profitGrowthPercent: number | null;
  profitMarginPercent: number;
  expenseRatioPercent: number;

  // Métricas de Estoque
  totalInventoryCapitalCost: number; // Capital parado em estoque (a preço de custo)
  totalInventoryRetailValue: number; // Valor total a preço de venda
  potentialGrossProfit: number;
  outOfStockProductsCount: number; // Estoque zerado (<= 0)
  criticalStockProductsCount: number; // Estoque crítico (> 0 e <= min_stock)
  healthyStockProductsCount: number; // Estoque regular (> min_stock)
  belowMinStockTotalCount: number; // Total abaixo do mínimo (zerado + crítico)
  
  // Produtos por Situação
  outOfStockProducts: Product[];
  criticalStockProducts: Product[];
  stagnantProducts: ProductMovementStat[];
  topMovedProducts: ProductMovementStat[];
  leastMovedProducts: ProductMovementStat[];
  lowMarginProducts: Array<{ product: Product; marginPercent: number }>;

  // Seções de Diagnóstico Exigidas
  positivePoints: BusinessHealthInsight[]; // O que está indo bem
  attentionPoints: BusinessHealthInsight[]; // O que precisa de atenção
  riskPoints: BusinessHealthInsight[]; // Possíveis riscos
  recommendations: BusinessRecommendation[]; // Recomendações práticas

  // Metadados
  hasSufficientData: boolean;
  calculatedAt: string;
}

export const businessHealthService = {
  /**
   * Executa diagnóstico completo 100% determinístico baseado nos registros do banco de dados
   */
  async getBusinessHealth(userId: string): Promise<{ data: BusinessHealthData; error: string | null }> {
    if (!userId) {
      return {
        data: this.getEmptyHealthData(),
        error: 'Identificador do usuário não fornecido.',
      };
    }

    try {
      // 1. Carrega dados de todas as 4 tabelas
      const [
        companyRes,
        productsRes,
        movementsRes,
        financialRes,
      ] = await Promise.all([
        companyService.getCompany(userId),
        productService.getProducts(userId),
        movementService.getMovements(userId),
        financialService.getTransactions(userId),
      ]);

      const company = companyRes.data;
      const products = productsRes.data || [];
      const movements = movementsRes.data || [];
      const transactions = financialRes.data || [];

      // 2. Análise Temporal (Mês Atual vs Mês Anterior)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0 a 11

      const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // Transações do Mês Atual
      const currentMonthTx = transactions.filter((t) => (t.transaction_date || '').startsWith(currentMonthPrefix));
      const prevMonthTx = transactions.filter((t) => (t.transaction_date || '').startsWith(prevMonthPrefix));

      const currentMonthRevenue = currentMonthTx
        .filter((t) => t.type === 'receita')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const currentMonthExpense = currentMonthTx
        .filter((t) => t.type === 'despesa')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const currentMonthProfit = currentMonthRevenue - currentMonthExpense;

      const previousMonthRevenue = prevMonthTx
        .filter((t) => t.type === 'receita')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const previousMonthExpense = prevMonthTx
        .filter((t) => t.type === 'despesa')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const previousMonthProfit = previousMonthRevenue - previousMonthExpense;

      // Variações Percentuais
      let revenueGrowthPercent: number | null = null;
      if (previousMonthRevenue > 0) {
        revenueGrowthPercent = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
      } else if (currentMonthRevenue > 0 && previousMonthRevenue === 0) {
        revenueGrowthPercent = 100;
      }

      let profitGrowthPercent: number | null = null;
      if (previousMonthProfit !== 0) {
        profitGrowthPercent = ((currentMonthProfit - previousMonthProfit) / Math.abs(previousMonthProfit)) * 100;
      } else if (currentMonthProfit > 0 && previousMonthProfit === 0) {
        profitGrowthPercent = 100;
      }

      const profitMarginPercent = currentMonthRevenue > 0 ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;
      const expenseRatioPercent = currentMonthRevenue > 0 ? (currentMonthExpense / currentMonthRevenue) * 100 : 0;

      // 3. Análise Detalhada de Estoque e Produtos
      let totalInventoryCapitalCost = 0;
      let totalInventoryRetailValue = 0;
      const outOfStockProducts: Product[] = [];
      const criticalStockProducts: Product[] = [];
      let healthyStockProductsCount = 0;

      products.forEach((p) => {
        const stock = Number(p.current_stock) || 0;
        const cost = Number(p.cost_price) || 0;
        const sale = Number(p.sale_price) || 0;
        const minStock = Number(p.min_stock) || 0;

        if (stock > 0) {
          totalInventoryCapitalCost += stock * cost;
          totalInventoryRetailValue += stock * sale;
        }

        if (stock <= 0) {
          outOfStockProducts.push(p);
        } else if (stock <= minStock) {
          criticalStockProducts.push(p);
        } else {
          healthyStockProductsCount++;
        }
      });

      const outOfStockProductsCount = outOfStockProducts.length;
      const criticalStockProductsCount = criticalStockProducts.length;
      const belowMinStockTotalCount = outOfStockProductsCount + criticalStockProductsCount;
      const potentialGrossProfit = totalInventoryRetailValue - totalInventoryCapitalCost;

      // 4. Análise de Movimentações por Produto (Giro e Estagnação)
      const movementsByProduct = new Map<string, StockMovement[]>();
      movements.forEach((m) => {
        const list = movementsByProduct.get(m.product_id) || [];
        list.push(m);
        movementsByProduct.set(m.product_id, list);
      });

      const productStats: ProductMovementStat[] = products.map((p) => {
        const pMovements = movementsByProduct.get(p.id || '') || [];
        const stock = Number(p.current_stock) || 0;
        const cost = Number(p.cost_price) || 0;
        const sale = Number(p.sale_price) || 0;

        let totalOut = 0;
        let totalIn = 0;
        let latestDate: string | null = null;

        pMovements.forEach((m) => {
          if (m.type === 'saida') totalOut += Number(m.quantity) || 0;
          if (m.type === 'entrada') totalIn += Number(m.quantity) || 0;

          if (m.movement_date) {
            if (!latestDate || new Date(m.movement_date) > new Date(latestDate)) {
              latestDate = m.movement_date;
            }
          }
        });

        // Se não houver movimentação, usa a data de criação do produto como referência
        const refDate = latestDate ? new Date(latestDate) : p.created_at ? new Date(p.created_at) : now;
        const diffMs = now.getTime() - refDate.getTime();
        const daysSinceLastMovement = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        const marginPercent = sale > 0 ? ((sale - cost) / sale) * 100 : 0;

        return {
          product: p,
          movementCount: pMovements.length,
          totalQuantityOut: totalOut,
          totalQuantityIn: totalIn,
          lastMovementDate: latestDate,
          daysSinceLastMovement,
          isStagnant: stock > 0 && daysSinceLastMovement >= 30,
          isCriticallyStagnant: stock > 0 && daysSinceLastMovement >= 60,
          capitalTiedUp: stock * cost,
          marginPercent,
        };
      });

      // Produtos Estagnados (Parados com estoque > 0)
      const stagnantProducts = productStats
        .filter((s) => s.isStagnant)
        .sort((a, b) => b.capitalTiedUp - a.capitalTiedUp);

      // Produtos Mais Movimentados (Top Giros)
      const topMovedProducts = [...productStats]
        .filter((s) => s.movementCount > 0)
        .sort((a, b) => (b.totalQuantityOut + b.movementCount) - (a.totalQuantityOut + a.movementCount))
        .slice(0, 5);

      // Produtos Menos Movimentados (Menor giro ou 0 movimentações)
      const leastMovedProducts = [...productStats]
        .filter((s) => s.product.current_stock > 0)
        .sort((a, b) => a.movementCount - b.movementCount || b.daysSinceLastMovement - a.daysSinceLastMovement)
        .slice(0, 5);

      // Produtos com margem baixa (< 20%) ou negativa
      const lowMarginProducts = products
        .map((p) => {
          const cost = Number(p.cost_price) || 0;
          const sale = Number(p.sale_price) || 0;
          const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
          return { product: p, marginPercent: margin };
        })
        .filter((item) => item.marginPercent < 20 && Number(item.product.sale_price) > 0)
        .sort((a, b) => a.marginPercent - b.marginPercent);

      // 5. Cálculo dos Pilares e Pontuação Global (0 a 100)
      let finScore = 0;
      const finMax = 35;
      let finDetail = '';

      if (currentMonthProfit > 0) {
        finScore += 15;
        finDetail += 'Lucro positivo no mês (+15 pts). ';
      } else if (currentMonthRevenue > 0 && currentMonthProfit <= 0) {
        finDetail += 'Operação com déficit no mês (0 pts). ';
      } else {
        finScore += 5;
        finDetail += 'Sem dados financeiros suficientes no mês (+5 pts base). ';
      }

      if (revenueGrowthPercent !== null && revenueGrowthPercent >= 0) {
        finScore += 10;
        finDetail += 'Faturamento em crescimento ou estável (+10 pts). ';
      } else if (revenueGrowthPercent !== null && revenueGrowthPercent < 0) {
        finDetail += `Queda de faturamento de ${Math.abs(revenueGrowthPercent).toFixed(1)}% (0 pts). `;
      } else {
        finScore += 5;
      }

      if (currentMonthRevenue > 0 && expenseRatioPercent <= 70) {
        finScore += 10;
        finDetail += 'Despesas abaixo de 70% da receita (+10 pts).';
      } else if (currentMonthRevenue > 0 && expenseRatioPercent > 70) {
        finDetail += 'Despesas consomem mais de 70% da receita (0 pts).';
      } else {
        finScore += 5;
      }

      // Pilar de Estoque (0 a 35 pts)
      let invScore = 0;
      const invMax = 35;
      let invDetail = '';

      const totalP = products.length;
      if (totalP > 0) {
        const outOfStockRatio = outOfStockProductsCount / totalP;
        if (outOfStockRatio === 0) {
          invScore += 15;
          invDetail += 'Nenhum produto zerado (+15 pts). ';
        } else if (outOfStockRatio <= 0.15) {
          invScore += 8;
          invDetail += 'Poucos produtos esgotados (+8 pts). ';
        } else {
          invDetail += 'Alto índice de ruptura de estoque (0 pts). ';
        }

        const safeStockRatio = healthyStockProductsCount / totalP;
        if (safeStockRatio >= 0.7) {
          invScore += 10;
          invDetail += 'Mais de 70% do catálogo em nível seguro (+10 pts). ';
        } else if (safeStockRatio >= 0.4) {
          invScore += 5;
          invDetail += 'Estoque intermediário (+5 pts). ';
        }

        const stagnantRatio = stagnantProducts.length / totalP;
        if (stagnantRatio <= 0.2) {
          invScore += 10;
          invDetail += 'Baixo volume de produtos estagnados (+10 pts).';
        } else {
          invDetail += 'Capital parado em produtos sem movimentação (0 pts).';
        }
      } else {
        invScore = 15;
        invDetail = 'Cadastre produtos para calibrar o diagnóstico de estoque (+15 pts base).';
      }

      // Pilar de Precificação & Margens (0 a 20 pts)
      let prcScore = 0;
      const prcMax = 20;
      let prcDetail = '';

      if (totalP > 0) {
        const productsWithNegativeMargin = products.filter(
          (p) => Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.cost_price)
        );

        if (productsWithNegativeMargin.length === 0) {
          prcScore += 10;
          prcDetail += 'Nenhum produto com margem negativa (+10 pts). ';
        } else {
          prcDetail += 'Existem produtos sendo vendidos abaixo do custo (0 pts). ';
        }

        const avgMargin = products.reduce((acc, p) => {
          const s = Number(p.sale_price) || 0;
          const c = Number(p.cost_price) || 0;
          return acc + (s > 0 ? ((s - c) / s) * 100 : 0);
        }, 0) / totalP;

        if (avgMargin >= 30) {
          prcScore += 10;
          prcDetail += `Margem média saudável de ${avgMargin.toFixed(1)}% (+10 pts).`;
        } else if (avgMargin >= 15) {
          prcScore += 5;
          prcDetail += `Margem média moderada de ${avgMargin.toFixed(1)}% (+5 pts).`;
        } else {
          prcDetail += `Margem média baixa de ${avgMargin.toFixed(1)}% (0 pts).`;
        }
      } else {
        prcScore = 10;
        prcDetail = 'Cadastre produtos com custo e preço de venda para pontuar (+10 pts base).';
      }

      // Pilar Operacional & Movimentações (0 a 10 pts)
      let opsScore = 0;
      const opsMax = 10;
      let opsDetail = '';

      if (movements.length >= 5) {
        opsScore += 10;
        opsDetail = 'Histórico ativo de movimentações de estoque registrado (+10 pts).';
      } else if (movements.length > 0) {
        opsScore += 5;
        opsDetail = 'Poucas movimentações registradas no período (+5 pts).';
      } else {
        opsDetail = 'Nenhuma movimentação de estoque registrada (0 pts).';
      }

      const totalHealthScore = Math.min(100, Math.max(0, finScore + invScore + prcScore + opsScore));

      let healthStatus: 'excelente' | 'saudavel' | 'atencao' | 'critico' = 'saudavel';
      if (totalHealthScore >= 80) healthStatus = 'excelente';
      else if (totalHealthScore >= 60) healthStatus = 'saudavel';
      else if (totalHealthScore >= 40) healthStatus = 'atencao';
      else healthStatus = 'critico';

      // 6. Geração Determinística das Seções de Diagnóstico

      // --- O QUE ESTÁ INDO BEM ---
      const positivePoints: BusinessHealthInsight[] = [];

      if (currentMonthProfit > 0) {
        positivePoints.push({
          id: 'pos-profit',
          category: 'good',
          title: 'Lucro Líquido Positivo no Mês',
          description: `Sua empresa acumulou R$ ${currentMonthProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de resultado líquido positivo no mês atual, com margem líquida de ${profitMarginPercent.toFixed(1)}%.`,
          metric: `+ R$ ${currentMonthProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetSection: 'financeiro',
        });
      }

      if (revenueGrowthPercent !== null && revenueGrowthPercent > 0) {
        positivePoints.push({
          id: 'pos-rev-growth',
          category: 'good',
          title: 'Crescimento de Faturamento',
          description: `O faturamento do mês atual cresceu ${revenueGrowthPercent.toFixed(1)}% em relação ao mês anterior (R$ ${currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vs R$ ${previousMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
          metric: `+${revenueGrowthPercent.toFixed(1)}%`,
          targetSection: 'financeiro',
        });
      }

      if (totalP > 0 && healthyStockProductsCount > 0) {
        const pctHealthy = ((healthyStockProductsCount / totalP) * 100).toFixed(0);
        positivePoints.push({
          id: 'pos-stock-healthy',
          category: 'good',
          title: 'Estoque Seguro na Maioria dos Itens',
          description: `${healthyStockProductsCount} produto(s) (${pctHealthy}% do catálogo) estão com quantidade confortável acima do estoque mínimo de segurança.`,
          metric: `${pctHealthy}% do catálogo`,
          targetSection: 'produtos',
        });
      }

      if (topMovedProducts.length > 0 && topMovedProducts[0].movementCount > 0) {
        const top = topMovedProducts[0];
        positivePoints.push({
          id: 'pos-top-product',
          category: 'good',
          title: `Produto Destaque: ${top.product.name}`,
          description: `Item com maior liquidez e giro operacional recente (${top.totalQuantityOut} unidades saídas e ${top.movementCount} movimentações).`,
          metric: `${top.movementCount} movs`,
          targetSection: 'movimentacoes',
        });
      }

      if (currentMonthRevenue > 0 && expenseRatioPercent <= 70) {
        positivePoints.push({
          id: 'pos-expenses-controlled',
          category: 'good',
          title: 'Despesas Operacionais Controladas',
          description: `As despesas deste mês representam ${expenseRatioPercent.toFixed(1)}% do faturamento, preservando uma margem segura de caixa.`,
          metric: `${expenseRatioPercent.toFixed(1)}% da receita`,
          targetSection: 'financeiro',
        });
      }

      if (positivePoints.length === 0) {
        positivePoints.push({
          id: 'pos-base',
          category: 'good',
          title: 'Estrutura Inicial do Sistema Conectada',
          description: 'Seus dados de produtos, estoque e financeiro estão centralizados e sendo monitorados em tempo real.',
          metric: `${totalP} produtos`,
          targetSection: 'produtos',
        });
      }

      // --- O QUE PRECISA DE ATENÇÃO ---
      const attentionPoints: BusinessHealthInsight[] = [];

      if (criticalStockProductsCount > 0) {
        attentionPoints.push({
          id: 'att-critical-stock',
          category: 'warning',
          title: `${criticalStockProductsCount} Produto(s) com Estoque Crítico`,
          description: `Itens que atingiram ou estão abaixo do estoque mínimo definido. Risco iminente de esgotamento caso não haja novo pedido de compra.`,
          metric: `${criticalStockProductsCount} item(ns)`,
          impact: 'medio',
          targetSection: 'produtos',
        });
      }

      if (stagnantProducts.length > 0) {
        const capitalStagnant = stagnantProducts.reduce((sum, s) => sum + s.capitalTiedUp, 0);
        attentionPoints.push({
          id: 'att-stagnant-capital',
          category: 'warning',
          title: `${stagnantProducts.length} Produto(s) Sem Movimentação (> 30 dias)`,
          description: `Há R$ ${capitalStagnant.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em mercadorias paradas no estoque sem nenhuma saída nos últimos 30 dias.`,
          metric: `R$ ${capitalStagnant.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          impact: 'medio',
          targetSection: 'produtos',
        });
      }

      if (currentMonthRevenue > 0 && expenseRatioPercent > 70 && expenseRatioPercent <= 100) {
        attentionPoints.push({
          id: 'att-high-expenses',
          category: 'warning',
          title: 'Despesas Elevadas em Relação ao Faturamento',
          description: `As despesas operacionais consomem ${expenseRatioPercent.toFixed(1)}% da receita deste mês, reduzindo a sobra líquida.`,
          metric: `${expenseRatioPercent.toFixed(1)}% do faturamento`,
          impact: 'medio',
          targetSection: 'financeiro',
        });
      }

      if (lowMarginProducts.length > 0) {
        attentionPoints.push({
          id: 'att-low-margin',
          category: 'warning',
          title: `${lowMarginProducts.length} Produto(s) com Margem de Lucro Baixa (< 20%)`,
          description: `Itens cadastrados com margem bruta inferior a 20%, o que pode não cobrir despesas operacionais e impostos.`,
          metric: `${lowMarginProducts.length} produtos`,
          impact: 'baixo',
          targetSection: 'precificacao',
        });
      }

      if (revenueGrowthPercent !== null && revenueGrowthPercent < 0 && revenueGrowthPercent >= -20) {
        attentionPoints.push({
          id: 'att-rev-dip',
          category: 'warning',
          title: 'Faturamento Abaixo do Mês Anterior',
          description: `Queda moderada de ${Math.abs(revenueGrowthPercent).toFixed(1)}% no faturamento comparado ao mês passado.`,
          metric: `${revenueGrowthPercent.toFixed(1)}%`,
          impact: 'medio',
          targetSection: 'financeiro',
        });
      }

      // --- POSSÍVEIS RISCOS ---
      const riskPoints: BusinessHealthInsight[] = [];

      if (outOfStockProductsCount > 0) {
        riskPoints.push({
          id: 'risk-out-of-stock',
          category: 'risk',
          title: `Ruptura de Estoque: ${outOfStockProductsCount} Produto(s) Zerados`,
          description: `Produtos com saldo zerado ou negativo no estoque geram perda imediata de vendas e insatisfação dos clientes.`,
          metric: `${outOfStockProductsCount} zerados`,
          impact: 'alto',
          targetSection: 'produtos',
        });
      }

      if (currentMonthRevenue > 0 && currentMonthProfit < 0) {
        riskPoints.push({
          id: 'risk-deficit',
          category: 'risk',
          title: 'Operação no Vermelho (Déficit no Mês)',
          description: `As despesas (R$ ${currentMonthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) superaram as receitas (R$ ${currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}), gerando prejuízo operacional de R$ ${Math.abs(currentMonthProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
          metric: `- R$ ${Math.abs(currentMonthProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          impact: 'alto',
          targetSection: 'financeiro',
        });
      }

      if (revenueGrowthPercent !== null && revenueGrowthPercent < -20) {
        riskPoints.push({
          id: 'risk-severe-rev-drop',
          category: 'risk',
          title: 'Queda Acentuada no Faturamento',
          description: `Redução de ${Math.abs(revenueGrowthPercent).toFixed(1)}% nas vendas em relação ao mês anterior. Requer ação rápida para atração de clientes e revisão de metas.`,
          metric: `${revenueGrowthPercent.toFixed(1)}%`,
          impact: 'alto',
          targetSection: 'financeiro',
        });
      }

      const severeStagnant = stagnantProducts.filter((s) => s.isCriticallyStagnant);
      if (severeStagnant.length > 0) {
        const tiedCrit = severeStagnant.reduce((sum, s) => sum + s.capitalTiedUp, 0);
        riskPoints.push({
          id: 'risk-crit-stagnant',
          category: 'risk',
          title: `Capital Imobilizado Crítico (> 60 dias sem giro)`,
          description: `${severeStagnant.length} produto(s) somam R$ ${tiedCrit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em estoque totalmente inativo há mais de 2 meses.`,
          metric: `R$ ${tiedCrit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          impact: 'alto',
          targetSection: 'produtos',
        });
      }

      const productsWithNegativeMargin = products.filter(
        (p) => Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.cost_price)
      );
      if (productsWithNegativeMargin.length > 0) {
        riskPoints.push({
          id: 'risk-negative-margin',
          category: 'risk',
          title: `${productsWithNegativeMargin.length} Produto(s) com Preço Abaixo do Custo`,
          description: `Venda com prejuízo unitário direto. Cada unidade vendida gera perda financeira para a empresa.`,
          metric: `${productsWithNegativeMargin.length} produtos`,
          impact: 'alto',
          targetSection: 'precificacao',
        });
      }

      // --- RECOMENDAÇÕES PRÁTICAS (Ações Sugeridas) ---
      const recommendations: BusinessRecommendation[] = [];

      // 1. Reposição de Estoque Crítico e Zerado
      if (belowMinStockTotalCount > 0) {
        const affected = [...outOfStockProducts, ...criticalStockProducts].slice(0, 4).map((p) => ({
          name: p.name,
          detail: `Estoque: ${p.current_stock} (Mín: ${p.min_stock})`,
        }));

        recommendations.push({
          id: 'rec-restock',
          title: 'Repor produtos com estoque crítico e zerados',
          priority: 'alta',
          category: 'estoque',
          description: `Emitir ordens de compra ou repor imediatamente os ${belowMinStockTotalCount} produtos que estão abaixo do estoque mínimo para evitar perda de faturamento.`,
          actionText: 'Ver Produtos para Repor',
          targetSection: 'produtos',
          affectedItems: affected,
        });
      }

      // 2. Revisão de Produtos Parados / Sem Movimentação
      if (stagnantProducts.length > 0) {
        const capitalStagnant = stagnantProducts.reduce((sum, s) => sum + s.capitalTiedUp, 0);
        const affected = stagnantProducts.slice(0, 4).map((s) => ({
          name: s.product.name,
          detail: `${s.daysSinceLastMovement} dias sem saída (R$ ${s.capitalTiedUp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} parados)`,
        }));

        recommendations.push({
          id: 'rec-stagnant',
          title: 'Revisar produtos sem movimentação e liberar capital',
          priority: 'alta',
          category: 'estoque',
          description: `Criar campanhas promocionais, queima de estoque ou kits combinados para os ${stagnantProducts.length} itens parados, transformando R$ ${capitalStagnant.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} imobilizados em capital de giro ativo.`,
          actionText: 'Gerenciar Estoque Parado',
          targetSection: 'produtos',
          affectedItems: affected,
        });
      }

      // 3. Ajuste de Margem e Precificação
      if (lowMarginProducts.length > 0 || productsWithNegativeMargin.length > 0) {
        const items = [...productsWithNegativeMargin, ...lowMarginProducts.map((l) => l.product)].slice(0, 4).map((p) => {
          const c = Number(p.cost_price) || 0;
          const s = Number(p.sale_price) || 0;
          const m = s > 0 ? ((s - c) / s) * 100 : 0;
          return {
            name: p.name,
            detail: `Custo: R$ ${c.toFixed(2)} | Venda: R$ ${s.toFixed(2)} (${m.toFixed(1)}% margem)`,
          };
        });

        recommendations.push({
          id: 'rec-pricing',
          title: 'Melhorar margem de lucro de produtos específicos',
          priority: productsWithNegativeMargin.length > 0 ? 'alta' : 'media',
          category: 'precificacao',
          description: `Recalcular o preço de venda dos itens com retorno insuficiente ou margem negativa, garantindo a cobertura dos custos fixos e impostos.`,
          actionText: 'Ajustar Precificação',
          targetSection: 'precificacao',
          affectedItems: items,
        });
      }

      // 4. Controle de Despesas Operacionais
      if (currentMonthRevenue > 0 && expenseRatioPercent > 70) {
        recommendations.push({
          id: 'rec-expenses',
          title: 'Acompanhar e renegociar despesas operacionais',
          priority: currentMonthProfit < 0 ? 'alta' : 'media',
          category: 'financeiro',
          description: `As despesas consumiram ${expenseRatioPercent.toFixed(1)}% do faturamento no mês. Analise os lançamentos de custos fixos, energia, taxas e fornecedores para restabelecer a lucratividade.`,
          actionText: 'Ver Lançamentos Financeiros',
          targetSection: 'financeiro',
        });
      }

      // 5. Registro Contínuo de Movimentações
      if (movements.length < 5) {
        recommendations.push({
          id: 'rec-movements',
          title: 'Registrar todas as entradas e saídas de mercadorias',
          priority: 'baixa',
          category: 'operacional',
          description: 'Mantenha o registro de todas as vendas e compras no módulo de Movimentações para garantir a precisão do cálculo de giro e estoque mínimo.',
          actionText: 'Registrar Movimentação',
          targetSection: 'movimentacoes',
        });
      }

      const calculatedData: BusinessHealthData = {
        company,
        totalProducts: products.length,
        healthScore: totalHealthScore,
        healthStatus,
        healthScorePillars: {
          financialHealth: { score: finScore, max: finMax, label: 'Saúde Financeira', details: finDetail },
          inventoryHealth: { score: invScore, max: invMax, label: 'Gestão de Estoque', details: invDetail },
          pricingHealth: { score: prcScore, max: prcMax, label: 'Margens & Precificação', details: prcDetail },
          operationalHealth: { score: opsScore, max: opsMax, label: 'Atividade Operacional', details: opsDetail },
        },
        currentMonthRevenue,
        currentMonthExpense,
        currentMonthProfit,
        previousMonthRevenue,
        previousMonthExpense,
        previousMonthProfit,
        revenueGrowthPercent,
        profitGrowthPercent,
        profitMarginPercent,
        expenseRatioPercent,
        totalInventoryCapitalCost,
        totalInventoryRetailValue,
        potentialGrossProfit,
        outOfStockProductsCount,
        criticalStockProductsCount,
        healthyStockProductsCount,
        belowMinStockTotalCount,
        outOfStockProducts,
        criticalStockProducts,
        stagnantProducts,
        topMovedProducts,
        leastMovedProducts,
        lowMarginProducts,
        positivePoints,
        attentionPoints,
        riskPoints,
        recommendations,
        hasSufficientData: products.length > 0 || transactions.length > 0,
        calculatedAt: new Date().toISOString(),
      };

      return { data: calculatedData, error: null };
    } catch (err: any) {
      console.error('Erro ao calcular diagnóstico de Saúde do Negócio:', err);
      return {
        data: this.getEmptyHealthData(),
        error: err?.message || 'Falha ao processar regras e indicadores da Saúde do Negócio.',
      };
    }
  },

  getEmptyHealthData(): BusinessHealthData {
    return {
      company: null,
      totalProducts: 0,
      healthScore: 50,
      healthStatus: 'atencao',
      healthScorePillars: {
        financialHealth: { score: 15, max: 35, label: 'Saúde Financeira', details: 'Aguardando dados' },
        inventoryHealth: { score: 15, max: 35, label: 'Gestão de Estoque', details: 'Aguardando dados' },
        pricingHealth: { score: 10, max: 20, label: 'Margens & Precificação', details: 'Aguardando dados' },
        operationalHealth: { score: 5, max: 10, label: 'Atividade Operacional', details: 'Aguardando dados' },
      },
      currentMonthRevenue: 0,
      currentMonthExpense: 0,
      currentMonthProfit: 0,
      previousMonthRevenue: 0,
      previousMonthExpense: 0,
      previousMonthProfit: 0,
      revenueGrowthPercent: null,
      profitGrowthPercent: null,
      profitMarginPercent: 0,
      expenseRatioPercent: 0,
      totalInventoryCapitalCost: 0,
      totalInventoryRetailValue: 0,
      potentialGrossProfit: 0,
      outOfStockProductsCount: 0,
      criticalStockProductsCount: 0,
      healthyStockProductsCount: 0,
      belowMinStockTotalCount: 0,
      outOfStockProducts: [],
      criticalStockProducts: [],
      stagnantProducts: [],
      topMovedProducts: [],
      leastMovedProducts: [],
      lowMarginProducts: [],
      positivePoints: [],
      attentionPoints: [],
      riskPoints: [],
      recommendations: [],
      hasSufficientData: false,
      calculatedAt: new Date().toISOString(),
    };
  },
};
