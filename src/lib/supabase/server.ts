import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

export async function createClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}

export async function endSession(client: Awaited<ReturnType<typeof createClient>>) {
  const result = await client.auth.signOut().catch(() => ({ error: true }));
  const { url } = requireSupabasePublicEnv();
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    const base = name.replace(/\.\d+$/, "");
    const isVerifier = base.startsWith(`${key}-`) && base.endsWith("-code-verifier");
    if (base === key || base === `${key}-user` || isVerifier) {
      cookieStore.delete(name);
    }
  }
  return !result.error;
}
