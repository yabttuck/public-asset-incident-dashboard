"use server";

import { redirect } from "next/navigation";
import { createClient, endSession } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  const revoked = await endSession(supabase);
  redirect(revoked ? "/login" : "/login?error=signout");
}
