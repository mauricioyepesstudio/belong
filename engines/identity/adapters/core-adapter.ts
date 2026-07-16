import type { SupabaseServerClient } from "@/lib/core/types";
import { createIdentityEngineService } from "../services/identity-service";
import type { IdentityEngineContext, IdentityEngineData } from "../types";

export type IdentityCoreAdapter = {
  fetchIdentityData(context: IdentityEngineContext): Promise<IdentityEngineData | null>;
};

export function createIdentityCoreAdapter(
  supabase: SupabaseServerClient
): IdentityCoreAdapter {
  const service = createIdentityEngineService(supabase);

  return {
    async fetchIdentityData(context) {
      return service.getIdentityData(context);
    },
  };
}
