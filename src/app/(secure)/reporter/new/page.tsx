import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { IncidentForm } from "@/app/(secure)/reporter/new/incident-form";

type AssetChoice = {
  id: string;
  asset_name: string;
  asset_number: string | null;
  location: string | null;
};

export const dynamic = "force-dynamic";

export default async function NewIncidentPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "reporter") {
    redirect(profile ? "/ops" : "/login?error=profile");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, asset_name, asset_number, location")
    .eq("is_active", true)
    .order("asset_name");

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
      <div className="mb-7">
        <Link href="/reporter" className="text-sm text-blue-800 hover:underline">← 내 신고</Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">장애 신고 작성</h1>
        <p className="mt-2 text-sm text-slate-600">확인에 필요한 정보를 입력해 주세요. 별표(*) 항목은 필수입니다.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {error ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">자산 목록을 불러오지 못했습니다. 위치를 직접 입력해 신고할 수 있습니다.</p> : null}
          <IncidentForm assets={(data ?? []) as AssetChoice[]} />
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="font-semibold text-blue-950">작성 안내</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-blue-900">
              <li>자산을 모르면 시설명과 위치를 입력해 주세요.</li>
              <li>개인정보나 비밀번호는 증상 설명에 적지 마세요.</li>
              <li>접수 후 운영 담당자가 우선순위와 처리 기한을 검토합니다.</li>
            </ul>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">처리 흐름</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1. 접수</li><li>2. 조치 중</li><li>3. 완료</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
