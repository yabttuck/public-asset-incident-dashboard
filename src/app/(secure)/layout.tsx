import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import { getCurrentProfile } from "@/lib/auth/profile";

export const dynamic = "force-dynamic";

export default async function SecureLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login?error=profile");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <Link href={profile.role === "reporter" ? "/reporter" : "/ops"} className="text-sm font-semibold text-blue-950">
            공공 시설물·전산 자산 장애 관리
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {profile.role === "admin" ? (
              <>
                <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 sm:inline-flex">관리자</Link>
                <Link href="/assets" className="hidden rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 sm:inline-flex">자산 관리</Link>
              </>
            ) : null}
            <span className="hidden text-slate-600 sm:inline">{profile.display_name || "사용자"}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {profile.role === "reporter" ? "신고자" : profile.role === "operator" ? "운영 담당자" : "관리자"}
            </span>
            <form action={signOut}>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50">로그아웃</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
