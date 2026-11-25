import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return profile as {
    id: string;
    display_name: string;
    role: "reporter" | "operator" | "admin";
    is_active: boolean;
  };
});
