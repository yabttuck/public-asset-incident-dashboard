import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type AdminProps = { searchParams: Promise<{ error?: string }> };
type ProfileRow = { id: string; display_name: string; role: "reporter" | "operator" | "admin"; is_active: boolean; created_at: string };
const roleNames = { reporter: "신고자", operator: "운영 담당자", admin: "관리자" } as const;

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: AdminProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect(profile ? "/ops" : "/login?error=profile");
  const [{ error: requestedError }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data, error } = await supabase.from("profiles").select("id, display_name, role, is_active, created_at").order("created_at", { ascending: false });
  const users = (data ?? []) as ProfileRow[];

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-800">관리자</p><h1 className="mt-1 text-2xl font-bold">사용자 및 운영 기준</h1><p className="mt-2 text-sm text-slate-600">현재 계정 권한과 확정이 필요한 운영 기준을 확인합니다.</p></div><Link href="/assets" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">자산 관리</Link></div>

    {requestedError === "load" || error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">사용자 목록을 불러오지 못했습니다. 권한과 연결 상태를 확인해 주세요.</p> : null}
    <section className="mt-6 rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold">사용자 계정</h2><p className="mt-1 text-xs text-slate-500">등록된 프로필 {users.length}명</p></div></div>
      {users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="px-5 py-3 font-medium">이름</th><th className="px-5 py-3 font-medium">역할</th><th className="px-5 py-3 font-medium">상태</th><th className="px-5 py-3 font-medium">등록일</th></tr></thead><tbody className="divide-y divide-slate-200">{users.map((user) => <tr key={user.id}><td className="px-5 py-4 font-medium">{user.display_name || "이름 미설정"}</td><td className="px-5 py-4">{roleNames[user.role]}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-600"}`}>{user.is_active ? "활성" : "비활성"}</span></td><td className="px-5 py-4 text-slate-600">{new Date(user.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</td></tr>)}</tbody></table></div> : !error ? <p className="p-8 text-center text-sm text-slate-500">표시할 사용자가 없습니다.</p> : null}
    </section>

    <section className="mt-6"><div><h2 className="text-lg font-semibold">기관 확인이 필요한 기준</h2><p className="mt-1 text-sm text-slate-600">정책이 승인되기 전까지 앱에서 설정값으로 적용하지 않습니다.</p></div><div className="mt-4 grid gap-3 md:grid-cols-2">{[
      ["계정 운영", "계정 초대·회수·복구 주체 및 내부 사용자 범위", "대기"],
      ["역할 변경", "승인 절차와 변경 감사 방식", "대기"],
      ["우선순위", "단계와 각 단계의 대응 의미", "대기"],
      ["SLA", "기한 지정 책임, 임박 기준과 적용 시간", "대기"],
      ["완료 신고", "관리자 정정 권한과 필수 사유", "대기"],
      ["데이터 관리", "보존·파기, 백업·복구 책임", "대기"],
    ].map(([title, description, state]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{title}</h3><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">{state}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></section>
    <p className="mt-5 text-xs leading-5 text-slate-500">현재 화면은 계정과 기준의 조회용입니다. 역할 변경·초대·정정은 기관의 승인 절차와 감사 정책이 확정된 뒤 추가합니다.</p>
  </main>;
}
