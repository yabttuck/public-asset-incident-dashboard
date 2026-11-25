"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

async function requireOperator() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login?error=profile");
  if (profile.role !== "operator" && profile.role !== "admin") redirect("/reporter");
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function kstDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function saveAssignment(formData: FormData) {
  await requireOperator();
  const incidentId = field(formData, "incident_id");
  const expectedUpdatedAt = field(formData, "expected_updated_at");
  const assigneeId = field(formData, "assignee_id") || null;
  const priority = field(formData, "priority");
  const dueAtInput = field(formData, "due_at");
  const dueAt = kstDate(dueAtInput);

  if (!incidentId || !expectedUpdatedAt || !priority || dueAt === undefined) {
    redirect(`/ops/incidents/${incidentId}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_incident_assignment", {
    p_incident_id: incidentId,
    p_expected_updated_at: expectedUpdatedAt,
    p_assignee_id: assigneeId,
    p_priority: priority,
    p_due_at: dueAt,
  });

  if (error) {
    redirect(`/ops/incidents/${incidentId}?${error.code === "40001" ? "conflict=1" : "error=save"}`);
  }

  redirect(`/ops/incidents/${incidentId}?saved=1`);
}

export async function transitionIncident(formData: FormData) {
  await requireOperator();
  const incidentId = field(formData, "incident_id");
  const expectedUpdatedAt = field(formData, "expected_updated_at");
  const targetStatus = field(formData, "target_status");
  const resolutionSummary = field(formData, "resolution_summary");
  const publicUpdate = field(formData, "public_update");
  const internalNote = field(formData, "internal_note");

  if (!incidentId || !expectedUpdatedAt || !["in_progress", "completed"].includes(targetStatus)) {
    redirect(`/ops/incidents/${incidentId}?error=invalid`);
  }
  if (resolutionSummary.length > 5000 || publicUpdate.length > 5000 || internalNote.length > 5000) {
    redirect(`/ops/incidents/${incidentId}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_incident", {
    p_incident_id: incidentId,
    p_expected_updated_at: expectedUpdatedAt,
    p_target_status: targetStatus,
    p_resolution_summary: resolutionSummary || null,
    p_public_update: publicUpdate || null,
    p_internal_note: internalNote || null,
  });

  if (error) {
    const query = error.code === "40001" ? "conflict=1" : error.code === "22023" ? "error=transition" : "error=save";
    redirect(`/ops/incidents/${incidentId}?${query}`);
  }

  redirect(`/ops/incidents/${incidentId}?saved=1`);
}

export async function addIncidentUpdate(formData: FormData) {
  await requireOperator();
  const incidentId = field(formData, "incident_id");
  const visibility = field(formData, "visibility");
  const body = field(formData, "body");

  if (!incidentId || !["public", "internal"].includes(visibility) || !body || body.length > 5000) {
    redirect(`/ops/incidents/${incidentId}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_incident_update", {
    p_incident_id: incidentId,
    p_visibility: visibility,
    p_body: body,
  });

  if (error) {
    redirect(`/ops/incidents/${incidentId}?error=save`);
  }

  redirect(`/ops/incidents/${incidentId}?saved=1`);
}
