"use server";

import { redirect } from "next/navigation";
import { createClient, endSession } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getTestLoginPassword, getTestReporterCredentials } from "@/lib/auth/test-login";

async function signInWithExpectedRole(formData: FormData, expectedRole?: "reporter" | "admin") {
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
    await endSession(supabase);
    redirect("/login?error=profile");
  }

  if (!profile.is_active) {
    await endSession(supabase);
    redirect("/login?error=disabled");
  }

  if (expectedRole && profile.role !== expectedRole) {
    await endSession(supabase);
    redirect("/login?error=test");
  }

  redirect(profile.role === "reporter" ? "/reporter" : "/ops");
}

export async function signIn(formData: FormData) {
  await signInWithExpectedRole(formData);
}

export async function signInAsTestAdmin() {
  const password = getTestLoginPassword();
  if (!password) {
    redirect("/login?error=test");
  }

  const formData = new FormData();
  formData.set("email", "admin@admin.com");
  formData.set("password", password);
  await signInWithExpectedRole(formData, "admin");
}

export async function signInAsTestReporter() {
  const credentials = getTestReporterCredentials();
  if (!credentials) {
    redirect("/login?error=test");
  }

  const formData = new FormData();
  formData.set("email", credentials.email);
  formData.set("password", credentials.password);
  await signInWithExpectedRole(formData, "reporter");
}
