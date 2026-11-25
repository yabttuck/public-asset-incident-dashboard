import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusLabels = {
  received: "접수",
  in_progress: "조치 중",
  completed: "완료",
} as const;

const statusStyles = {
  received: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-800",
  completed: "bg-green-50 text-green-800",
} as const;

export default async function ReporterHomePage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "reporter") {
    redirect("/ops");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id, incident_number, title, asset_id, location_snapshot, priority, status, created_at, updated_at")
    .order("created_at", { ascending: false });
  const incidents = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-800">신고자 홈</p>
          <h1 className="mt-1 text-2xl font-bold">내 신고</h1>
          <p className="mt-2 text-sm text-slate-600">접수한 신고와 공개된 처리 상황을 확인할 수 있습니다.</p>
        </div>
        <Link href="/reporter/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">새 장애 신고</Link>
      </div>

      {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">신고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
      <section aria-label="신고 목록" className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {incidents.length ? (
          <ul className="divide-y divide-slate-200">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link href={`/reporter/incidents/${incident.id}`} className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-blue-800">{incident.incident_number}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[incident.status as keyof typeof statusStyles]}`}>
                        {statusLabels[incident.status as keyof typeof statusLabels]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{incident.priority}</span>
                    </div>
                    <h2 className="mt-2 font-semibold">{incident.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{incident.location_snapshot || "등록 자산"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-500 sm:block sm:text-right">
                    <time dateTime={incident.updated_at}>최근 업데이트 {new Date(incident.updated_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time>
                    <span aria-hidden="true" className="ml-2">›</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : error ? null : (
          <div className="p-8 text-center">
            <h2 className="font-semibold">아직 접수한 신고가 없습니다.</h2>
            <p className="mt-2 text-sm text-slate-500">장애 내용을 등록하면 여기에서 처리 상황을 확인할 수 있습니다.</p>
            <Link href="/reporter/new" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">신고 작성</Link>
          </div>
        )}
      </section>
      <p className="mt-4 text-xs leading-5 text-slate-500">본인 신고와 공개 처리 정보만 표시됩니다. 내부 운영 메모와 다른 사용자의 신고는 볼 수 없습니다.</p>
    </main>
  );
}
