"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    redirect("/login?error=profile");
  }
  if (profile.role !== "admin") {
    redirect("/ops");
  }
  return profile;
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveAsset(formData: FormData) {
  const profile = await requireAdmin();
  const id = field(formData, "id");
  const assetName = field(formData, "asset_name");

  if (!assetName) {
    redirect("/assets?error=required");
  }

  const asset = {
    asset_name: assetName,
    asset_number: field(formData, "asset_number") || null,
    asset_type: field(formData, "asset_type") || null,
    location: field(formData, "location") || null,
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from("assets").update(asset).eq("id", id)
    : supabase.from("assets").insert({ ...asset, created_by: profile.id });
  const { data, error } = await query.select("id").maybeSingle();

  if (error || !data) {
    redirect(`/assets?error=${error?.code === "23505" ? "duplicate" : "save"}`);
  }

  redirect("/assets?saved=1");
}

export async function setAssetActive(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const nextActive = field(formData, "next_active");

  if (!id || !["true", "false"].includes(nextActive)) {
    redirect("/assets?error=save");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .update({ is_active: nextActive === "true" })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/assets?error=save");
  }

  redirect("/assets?saved=1");
}
