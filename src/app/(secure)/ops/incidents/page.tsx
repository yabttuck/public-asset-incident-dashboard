import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type OperationsListProps = {
  searchParams: Promise<{
    q?: string;
    location?: string;
    status?: string;
    priority?: string;
    asset?: string;
    from?: string;
    to?: string;
    page?: string;
    overdue?: string;
    noDue?: string;
    unassigned?: string;
  }>;
};

type IncidentRow = {
  id: string;
  incident_number: string;
  title: string;
  location_snapshot: string | null;
  priority: string;
  status: "received" | "in_progress" | "completed";
  assignee_id: string | null;
  due_at: string | null;
  updated_at: string;
  assets: { asset_name: string; asset_number: string | null } | null;
};

const statusLabels = { received: "접수", in_progress: "조치 중", completed: "완료" } as const;
const statusStyles = {
  received: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-800",
  completed: "bg-green-50 text-green-800",
} as const;
const statusFilters = ["active", "received", "in_progress", "completed"] as const;

function startOfKstDay(value: string) {
  const date = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function endOfKstDay(value: string) {
  const date = new Date(`${value}T23:59:59.999+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const dynamic = "force-dynamic";

export default async function OperationsIncidentsPage({ searchParams }: OperationsListProps) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "operator" && profile.role !== "admin")) {
    redirect(profile ? "/reporter" : "/login?error=profile");
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const location = (params.location ?? "").trim().slice(0, 100);
  const status = statusFilters.includes(params.status as (typeof statusFilters)[number]) ? params.status : "";
  const priority = (params.priority ?? "").trim().slice(0, 40);
  const assetId = (params.asset ?? "").trim();
  const from = (params.from ?? "").trim();
  const to = (params.to ?? "").trim();
  const overdue = params.overdue === "1";
  const noDue = params.noDue === "1";
  const unassigned = params.unassigned === "1";
  const pageSize = 50;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));
  const rangeStart = (page - 1) * pageSize;

  const supabase = await createClient();
  const baseQuery = supabase
    .from("incidents")
    .select("id, incident_number, title, location_snapshot, priority, status, assignee_id, due_at, updated_at, assets(asset_name, asset_number)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    if (q.toUpperCase().startsWith("INC-")) baseQuery.ilike("incident_number", `%${q}%`);
    else baseQuery.ilike("title", `%${q}%`);
  }
  if (location) baseQuery.ilike("location_snapshot", `%${location.replace(/[\\%_]/g, "\\$&")}%`);
  if (status === "active") baseQuery.neq("status", "completed");
  else if (status) baseQuery.eq("status", status);
  if (priority) baseQuery.eq("priority", priority);
  if (assetId) baseQuery.eq("asset_id", assetId);
  const fromIso = startOfKstDay(from);
  const toIso = endOfKstDay(to);
  if (fromIso) baseQuery.gte("created_at", fromIso);
  if (toIso) baseQuery.lte("created_at", toIso);
  if (overdue) baseQuery.neq("status", "completed").lt("due_at", new Date().toISOString());
  if (noDue) baseQuery.neq("status", "completed").is("due_at", null);
  if (unassigned) baseQuery.neq("status", "completed").is("assignee_id", null);

  const [{ data, error, count }, { data: assets }] = await Promise.all([
    baseQuery.range(rangeStart, rangeStart + pageSize - 1),
    supabase.from("assets").select("id, asset_name, asset_number").order("asset_name"),
  ]);
  const incidents = (data ?? []) as unknown as IncidentRow[];
  const assetChoices = assets ?? [];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <div>
        <p className="text-sm font-semibold text-blue-800">운영 담당자</p>
        <h1 className="mt-1 text-2xl font-bold">운영 신고 목록</h1>
        <p className="mt-2 text-sm text-slate-600">검색과 필터로 처리할 신고를 찾고 상세 화면에서 조치합니다.</p>
      </div>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2"><span className="mb-1.5 block text-xs font-medium text-slate-600">접수 번호 또는 제목</span><input name="q" defaultValue={q} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="INC-… 또는 신고 제목" /></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">상태</span><select name="status" defaultValue={status} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체 상태</option>{statusFilters.map((value) => <option key={value} value={value}>{value === "active" ? "미완료 전체" : statusLabels[value]}</option>)}</select></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">우선순위</span><select name="priority" defaultValue={priority} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체</option>{[...new Set(["낮음", "보통", "높음", "긴급", ...(priority ? [priority] : [])])].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">자산</span><select name="asset" defaultValue={assetId} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체 자산</option>{assetChoices.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_number ? `${asset.asset_number} · ` : ""}{asset.asset_name}</option>)}</select></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">위치</span><input name="location" defaultValue={location} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="위치 문구" /></label>
        <label className="flex min-h-10 items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" name="overdue" value="1" defaultChecked={overdue} className="size-4 accent-blue-900"/>기한 초과만</label>
        <label className="flex min-h-10 items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" name="noDue" value="1" defaultChecked={noDue} className="size-4 accent-blue-900"/>기한 미지정</label>
        <label className="flex min-h-10 items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" name="unassigned" value="1" defaultChecked={unassigned} className="size-4 accent-blue-900"/>담당 미지정</label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">접수 시작일</span><input type="date" name="from" defaultValue={from} className="min-h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-600">접수 종료일</span><input type="date" name="to" defaultValue={to} className="min-h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label>
        <div className="flex items-end gap-2 lg:col-span-6"><button className="min-h-10 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">검색</button><Link href="/ops/incidents" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm hover:bg-slate-50">초기화</Link></div>
      </form>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">신고 결과</h2><span className="text-sm text-slate-500">{count ?? 0}건 · 최대 {pageSize}건 표시</span></div>
        {error ? <p className="p-5 text-sm text-red-800" role="alert">신고 목록을 불러오지 못했습니다. 조건을 확인하고 다시 시도해 주세요.</p> : incidents.length ? (
          <div className="divide-y divide-slate-200">
            {incidents.map((incident) => {
              const location = incident.assets?.asset_name
                ? `${incident.assets.asset_number ? `${incident.assets.asset_number} · ` : ""}${incident.assets.asset_name}`
                : incident.location_snapshot || "위치 미상";
              const isOverdue = incident.status !== "completed" && incident.due_at && new Date(incident.due_at) < new Date();

              return (
                <Link key={incident.id} href={`/ops/incidents/${incident.id}`} className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-blue-800">{incident.incident_number}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[incident.status]}`}>{statusLabels[incident.status]}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{incident.priority}</span></div>
                    <h3 className="mt-2 font-semibold">{incident.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{location}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm sm:block sm:text-right">
                    <p className={isOverdue ? "font-medium text-red-700" : "text-slate-600"}>{incident.due_at ? `${isOverdue ? "기한 초과 · " : "기한 "}${new Date(incident.due_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}` : "기한 미지정"}</p>
                    <p className="mt-1 text-xs text-slate-500">업데이트 {new Date(incident.updated_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center"><h3 className="font-semibold">조건에 맞는 신고가 없습니다.</h3><p className="mt-2 text-sm text-slate-500">검색어나 필터를 바꿔 다시 확인해 주세요.</p></div>
        )}
      </section>
      {count && count > pageSize ? <nav aria-label="신고 목록 페이지" className="mt-4 flex items-center justify-between"><span className="text-sm text-slate-600">{page} / {Math.ceil(count / pageSize)} 페이지</span><div className="flex gap-2">{page > 1 ? <Link href={pageLink(params, page - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">이전</Link> : null}{page * pageSize < count ? <Link href={pageLink(params, page + 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">다음</Link> : null}</div></nav> : null}
    </main>
  );
}

function pageLink(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") query.set(key, value);
  query.set("page", String(page));
  return `/ops/incidents?${query.toString()}`;
}
