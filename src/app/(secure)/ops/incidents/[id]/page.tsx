import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { addIncidentUpdate, saveAssignment, transitionIncident } from "../actions";

type DetailProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; conflict?: string; error?: string }> };
type Incident = {
  id: string; incident_number: string; title: string; description: string; location_snapshot: string | null;
  priority: string; status: "received" | "in_progress" | "completed"; occurred_at: string; created_at: string;
  updated_at: string; due_at: string | null; completed_at: string | null; resolution_summary: string | null;
  reporter_id: string; assignee_id: string | null; assets: { asset_name: string; asset_number: string | null } | null;
};
type Update = { id: string; visibility: "public" | "internal"; body: string; created_at: string; author_id: string };
type Audit = { id: string; action: string; old_values: Record<string, unknown> | null; new_values: Record<string, unknown> | null; created_at: string; actor_id: string | null };
const statusNames = { received: "접수", in_progress: "조치 중", completed: "완료" };
const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm";
const labelClass = "block text-sm font-medium text-slate-700";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return parts.replace(" ", "T");
}
function displayDate(value: string) { return new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }); }
function auditLabel(action: string) {
  const labels: Record<string, string> = { assignment_updated: "담당·우선순위·기한 변경", status_changed: "상태 변경", public_update_added: "신고자 안내 등록", internal_note_added: "내부 메모 등록", update_added: "처리 업데이트 등록" };
  return labels[action] ?? action;
}

export const dynamic = "force-dynamic";

