"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function signIn(formData: FormData) {
  if (!getSupabasePublicEnv()) {
    redirect("/login?setup=1");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || !email.includes("@")) {
    redirect("/login?error=credentials");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/login?error=credentials");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect("/login?error=profile");
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=disabled");
  }

  redirect(profile.role === "reporter" ? "/reporter" : "/ops");
}
