/**
 * ANT — Automate and Transform
 * Serviço de Configurações e Preferências do Usuário / Sistema
 *
 * Integração primária com Supabase Database (tabela `user_settings`) com RLS,
 * com cache local determinístico para resiliência e agilidade.
 *
 * 100% Determinístico — SEM Inteligência Artificial (IA), Gemini, OpenAI ou Chatbot.
 */

import { getSupabaseClient } from '../lib/supabase';
import { UserSettings, CurrencyType, DateFormatType } from '../types';

const SETTINGS_CACHE_PREFIX = 'ant_user_settings_';

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'America/Sao_Paulo', label: 'Brasília / Sudeste / Sul / Nordeste (GMT-3)', offset: 'UTC-3' },
  { value: 'America/Manaus', label: 'Amazonas / Manaus (GMT-4)', offset: 'UTC-4' },
  { value: 'America/Belem', label: 'Belém / Pará / Amapá (GMT-3)', offset: 'UTC-3' },
  { value: 'America/Fortaleza', label: 'Fortaleza / Ceará (GMT-3)', offset: 'UTC-3' },
  { value: 'America/Cuiaba', label: 'Cuiabá / Mato Grosso (GMT-4)', offset: 'UTC-4' },
  { value: 'America/Campo_Grande', label: 'Campo Grande / MS (GMT-4)', offset: 'UTC-4' },
  { value: 'America/Porto_Velho', label: 'Porto Velho / Rondônia (GMT-4)', offset: 'UTC-4' },
  { value: 'America/Boa_Vista', label: 'Boa Vista / Roraima (GMT-4)', offset: 'UTC-4' },
  { value: 'America/Rio_Branco', label: 'Rio Branco / Acre (GMT-5)', offset: 'UTC-5' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)', offset: 'UTC-2' },
  { value: 'UTC', label: 'Tempo Universal Coordenado (UTC)', offset: 'UTC+0' },
];

export const CURRENCY_OPTIONS: { value: CurrencyType; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real Brasileiro (BRL)', symbol: 'R$' },
  { value: 'USD', label: 'Dólar Americano (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
];

export const DATE_FORMAT_OPTIONS: { value: DateFormatType; label: string; example: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA (Padrão Brasil)', example: '20/08/2026' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD (Padrão ISO Internacional)', example: '2026-08-20' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA (Padrão EUA)', example: '08/20/2026' },
];

export const DEFAULT_USER_SETTINGS = (userId: string): UserSettings => ({
  user_id: userId,
  currency: 'BRL',
  date_format: 'DD/MM/YYYY',
  timezone: 'America/Sao_Paulo',
  default_profit_margin: 30,
  default_tax_rate: 6.0,
  financial_alert_threshold: 0,
  default_min_stock: 5,
  low_stock_alert_enabled: true,
  block_zero_stock_sales: false,
});

export const settingsService = {
  /**
   * Obtém as configurações do usuário no Supabase ou do cache local
   */
  async getSettings(userId: string): Promise<{ data: UserSettings; error: string | null }> {
    if (!userId) {
      return { data: DEFAULT_USER_SETTINGS(''), error: 'Identificador do usuário não informado.' };
    }

    const defaultSettings = DEFAULT_USER_SETTINGS(userId);
    const supabase = getSupabaseClient();

    // 1. Tentar ler do Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          // Se a tabela ainda não foi criada no Supabase pelo usuário, loga aviso e usa cache local
          console.warn('Tabela user_settings no Supabase não encontrada ou erro RLS:', error.message);
        } else if (data) {
          const merged: UserSettings = {
            ...defaultSettings,
            ...data,
            default_profit_margin: Number(data.default_profit_margin ?? 30),
            default_tax_rate: Number(data.default_tax_rate ?? 6.0),
            default_min_stock: Number(data.default_min_stock ?? 5),
            financial_alert_threshold: Number(data.financial_alert_threshold ?? 0),
          };

          try {
            localStorage.setItem(`${SETTINGS_CACHE_PREFIX}${userId}`, JSON.stringify(merged));
          } catch {
            // Ignora falha de cache
          }

          return { data: merged, error: null };
        }
      } catch (err: any) {
        console.warn('Falha ao conectar com user_settings no Supabase:', err?.message || err);
      }
    }

    // 2. Tentar ler do cache local
    try {
      const cached = localStorage.getItem(`${SETTINGS_CACHE_PREFIX}${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { data: { ...defaultSettings, ...parsed }, error: null };
      }
    } catch {
      // Ignora erro de parse
    }

    return { data: defaultSettings, error: null };
  },

  /**
   * Salva ou atualiza as configurações do usuário no Supabase (Upsert) e no cache local
   */
  async saveSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<{ data: UserSettings | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const currentRes = await this.getSettings(userId);
    const current = currentRes.data || DEFAULT_USER_SETTINGS(userId);

    const payload: UserSettings = {
      ...current,
      ...settings,
      user_id: userId,
      default_profit_margin: Number(settings.default_profit_margin ?? current.default_profit_margin),
      default_tax_rate: Number(settings.default_tax_rate ?? current.default_tax_rate),
      default_min_stock: Number(settings.default_min_stock ?? current.default_min_stock),
      financial_alert_threshold: Number(settings.financial_alert_threshold ?? current.financial_alert_threshold ?? 0),
      low_stock_alert_enabled: Boolean(settings.low_stock_alert_enabled ?? current.low_stock_alert_enabled),
      block_zero_stock_sales: Boolean(settings.block_zero_stock_sales ?? current.block_zero_stock_sales),
      updated_at: new Date().toISOString(),
    };

    // Atualiza cache local imediatamente
    try {
      localStorage.setItem(`${SETTINGS_CACHE_PREFIX}${userId}`, JSON.stringify(payload));
    } catch {
      // Ignora falha de cache local
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: userId,
              currency: payload.currency,
              date_format: payload.date_format,
              timezone: payload.timezone,
              default_profit_margin: payload.default_profit_margin,
              default_tax_rate: payload.default_tax_rate,
              financial_alert_threshold: payload.financial_alert_threshold,
              default_min_stock: payload.default_min_stock,
              low_stock_alert_enabled: payload.low_stock_alert_enabled,
              block_zero_stock_sales: payload.block_zero_stock_sales,
              updated_at: payload.updated_at,
            },
            { onConflict: 'user_id' }
          )
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Aviso ao salvar user_settings no Supabase (cache local preservado):', error.message);
          // Retorna os dados atualizados com mensagem de status
          return { data: payload, error: null };
        }

        if (data) {
          const finalData: UserSettings = {
            ...payload,
            ...data,
          };
          localStorage.setItem(`${SETTINGS_CACHE_PREFIX}${userId}`, JSON.stringify(finalData));
          return { data: finalData, error: null };
        }
      } catch (err: any) {
        console.warn('Erro de rede ao persistir no Supabase (cache local mantido):', err?.message || err);
        return { data: payload, error: null };
      }
    }

    return { data: payload, error: null };
  },

  /**
   * Helper para formatar moeda com base na preferência configurada
   */
  formatCurrency(value: number, currency: CurrencyType = 'BRL'): string {
    const localeMap = {
      BRL: 'pt-BR',
      USD: 'en-US',
      EUR: 'de-DE',
    };

    return (value || 0).toLocaleString(localeMap[currency] || 'pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    });
  },

  /**
   * Helper para formatar data conforme a preferência configurada
   */
  formatDate(dateInput: string | Date, format: DateFormatType = 'DD/MM/YYYY'): string {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`;
    }
  },
};
