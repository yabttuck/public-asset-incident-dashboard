import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type DashboardIncident = {
  id: string; incident_number: string; title: string; location_snapshot: string | null;
  priority: string; status: "received" | "in_progress" | "completed"; assignee_id: string | null;
  due_at: string | null; updated_at: string; assets: { asset_name: string; asset_number: string | null } | null;
};
const statusNames = { received: "접수", in_progress: "조치 중", completed: "완료" } as const;
const cardStyle = "rounded-xl border border-slate-200 bg-white p-5";
const countStyle = "mt-3 text-3xl font-bold tabular-nums text-slate-950";

export const dynamic = "force-dynamic";

export default async function OperationsHomePage() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "operator" && profile.role !== "admin")) redirect(profile ? "/reporter" : "/login?error=profile");

  const supabase = await createClient();
  const now = new Date().toISOString();
  const [all, open, overdue, completed, noDue, unassigned, recentResult, membersResult] = await Promise.all([
    supabase.from("incidents").select("id", { count: "exact", head: true }),
    supabase.from("incidents").select("id", { count: "exact", head: true }).neq("status", "completed"),
    supabase.from("incidents").select("id", { count: "exact", head: true }).neq("status", "completed").lt("due_at", now),
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("incidents").select("id", { count: "exact", head: true }).neq("status", "completed").is("due_at", null),
    supabase.from("incidents").select("id", { count: "exact", head: true }).neq("status", "completed").is("assignee_id", null),
    supabase.from("incidents").select("id, incident_number, title, location_snapshot, priority, status, assignee_id, due_at, updated_at, assets(asset_name, asset_number)").order("updated_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id, display_name").eq("is_active", true).in("role", ["operator", "admin"]),
  ]);
  const incidents = (recentResult.data ?? []) as unknown as DashboardIncident[];
  const names = new Map((membersResult.data ?? []).map((member) => [member.id, member.display_name || "이름 미설정"]));
  const stats = [
    { label: "전체 접수", count: all.count, href: "/ops/incidents", tone: "text-slate-950" },
    { label: "미완료", count: open.count, href: "/ops/incidents?status=active", tone: "text-blue-900" },
    { label: "기한 초과", count: overdue.count, href: "/ops/incidents?overdue=1", tone: "text-red-800" },
    { label: "완료", count: completed.count, href: "/ops/incidents?status=completed", tone: "text-green-800" },
  ];

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-800">운영 담당자 홈</p><h1 className="mt-1 text-2xl font-bold">운영 대시보드</h1><p className="mt-2 text-sm text-slate-600">신고 현황과 처리 기한을 확인하고 다음 조치를 이어가세요.</p></div><Link href="/ops/incidents" className="inline-flex min-h-11 items-center rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">신고 목록 열기</Link></div>

    <section aria-label="신고 집계" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <Link href={stat.href} key={stat.label} className={`${cardStyle} transition hover:border-slate-300 hover:shadow-sm`}><p className="text-sm font-medium text-slate-600">{stat.label}</p><p className={`${countStyle} ${stat.tone}`}>{stat.count ?? "—"}<span className="ml-1 text-sm font-normal text-slate-500">건</span></p></Link>)}</section>

    <section className="mt-4 grid gap-3 sm:grid-cols-2"><Link href="/ops/incidents?noDue=1" className={cardStyle}><p className="text-sm font-medium text-slate-600">기한 미지정 · 미완료</p><p className={countStyle}>{noDue.count ?? "—"}<span className="ml-1 text-sm font-normal text-slate-500">건</span></p><p className="mt-2 text-xs text-slate-500">기한 미지정 신고는 임박·초과 집계에서 제외합니다.</p></Link><Link href="/ops/incidents?unassigned=1" className={cardStyle}><p className="text-sm font-medium text-slate-600">담당자 미지정 · 미완료</p><p className={countStyle}>{unassigned.count ?? "—"}<span className="ml-1 text-sm font-normal text-slate-500">건</span></p></Link></section>

    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold">최근 변경된 신고</h2><p className="mt-1 text-xs text-slate-500">최근 업데이트 순 · 최대 8건</p></div><Link href="/ops/incidents" className="text-sm font-semibold text-blue-800 hover:underline">전체 목록</Link></div>
      {recentResult.error ? <p className="p-5 text-sm text-red-800" role="alert">신고 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : incidents.length ? <div className="divide-y divide-slate-200">{incidents.map((incident) => { const overdueNow = incident.status !== "completed" && incident.due_at && new Date(incident.due_at) < new Date(); const location = incident.assets ? `${incident.assets.asset_number ? `${incident.assets.asset_number} · ` : ""}${incident.assets.asset_name}` : incident.location_snapshot || "위치 미상"; return <Link key={incident.id} href={`/ops/incidents/${incident.id}`} className="grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-blue-800">{incident.incident_number}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{statusNames[incident.status]}</span><span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">{incident.priority}</span></div><h3 className="mt-2 font-semibold">{incident.title}</h3><p className="mt-1 text-sm text-slate-600">{location} · 담당 {incident.assignee_id ? names.get(incident.assignee_id) ?? "담당자" : "미지정"}</p></div><div className="text-sm sm:text-right"><p className={overdueNow ? "font-medium text-red-700" : "text-slate-600"}>{incident.due_at ? `${overdueNow ? "기한 초과 · " : "기한 "}${new Date(incident.due_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}` : "기한 미지정"}</p><p className="mt-1 text-xs text-slate-500">최근 변경 {new Date(incident.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p></div></Link>; })}</div> : <div className="p-8 text-center"><h3 className="font-semibold">아직 접수된 신고가 없습니다.</h3><p className="mt-2 text-sm text-slate-500">새 신고가 접수되면 이곳에 표시됩니다.</p></div>}
    </section>
    <p className="mt-4 text-xs leading-5 text-slate-500">SLA 임박 기준은 기관 정책 결정 전이므로 아직 집계하지 않습니다. 우선순위 단계도 현재는 제안값입니다. 기한 초과는 미완료 신고 중 지정 기한이 현재 시각을 지난 건으로 계산합니다.</p>
  </main>;
}
