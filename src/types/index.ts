/**
 * Global TypeScript definitions and shared application contracts.
 * Extend these types as domain-specific features are implemented.
 */

export interface SystemStatus {
  runtime: 'ready' | 'loading' | 'error';
  version: string;
  environment: string;
  supabaseConfigured: boolean;
}

export interface ArchitectureModule {
  id: string;
  name: string;
  directory: string;
  purpose: string;
  status: 'initialized' | 'pending' | 'ready';
}
