import { createClient } from "@supabase/supabase-js";

// Client avec la clé service_role : à utiliser UNIQUEMENT côté serveur
// (API routes, server actions, cron). Ne jamais importer dans un client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
