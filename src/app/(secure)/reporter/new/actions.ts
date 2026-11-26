"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { notifySlackIncident } from "@/lib/notifications/slack";

export type IncidentDuplicate = {
  incident_number: string;
  status: "received" | "in_progress" | "completed";
  created_at: string;
};

export type IncidentFormState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "duplicate"; message: string; duplicates: IncidentDuplicate[] };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitIncident(
  _previousState: IncidentFormState,
  formData: FormData,
): Promise<IncidentFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || profile.role !== "reporter") {
    return { kind: "error", message: "신고자로 로그인한 뒤 다시 시도해 주세요." };
  }

  const idempotencyKey = String(formData.get("idempotency_key") ?? "");
  const assetId = String(formData.get("asset_id") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  const occurredAtLocal = String(formData.get("occurred_at") ?? "").trim();
  const continueAfterDuplicate = formData.get("continue_after_duplicate") === "true";

  if (!uuidPattern.test(idempotencyKey)) {
    return { kind: "error", message: "신고 양식을 새로 열고 다시 제출해 주세요." };
  }
  if (!title || !description || !priority || !occurredAtLocal || (!assetId && !location)) {
    return { kind: "error", message: "필수 항목과 자산 또는 발생 위치를 입력해 주세요." };
  }
  if (title.length > 160 || description.length > 5000 || location.length > 240 || priority.length > 40) {
    return { kind: "error", message: "입력 길이를 확인해 주세요." };
  }

  const occurredAt = new Date(`${occurredAtLocal}:00+09:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return { kind: "error", message: "발생 시각을 확인해 주세요." };
  }

  const supabase = await createClient();

  if (assetId && !continueAfterDuplicate) {
    const { data: duplicates, error: duplicateError } = await supabase.rpc(
      "find_open_incident_summaries",
      { p_asset_id: assetId },
    );

    if (duplicateError) {
      return { kind: "error", message: "유사 신고를 확인하지 못했습니다. 잠시 후 다시 제출해 주세요." };
    }

    if (duplicates?.length) {
      return {
        kind: "duplicate",
        message: "같은 자산에 미해결 신고가 있습니다. 별도 문제라면 새 신고로 접수할 수 있습니다.",
        duplicates: duplicates as IncidentDuplicate[],
      };
    }
  }

  const { data, error } = await supabase.rpc("create_incident_once", {
    p_idempotency_key: idempotencyKey,
    p_asset_id: assetId,
    p_location_snapshot: location || null,
    p_title: title,
    p_description: description,
    p_priority: priority,
    p_occurred_at: occurredAt.toISOString(),
  });

  const created = data?.[0];
  if (error || !created) {
    return { kind: "error", message: "신고를 저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해 주세요." };
  }

  if (priority === "긴급") {
    await notifySlackIncident({
      id: created.id,
      incident_number: created.incident_number,
      title,
      priority,
      location_snapshot: location || null,
    });
  }

  redirect(`/reporter/incidents/${created.id}?created=1`);
}
