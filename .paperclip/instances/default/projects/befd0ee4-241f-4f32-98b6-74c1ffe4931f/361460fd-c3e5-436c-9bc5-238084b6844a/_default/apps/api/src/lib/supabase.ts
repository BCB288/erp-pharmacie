import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const defaultClient = createClient(supabaseUrl, supabaseKey);

const als = new AsyncLocalStorage<SupabaseClient>();

export function createAuthClient(jwt: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export { als as supabaseStorage };

/**
 * Proxy that delegates to the per-request client (set via AsyncLocalStorage)
 * when available, falling back to the default client.
 * Services import this and it "just works" per-request.
 */
export const supabase: SupabaseClient = new Proxy(defaultClient, {
  get(_target, prop, _receiver) {
    const client = als.getStore() ?? defaultClient;
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as SupabaseClient;
