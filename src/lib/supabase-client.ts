import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSupabaseClient(): Promise<SupabaseClient> {
  const mod = await import("@/integrations/supabase/client");
  return mod.supabase;
}
