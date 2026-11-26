import "server-only";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

// Only the sample dashboard database supports shared sign-in.
export function getTestLoginPassword() {
  const demoUrl = "https://hbftaqlvexngirqusudr.supabase.co";
  if (getSupabasePublicEnv()?.url.replace(/\/$/, "") !== demoUrl) return null;
  return process.env.TEST_ADMIN_PASSWORD || null;
}

export function getTestReporterCredentials() {
  const demoUrl = "https://hbftaqlvexngirqusudr.supabase.co";
  if (getSupabasePublicEnv()?.url.replace(/\/$/, "") !== demoUrl) return null;
  const email = process.env.TEST_REPORTER_EMAIL?.trim();
  const password = process.env.TEST_REPORTER_PASSWORD;
  return email && password ? { email, password } : null;
}
