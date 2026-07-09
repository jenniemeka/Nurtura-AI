import { supabase } from "@/integrations/supabase/client";

/**
 * After sign-in/sign-up, decide where the user should land.
 * Uses maybeSingle so a missing profile row (fresh signup before trigger runs)
 * safely falls through to onboarding.
 */
export async function resolvePostAuthRoute(userId: string): Promise<"/onboarding" | "/dashboard"> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userId)
    .maybeSingle();
  return data?.onboarded ? "/dashboard" : "/onboarding";
}
