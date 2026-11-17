import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Lazy proxy — the client is only constructed on first use, so importing
 * this module never throws during `next build` (page-data collection
 * happens before env vars exist on a fresh deploy).
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<PropertyKey, unknown>)[prop];
  },
});
