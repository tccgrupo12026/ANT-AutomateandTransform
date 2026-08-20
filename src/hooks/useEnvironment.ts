import { useState, useEffect } from 'react';
import { config } from '../lib/config';

export function useEnvironment() {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  return {
    isClientReady,
    isProduction: config.isProduction,
    hasSupabaseConfig: config.supabase.isConfigured,
  };
}