export default async function OperationsIncidentDetail({ params, searchParams }: DetailProps) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "operator" && profile.role !== "admin")) redirect(profile ? "/reporter" : "/login?error=profile");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: rawIncident, error }, { data: members }, { data: rawUpdates }, { data: rawAudit }] = await Promise.all([
    supabase.from("incidents").select("*, assets(asset_name, asset_number)").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id, display_name, role").eq("is_active", true).in("role", ["operator", "admin"]).order("display_name"),
    supabase.from("incident_updates").select("id, visibility, body, created_at, author_id").eq("incident_id", id).order("created_at", { ascending: false }),
    supabase.from("incident_audit_logs").select("id, action, old_values, new_values, created_at, actor_id").eq("incident_id", id).order("created_at", { ascending: false }),
  ]);
  if (error || !rawIncident) notFound();
  const incident = rawIncident as unknown as Incident;
  const updates = (rawUpdates ?? []) as Update[];
  const audit = (rawAudit ?? []) as Audit[];
  const operators = members ?? [];
  const memberNames = new Map(operators.map((member) => [member.id, `${member.display_name || "이름 미설정"} · ${member.role === "admin" ? "관리자" : "운영 담당자"}`]));
  const isCompleted = incident.status === "completed";

  return <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
    <Link href="/ops/incidents" className="text-sm font-medium text-blue-800 hover:underline">← 신고 목록</Link>
    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
      <div><p className="font-mono text-sm font-semibold text-blue-800">{incident.incident_number}</p><h1 className="mt-1 text-2xl font-bold">{incident.title}</h1><p className="mt-2 text-sm text-slate-600">{incident.assets?.asset_name ?? incident.location_snapshot ?? "위치 미상"} · {statusNames[incident.status]}</p></div>
      <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${isCompleted ? "bg-green-50 text-green-800" : incident.status === "in_progress" ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{statusNames[incident.status]}</span>
    </div>
    {query.saved ? <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">변경 사항을 저장했습니다.</p> : null}
    {query.conflict ? <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">다른 담당자가 먼저 내용을 변경했습니다. 최신 내용을 확인한 뒤 다시 저장해 주세요.</p> : null}
    {query.error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">저장하지 못했습니다. 입력을 확인하고 다시 시도해 주세요.</p> : null}

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">신고 내용</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">접수 시각</dt><dd className="mt-1 text-sm">{displayDate(incident.created_at)}</dd></div><div><dt className="text-xs text-slate-500">발생 시각</dt><dd className="mt-1 text-sm">{displayDate(incident.occurred_at)}</dd></div><div><dt className="text-xs text-slate-500">신고자</dt><dd className="mt-1 text-sm">{memberNames.get(incident.reporter_id) ?? "신고자"}</dd></div><div><dt className="text-xs text-slate-500">위치</dt><dd className="mt-1 text-sm">{incident.assets?.asset_name ?? incident.location_snapshot ?? "위치 미상"}</dd></div></dl><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{incident.description}</p></section>

        {!isCompleted ? <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">처리 상태 변경</h2><form action={transitionIncident} className="mt-4 space-y-4"><input type="hidden" name="incident_id" value={id}/><input type="hidden" name="expected_updated_at" value={incident.updated_at}/><label className={labelClass}>다음 상태<select className={inputClass} name="target_status" defaultValue={incident.status === "received" ? "in_progress" : "completed"}><option value="in_progress" disabled={incident.status !== "received"}>조치 중으로 변경</option><option value="completed">완료 처리</option></select></label><label className={labelClass}>완료 요약 <span className="font-normal text-slate-500">(완료 처리 시 필수)</span><textarea className={`${inputClass} min-h-24 py-3`} name="resolution_summary" maxLength={5000} placeholder="조치 결과와 완료 내용을 기록해 주세요."/></label><label className={labelClass}>신고자에게 보낼 안내<textarea className={`${inputClass} min-h-20 py-3`} name="public_update" maxLength={5000} placeholder="신고자에게 공개되는 진행 상황"/></label><label className={labelClass}>내부 메모<textarea className={`${inputClass} min-h-20 py-3`} name="internal_note" maxLength={5000} placeholder="운영 담당자만 볼 수 있는 메모"/></label><button className="min-h-11 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">상태와 내용 저장</button></form></section> : <section className="rounded-xl border border-green-200 bg-green-50 p-5"><h2 className="font-semibold text-green-900">완료 요약</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-green-950">{incident.resolution_summary}</p><p className="mt-2 text-xs text-green-800">완료 시각 {incident.completed_at ? displayDate(incident.completed_at) : "-"}</p></section>}

        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">처리 기록</h2>{updates.length ? <ol className="mt-4 space-y-4">{updates.map((update) => <li key={update.id} className="border-l-2 border-slate-200 pl-4"><div className="flex flex-wrap gap-2 text-xs"><span className={update.visibility === "public" ? "font-medium text-blue-800" : "font-medium text-amber-800"}>{update.visibility === "public" ? "신고자 공개" : "내부 메모"}</span><time className="text-slate-500">{displayDate(update.created_at)}</time></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.body}</p></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">등록된 처리 기록이 없습니다.</p>}{!isCompleted ? <form action={addIncidentUpdate} className="mt-5 space-y-3 border-t border-slate-200 pt-5"><input type="hidden" name="incident_id" value={id}/><label className={labelClass}>새 처리 기록<select name="visibility" className={inputClass}><option value="public">신고자에게 공개</option><option value="internal">운영자 내부 메모</option></select></label><textarea name="body" required maxLength={5000} className={`${inputClass} min-h-24 py-3`} placeholder="진행 상황이나 내부 메모를 작성해 주세요."/><button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">기록 추가</button></form> : null}</section>
      </div>

      <aside className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">담당 및 우선순위</h2>{isCompleted ? <p className="mt-3 text-sm text-slate-600">완료된 신고는 수정할 수 없습니다.</p> : <form action={saveAssignment} className="mt-4 space-y-4"><input type="hidden" name="incident_id" value={id}/><input type="hidden" name="expected_updated_at" value={incident.updated_at}/><label className={labelClass}>담당자<select name="assignee_id" defaultValue={incident.assignee_id ?? ""} className={inputClass}><option value="">미지정</option>{operators.map((member) => <option key={member.id} value={member.id}>{member.display_name || "이름 미설정"} · {member.role === "admin" ? "관리자" : "운영 담당자"}</option>)}</select></label><label className={labelClass}>우선순위 <span className="font-normal text-amber-700">(기관 기준 확인 필요)</span><select name="priority" defaultValue={incident.priority} className={inputClass}>{[...new Set(["낮음", "보통", "높음", "긴급", incident.priority])].map((priority) => <option key={priority}>{priority}</option>)}</select></label><label className={labelClass}>처리 기한<input type="datetime-local" name="due_at" defaultValue={localDateTime(incident.due_at)} className={inputClass}/></label><button className="min-h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">담당·기한 저장</button></form>}</section>
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">변경 이력</h2>{audit.length ? <ol className="mt-4 space-y-4">{audit.map((entry) => <li key={entry.id}><p className="text-sm font-medium">{auditLabel(entry.action)}</p><p className="mt-1 text-xs text-slate-500">{entry.actor_id ? memberNames.get(entry.actor_id) ?? "담당자" : "시스템"} · {displayDate(entry.created_at)}</p>{entry.action === "assignment_updated" ? <p className="mt-1 text-xs text-slate-600">우선순위 {String(entry.old_values?.priority ?? "-")} → {String(entry.new_values?.priority ?? "-")}</p> : null}</li>)}</ol> : <p className="mt-3 text-sm text-slate-500">변경 이력이 없습니다.</p>}</section></aside>
    </div>
  </main>;
}
