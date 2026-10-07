/**
 * ANT — Automate and Transform
 * Serviço de Importação e Gestão de NF-e (Fase 4 — TCC / Acadêmico)
 *
 * Características:
 * - Validação e formatação de Chave de Acesso de 44 dígitos
 * - Simulação de consulta à SEFAZ (sem dependência de serviços externos pagos)
 * - Retorno de dados fiscais coerentes (Fornecedor, CNPJ, Número, Série, Data e Produtos)
 * - Importação real para o estoque:
 *   - Cadastra produtos novos no catálogo da empresa
 *   - Atualiza estoque e preço de custo de produtos existentes
 *   - Registra movimentações de entrada ('entrada')
 *   - Persiste no banco Supabase (nfe_imports / nfe_import_items) e cache local
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { NfeImport, NfeItem, SimulatedNfeData, NfeImportResult } from '../types/nfe';
import { Product } from '../types';
import { productService } from './productService';
import { movementService } from './movementService';

const LOCAL_STORAGE_NFE_IMPORTS_KEY = 'ant_nfe_imports_v1';

// Catálogo modelo de produtos coerentes para a simulação acadêmica
const SAMPLE_PRODUCTS_POOL = [
  { code: 'PAR-516', name: 'Parafuso Sextavado Aço 5/16" x 2"', category: 'Fixadores', unit: 'UN', unitPrice: 0.45, minQty: 50, maxQty: 200 },
  { code: 'LUV-NIT', name: 'Luva de Proteção Nitrílica Reforçada Tam G', category: 'EPIs', unit: 'PAR', unitPrice: 18.90, minQty: 10, maxQty: 50 },
  { code: 'CAB-250', name: 'Cabo Flexível 2.5mm 750V 100m Antichama', category: 'Elétrica', unit: 'RL', unitPrice: 145.00, minQty: 2, maxQty: 10 },
  { code: 'DIS-32A', name: 'Disjuntor Bipolar Din 32A Curva C', category: 'Elétrica', unit: 'UN', unitPrice: 28.50, minQty: 5, maxQty: 25 },
  { code: 'FIT-ISO', name: 'Fita Isolante Profissional 19mm x 20m Preta', category: 'Elétrica', unit: 'UN', unitPrice: 6.80, minQty: 20, maxQty: 60 },
  { code: 'SIL-PU40', name: 'Selante Adesivo PU40 Construção 400g Cinza', category: 'Adesivos', unit: 'UN', unitPrice: 22.90, minQty: 6, maxQty: 30 },
  { code: 'BRO-HSS', name: 'Jogo de Brocas Aço Rápido HSS 1mm a 10mm', category: 'Ferramentas', unit: 'JG', unitPrice: 49.90, minQty: 3, maxQty: 12 },
  { code: 'DIS-COR', name: 'Disco de Corte Fino Inox 115mm x 1.0mm', category: 'Abrasivos', unit: 'UN', unitPrice: 4.20, minQty: 30, maxQty: 100 },
  { code: 'ENG-GRA', name: 'Graxa Branca Especial de Lítio 500g Spray', category: 'Químicos', unit: 'UN', unitPrice: 19.50, minQty: 5, maxQty: 20 },
  { code: 'MAR-BOR', name: 'Martelo de Borracha com Cabo Madeira 450g', category: 'Ferramentas', unit: 'UN', unitPrice: 24.90, minQty: 4, maxQty: 15 },
  { code: 'TRE-05M', name: 'Trena Métrica Emborrachada 5 Metros c/ Trava', category: 'Medição', unit: 'UN', unitPrice: 16.50, minQty: 5, maxQty: 25 },
  { code: 'ESP-POL', name: 'Espuma Expansiva de Poliuretano 500ml', category: 'Químicos', unit: 'UN', unitPrice: 27.80, minQty: 8, maxQty: 30 },
];

const SAMPLE_SUPPLIERS = [
  { name: 'Distribuidora Exemplo LTDA', cnpj: '00.000.000/0001-00' },
  { name: 'Atacadista & Distribuidora Nacional de Suprimentos S/A', cnpj: '12.345.678/0001-95' },
  { name: 'Comercial e Importadora Silva & Santos LTDA', cnpj: '45.678.912/0001-33' },
  { name: 'Indústria & Comércio Metalúrgica São Paulo LTDA', cnpj: '98.765.432/0001-10' },
  { name: 'Brasil Distribuidora de Ferramentas e Elétrica EIRELI', cnpj: '33.222.111/0001-44' },
];

function getLocalImports(): NfeImport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NFE_IMPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalImports(records: NfeImport[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_NFE_IMPORTS_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Erro ao salvar importações de NF-e localmente:', err);
  }
}

export const nfeService = {
  /**
   * Remove caracteres não numéricos de uma chave de acesso.
   */
  cleanKey(key: string): string {
    return (key || '').replace(/\D/g, '');
  },

  /**
   * Formata a chave em blocos de 4 dígitos (padrão Danfe / SEFAZ).
   */
  formatKey(key: string): string {
    const clean = this.cleanKey(key);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  },

  /**
   * Valida se a chave tem exatamente 44 dígitos numéricos.
   */
  validateKey(key: string): { isValid: boolean; cleanKey: string; error?: string } {
    const clean = this.cleanKey(key);
    if (!clean) {
      return { isValid: false, cleanKey: '', error: 'Digite a chave de acesso da NF-e.' };
    }
    if (clean.length !== 44) {
      return {
        isValid: false,
        cleanKey: clean,
        error: `A chave deve conter exatamente 44 dígitos (atualmente contém ${clean.length}).`,
      };
    }
    return { isValid: true, cleanKey: clean };
  },

  /**
   * Gera uma chave de teste de 44 dígitos coerente para facilitar demonstrações em bancas de TCC.
   */
  generateTestAccessKey(): string {
    const uf = '35'; // SP
    const now = new Date();
    const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const cnpj = '12345678000195';
    const modelo = '55';
    const serie = '001';
    const numero = String(Math.floor(100000 + Math.random() * 900000)).padStart(9, '0');
    const tpEmis = '1';
    const cNF = String(Math.floor(10000000 + Math.random() * 90000000)).padStart(8, '0');
    const dv = String(Math.floor(1 + Math.random() * 9));
    return `${uf}${yearMonth}${cnpj}${modelo}${serie}${numero}${tpEmis}${cNF}${dv}`;
  },

  /**
   * Simula a consulta da NF-e retornando dados fiscais e entre 3 e 10 produtos coerentes.
   */
  async simulateNfeConsultation(accessKey: string): Promise<{
    data: SimulatedNfeData | null;
    error: string | null;
  }> {
    const validation = this.validateKey(accessKey);
    if (!validation.isValid) {
      return { data: null, error: validation.error || 'Chave inválida.' };
    }

    const clean = validation.cleanKey;

    // Simula latência de rede/consulta da SEFAZ
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Determina fornecedor com base nos dígitos centrais
    const supplierIndex = parseInt(clean.slice(10, 12), 10) % SAMPLE_SUPPLIERS.length;
    const supplier = SAMPLE_SUPPLIERS[supplierIndex] || SAMPLE_SUPPLIERS[0];

    // Extrai número da nota (posições 25 a 34 da chave padrão)
    const rawNumber = clean.slice(25, 34);
    const invoiceNumber = rawNumber ? String(parseInt(rawNumber, 10) || 12345) : '12345';
    const series = clean.slice(22, 25) || '001';

    // Gera entre 4 e 8 produtos sorteados coerentes do catálogo
    const numItems = 4 + (parseInt(clean.slice(34, 36), 10) % 5); // 4 a 8 itens
    const shuffledPool = [...SAMPLE_PRODUCTS_POOL].sort(
      () => 0.5 - Math.sin(parseInt(clean.slice(0, 8), 10))
    );
    const selectedSamples = shuffledPool.slice(0, Math.min(numItems, SAMPLE_PRODUCTS_POOL.length));

    let totalAmount = 0;
    const items: NfeItem[] = selectedSamples.map((sample, idx) => {
      // Quantidade aleatória controlada
      const qty = sample.minQty + (idx * 5) % (sample.maxQty - sample.minQty + 1);
      const unitPrice = sample.unitPrice;
      const totalPrice = Number((qty * unitPrice).toFixed(2));
      totalAmount += totalPrice;

      return {
        code: sample.code,
        name: sample.name,
        category: sample.category,
        unit: sample.unit,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      };
    });

    totalAmount = Number(totalAmount.toFixed(2));

    const simulatedData: SimulatedNfeData = {
      access_key: clean,
      supplier_name: supplier.name,
      supplier_cnpj: supplier.cnpj,
      number: invoiceNumber,
      series,
      issue_date: new Date().toISOString(),
      total_amount: totalAmount,
      items,
    };

    return { data: simulatedData, error: null };
  },

  /**
   * Importa os produtos e itens da NF-e para o estoque da empresa:
   * - Cadastra novos produtos se inexistentes
   * - Atualiza estoque e custo de produtos já existentes
   * - Gera movimentações de entrada ('entrada')
   * - Persiste o cabeçalho e itens da NF-e no banco
   */
  async importNfeToInventory(
    userId: string,
    companyId: string,
    userName: string,
    nfeData: SimulatedNfeData
  ): Promise<NfeImportResult> {
    if (!userId) {
      return {
        success: false,
        newProductsCount: 0,
        updatedProductsCount: 0,
        totalItemsImported: 0,
        totalAmount: 0,
        error: 'Usuário não autenticado.',
      };
    }

    try {
      // 1. Obter catálogo atual de produtos da empresa para confrontar
      const { data: existingProducts } = await productService.getProducts(userId);
      const productMap = new Map<string, Product>();

      existingProducts.forEach((p) => {
        if (p.barcode) productMap.set(p.barcode.trim().toLowerCase(), p);
        productMap.set(p.name.trim().toLowerCase(), p);
      });

      let newProductsCount = 0;
      let updatedProductsCount = 0;

      // 2. Processar cada item da nota fiscal
      for (const item of nfeData.items) {
        const keyBarcode = item.code.trim().toLowerCase();
        const keyName = item.name.trim().toLowerCase();
        const existing = productMap.get(keyBarcode) || productMap.get(keyName);

        let targetProductId = existing?.id;

        if (existing && existing.id) {
          // Produto existente: Atualiza estoque adicionando a quantidade da nota e custo mais recente
          const updatedStock = Number(existing.current_stock || 0) + Number(item.quantity);
          await productService.updateProduct(userId, existing.id, {
            name: existing.name,
            category: existing.category || item.category,
            barcode: existing.barcode || item.code,
            cost_price: item.unit_price,
            sale_price: existing.sale_price || Number((item.unit_price * 1.5).toFixed(2)),
            current_stock: updatedStock,
            min_stock: existing.min_stock || 5,
          });

          targetProductId = existing.id;
          updatedProductsCount++;
        } else {
          // Produto inexistente: Cadastra novo produto no catálogo
          const createdRes = await productService.createProduct(
            userId,
            {
              name: item.name,
              category: item.category || 'Geral',
              barcode: item.code,
              cost_price: item.unit_price,
              sale_price: Number((item.unit_price * 1.5).toFixed(2)), // Margem padrão de 50%
              current_stock: item.quantity,
              min_stock: 5,
            },
            companyId
          );

          targetProductId = createdRes.data?.id;
          newProductsCount++;
        }

        // 3. Registrar movimentação de entrada no estoque
        if (targetProductId) {
          await movementService.createMovement(
            userId,
            {
              product_id: targetProductId,
              type: 'entrada',
              quantity: item.quantity,
              movement_date: new Date().toISOString().split('T')[0],
              notes: `Entrada via Importação de NF-e nº ${nfeData.number} — Fornecedor: ${nfeData.supplier_name}`,
            },
            companyId
          );
        }
      }

      // 4. Salvar registro oficial da NF-e importada
      const importId = crypto.randomUUID ? crypto.randomUUID() : `nfe_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newNfeRecord: NfeImport = {
        id: importId,
        company_id: companyId,
        imported_by_user_id: userId,
        imported_by_user_name: userName,
        access_key: nfeData.access_key,
        supplier_name: nfeData.supplier_name,
        supplier_cnpj: nfeData.supplier_cnpj,
        number: nfeData.number,
        series: nfeData.series,
        issue_date: nfeData.issue_date,
        total_amount: nfeData.total_amount,
        items_count: nfeData.items.length,
        notes: `Importado com sucesso (${newProductsCount} novos, ${updatedProductsCount} atualizados)`,
        created_at: nowIso,
        items: nfeData.items,
      };

      // Salvar em cache local (offline-first)
      const localList = getLocalImports();
      saveLocalImports([newNfeRecord, ...localList.filter((n) => n.access_key !== nfeData.access_key)]);

      // 5. Salvar no Supabase se disponível
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await executeWithJwtRecovery(async (client) => {
            // Insere cabeçalho
            const { data: insertedHead } = await client
              .from('nfe_imports')
              .insert({
                id: newNfeRecord.id,
                company_id: newNfeRecord.company_id,
                imported_by_user_id: newNfeRecord.imported_by_user_id,
                imported_by_user_name: newNfeRecord.imported_by_user_name,
                access_key: newNfeRecord.access_key,
                supplier_name: newNfeRecord.supplier_name,
                supplier_cnpj: newNfeRecord.supplier_cnpj,
                number: newNfeRecord.number,
                series: newNfeRecord.series,
                issue_date: newNfeRecord.issue_date,
                total_amount: newNfeRecord.total_amount,
                items_count: newNfeRecord.items_count,
                notes: newNfeRecord.notes,
                created_at: newNfeRecord.created_at,
              })
              .select()
              .single();

            // Insere itens
            if (nfeData.items && nfeData.items.length > 0) {
              const itemRows = nfeData.items.map((it) => ({
                nfe_import_id: newNfeRecord.id,
                company_id: newNfeRecord.company_id,
                code: it.code,
                name: it.name,
                category: it.category,
                unit: it.unit,
                quantity: it.quantity,
                unit_price: it.unit_price,
                total_price: it.total_price,
                created_at: nowIso,
              }));

              await client.from('nfe_import_items').insert(itemRows);
            }

            return insertedHead;
          });
        } catch (dbErr) {
          console.warn('Persistência Supabase nfe_imports deferred:', dbErr);
        }
      }

      // Notifica componentes
      window.dispatchEvent(new Event('ant_products_updated'));
      window.dispatchEvent(new Event('ant_movements_updated'));
      window.dispatchEvent(new Event('ant_nfe_imported'));

      return {
        success: true,
        importRecord: newNfeRecord,
        newProductsCount,
        updatedProductsCount,
        totalItemsImported: nfeData.items.length,
        totalAmount: nfeData.total_amount,
      };
    } catch (err: any) {
      console.error('Erro na importação da NF-e para o estoque:', err);
      return {
        success: false,
        newProductsCount: 0,
        updatedProductsCount: 0,
        totalItemsImported: 0,
        totalAmount: 0,
        error: err.message || 'Erro inesperado ao importar NF-e.',
      };
    }
  },

  /**
   * Obtém o histórico de NF-e importadas pela empresa.
   */
  async getNfeImports(companyId: string, userId?: string): Promise<NfeImport[]> {
    const local = getLocalImports().filter(
      (n) => n.company_id === companyId || (userId && n.imported_by_user_id === userId)
    );

    const supabase = getSupabaseClient();
    if (!supabase) return local;

    try {
      const { data, error } = await executeWithJwtRecovery<any[]>(async (client) => {
        return await client
          .from('nfe_imports')
          .select(`
            *,
            items:nfe_import_items(*)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
      });

      if (!error && data && Array.isArray(data)) {
        const cloudIds = new Set(data.map((d: any) => d.id));
        const pendingLocal = local.filter((l) => !cloudIds.has(l.id));
        const merged = [...(data as NfeImport[]), ...pendingLocal];
        saveLocalImports(merged);
        return merged;
      }
    } catch {
      // Ignora erro e usa local
    }

    return local;
  },

  /**
   * Conta o total de NF-e importadas na plataforma para o Admin ANT.
   */
  async getTotalPlatformNfeCount(): Promise<number> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { count, error } = await supabase
          .from('nfe_imports')
          .select('*', { count: 'exact', head: true });

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch {
        // Ignora
      }
    }

    const local = getLocalImports();
    return local.length;
  },
};
