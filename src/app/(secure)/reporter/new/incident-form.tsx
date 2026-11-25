"use client";

import { useActionState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  submitIncident,
  type IncidentFormState,
} from "@/app/(secure)/reporter/new/actions";

type AssetChoice = {
  id: string;
  asset_name: string;
  asset_number: string | null;
  location: string | null;
};

function SubmitButtons({ showDuplicate }: { showDuplicate: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
      {showDuplicate ? (
        <button name="continue_after_duplicate" value="false" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
          유사 신고 다시 확인
        </button>
      ) : null}
      <button name="continue_after_duplicate" value={showDuplicate ? "true" : "false"} disabled={pending} className="min-h-11 rounded-lg bg-blue-900 px-5 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-wait disabled:opacity-60">
        {pending ? "신고 확인 중…" : showDuplicate ? "별도 신고로 접수" : "신고 접수"}
      </button>
    </div>
  );
}

export function IncidentForm({ assets }: { assets: AssetChoice[] }) {
  const initialState: IncidentFormState = { kind: "idle" };
  const [state, action] = useActionState(submitIncident, initialState);

  function ensureIdempotencyKey(event: FormEvent<HTMLFormElement>) {
    const keyField = event.currentTarget.elements.namedItem("idempotency_key");
    if (keyField instanceof HTMLInputElement && !keyField.value) {
      keyField.value = crypto.randomUUID();
    }
  }

  return (
    <form action={action} onSubmit={ensureIdempotencyKey} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
      <input type="hidden" name="idempotency_key" defaultValue="" />

      {state.kind === "error" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{state.message}</p>
      ) : null}
      {state.kind === "duplicate" ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4" aria-live="polite">
          <h2 className="font-semibold text-amber-950">비슷한 미해결 신고를 확인해 주세요</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">{state.message}</p>
          <ul className="mt-3 divide-y divide-amber-200 rounded-lg border border-amber-200 bg-white">
            {state.duplicates.map((incident) => (
              <li key={incident.incident_number} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <span className="font-mono font-semibold text-blue-800">{incident.incident_number}</span>
                <span className="text-slate-600">{incident.status === "received" ? "접수" : "조치 중"}</span>
                <time className="text-xs text-slate-500" dateTime={incident.created_at}>
                  {new Date(incident.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                </time>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-5 text-amber-900">개인정보 보호를 위해 다른 신고의 제목과 상세 내용은 표시하지 않습니다. 기존 신고 상세는 담당자만 확인할 수 있습니다.</p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 font-semibold">장애 위치와 자산</h2>
        <label htmlFor="asset-id" className="mb-2 block text-sm font-medium">자산 선택</label>
        <select id="asset-id" name="asset_id" defaultValue="" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
          <option value="">자산을 선택하거나 위치를 직접 입력</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.asset_number ? `${asset.asset_number} · ` : ""}{asset.asset_name}
            </option>
          ))}
        </select>
        <label htmlFor="location" className="mb-2 mt-4 block text-sm font-medium">상세 위치 <span className="text-red-600">자산 미선택 시 필수</span></label>
        <input id="location" name="location" maxLength={240} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="예: 본관 1층 민원실 A구역" />
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="mb-4 font-semibold">장애 내용</h2>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">신고 제목 <span className="text-red-600">*</span></label>
        <input id="title" name="title" required maxLength={160} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="문제를 한 문장으로 적어 주세요" />

        <label htmlFor="priority" className="mb-2 mt-4 block text-sm font-medium">우선순위 제안 <span className="text-red-600">*</span></label>
        <select id="priority" name="priority" defaultValue="보통" required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-64">
          <option>낮음</option><option>보통</option><option>높음</option><option>긴급</option>
        </select>
        <p className="mt-1 text-xs leading-5 text-slate-500">기관의 우선순위 등급이 확정되기 전까지 제안값으로 표시됩니다. 운영 담당자가 검토할 수 있습니다.</p>

        <label htmlFor="description" className="mb-2 mt-4 block text-sm font-medium">증상 및 발생 상황 <span className="text-red-600">*</span></label>
        <textarea id="description" name="description" required maxLength={5000} rows={5} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm" placeholder="언제부터 어떤 문제가 발생했는지, 재현 방법이나 영향 범위를 적어 주세요." />

        <label htmlFor="occurred-at" className="mb-2 mt-4 block text-sm font-medium">발생 시각 <span className="text-red-600">*</span></label>
        <input id="occurred-at" name="occurred_at" type="datetime-local" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm sm:w-auto" />
        <p className="mt-1 text-xs text-slate-500">한국 표준시 기준으로 입력합니다.</p>
      </section>

      <SubmitButtons showDuplicate={state.kind === "duplicate"} />
    </form>
  );
}
