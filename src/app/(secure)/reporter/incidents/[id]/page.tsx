import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type ReporterIncidentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

const statusLabels = {
  received: "접수",
  in_progress: "조치 중",
  completed: "완료",
} as const;

export const dynamic = "force-dynamic";

export default async function ReporterIncidentPage({ params, searchParams }: ReporterIncidentPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "reporter") {
    redirect(profile ? "/ops" : "/login?error=profile");
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("id, incident_number, title, description, priority, status, location_snapshot, occurred_at, created_at, updated_at, due_at, completed_at, resolution_summary")
    .eq("id", id)
    .maybeSingle();

  if (error || !incident) {
    notFound();
  }

  const { data: updates } = await supabase
    .from("incident_updates")
    .select("id, body, created_at")
    .eq("incident_id", incident.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: true });

  const formatDate = (value: string) => new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <Link href="/reporter" className="text-sm text-blue-800 hover:underline">← 내 신고 목록</Link>
      {query.created === "1" ? <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900" role="status">신고가 접수되었습니다. 접수 번호를 저장해 주세요.</p> : null}
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-blue-800">{incident.incident_number}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{statusLabels[incident.status as keyof typeof statusLabels]}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{incident.priority}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold">{incident.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{formatDate(incident.created_at)} 접수 · 최근 업데이트 {formatDate(incident.updated_at)}</p>
        </div>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">신고 내용</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">발생 위치</dt><dd className="mt-1 text-sm font-medium">{incident.location_snapshot || "등록 자산"}</dd></div>
              <div><dt className="text-xs text-slate-500">발생 시각</dt><dd className="mt-1 text-sm font-medium">{formatDate(incident.occurred_at)}</dd></div>
            </dl>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-medium">증상 설명</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{incident.description}</p>
            </div>
            {incident.status === "completed" && incident.resolution_summary ? (
              <div className="mt-5 rounded-lg bg-green-50 p-4">
                <h3 className="text-sm font-semibold text-green-950">처리 결과</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">{incident.resolution_summary}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">공개 처리 이력</h2>
            {updates?.length ? (
              <ol className="mt-5 space-y-5">
                {updates.map((update) => (
                  <li key={update.id} className="border-l-2 border-blue-200 pl-4">
                    <time className="text-xs text-slate-500" dateTime={update.created_at}>{formatDate(update.created_at)}</time>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">아직 공개된 처리 내역이 없습니다. 상태가 바뀌면 이곳에 표시됩니다.</p>
            )}
          </section>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">현재 상태</h2>
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">진행 단계</p>
            <p className="mt-1 font-semibold">{statusLabels[incident.status as keyof typeof statusLabels]}</p>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">처리 기한</dt><dd className="font-medium">{incident.due_at ? formatDate(incident.due_at) : "미지정"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">완료 시각</dt><dd className="font-medium">{incident.completed_at ? formatDate(incident.completed_at) : "미완료"}</dd></div>
          </dl>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">내부 운영 메모는 표시하지 않습니다. 추가 변경 사항은 운영 담당자가 공개 처리 이력에 안내합니다.</p>
        </aside>
      </div>
    </main>
  );
}
