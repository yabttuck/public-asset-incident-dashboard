import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { saveAsset, setAssetActive } from "@/app/(secure)/assets/actions";

type Asset = {
  id: string;
  asset_name: string;
  asset_number: string | null;
  asset_type: string | null;
  location: string | null;
  is_active: boolean;
  updated_at: string;
};

type AssetsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const errorMessages: Record<string, string> = {
  required: "자산명을 입력해 주세요.",
  duplicate: "이미 사용 중인 자산 관리번호입니다.",
  save: "저장하지 못했습니다. 권한과 입력값을 확인한 뒤 다시 시도해 주세요.",
  load: "자산 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect(profile ? "/ops" : "/login?error=profile");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, asset_name, asset_number, asset_type, location, is_active, updated_at")
    .order("asset_name", { ascending: true });
  const assets = (data ?? []) as Asset[];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-800">관리자 전용</p>
          <h1 className="mt-1 text-2xl font-bold">자산 관리</h1>
          <p className="mt-2 text-sm text-slate-600">장애 신고에서 선택할 시설과 전산 자산을 등록하고 관리합니다.</p>
        </div>
        <p className="text-sm text-slate-500">등록 자산 {assets.length}개 · 삭제 대신 비활성화</p>
      </div>

      {params.saved === "1" ? (
        <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900" role="status">변경 내용을 저장했습니다.</p>
      ) : null}
      {params.error && errorMessages[params.error] ? (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages[params.error]}</p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessages.load}</p>
      ) : null}

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-semibold">등록된 자산</h2>
            <p className="mt-1 text-sm text-slate-500">비활성 자산도 과거 신고의 참조를 위해 목록에 남습니다.</p>
          </div>
          {assets.length ? (
            <div className="divide-y divide-slate-200">
              {assets.map((asset) => (
                <article key={asset.id} className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {asset.asset_number ? <span className="font-mono text-xs font-semibold text-blue-800">{asset.asset_number}</span> : null}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${asset.is_active ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                        {asset.is_active ? "사용 중" : "비활성"}
                      </span>
                    </div>
                    <time className="text-xs text-slate-500" dateTime={asset.updated_at}>
                      수정 {new Date(asset.updated_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </time>
                  </div>
                  <form action={saveAsset} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={asset.id} />
                    <div>
                      <label htmlFor={`name-${asset.id}`} className="mb-1.5 block text-xs font-medium text-slate-600">자산명 *</label>
                      <input id={`name-${asset.id}`} name="asset_name" required maxLength={160} defaultValue={asset.asset_name} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                    </div>
                    <div>
                      <label htmlFor={`number-${asset.id}`} className="mb-1.5 block text-xs font-medium text-slate-600">관리번호</label>
                      <input id={`number-${asset.id}`} name="asset_number" maxLength={80} defaultValue={asset.asset_number ?? ""} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                    </div>
                    <div>
                      <label htmlFor={`type-${asset.id}`} className="mb-1.5 block text-xs font-medium text-slate-600">유형</label>
                      <input id={`type-${asset.id}`} name="asset_type" maxLength={80} defaultValue={asset.asset_type ?? ""} placeholder="기관 분류 기준에 따름" className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                    </div>
                    <div>
                      <label htmlFor={`location-${asset.id}`} className="mb-1.5 block text-xs font-medium text-slate-600">위치</label>
                      <input id={`location-${asset.id}`} name="location" maxLength={240} defaultValue={asset.location ?? ""} className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
                    </div>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <button className="min-h-10 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">변경 저장</button>
                    </div>
                  </form>
                  <form action={setAssetActive} className="mt-2 flex justify-end">
                    <input type="hidden" name="id" value={asset.id} />
                    <input type="hidden" name="next_active" value={String(!asset.is_active)} />
                    <button className="min-h-9 rounded-lg px-3 text-xs text-slate-600 hover:bg-slate-100">
                      {asset.is_active ? "신규 선택에서 비활성화" : "다시 활성화"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : error ? null : (
            <div className="p-8 text-center">
              <p className="font-medium">등록된 자산이 없습니다.</p>
              <p className="mt-2 text-sm text-slate-500">오른쪽 양식에서 첫 자산을 등록해 주세요.</p>
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">자산 등록</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">관리번호와 유형이 아직 정해지지 않았다면 비워 두고 등록할 수 있습니다.</p>
          <form action={saveAsset} className="mt-5 space-y-4">
            <div>
              <label htmlFor="new-name" className="mb-2 block text-sm font-medium">자산명 <span className="text-red-600">*</span></label>
              <input id="new-name" name="asset_name" required maxLength={160} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <div>
              <label htmlFor="new-number" className="mb-2 block text-sm font-medium">관리번호</label>
              <input id="new-number" name="asset_number" maxLength={80} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <div>
              <label htmlFor="new-type" className="mb-2 block text-sm font-medium">유형</label>
              <input id="new-type" name="asset_type" maxLength={80} placeholder="예: 전산장비, 공공시설" className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <div>
              <label htmlFor="new-location" className="mb-2 block text-sm font-medium">위치</label>
              <input id="new-location" name="location" maxLength={240} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <button className="min-h-11 w-full rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-950">자산 등록</button>
          </form>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">자산을 비활성화해도 기존 신고 이력과 자산 연결은 유지됩니다. 자산 삭제 기능은 제공하지 않습니다.</p>
        </aside>
      </div>
    </main>
  );
}
