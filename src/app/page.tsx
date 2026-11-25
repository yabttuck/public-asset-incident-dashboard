const setupItems = [
  {
    number: "01",
    title: "인증과 역할",
    description: "Supabase 개발 프로젝트와 내부 계정 발급 방식을 확인합니다.",
    status: "다음 단계",
  },
  {
    number: "02",
    title: "자산과 신고",
    description: "자산 선택, 신고 접수, 본인 신고 조회 흐름을 연결합니다.",
    status: "예정",
  },
  {
    number: "03",
    title: "운영과 관제",
    description: "배정, 처리 이력, SLA, 관리자 화면을 구현합니다.",
    status: "예정",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-lg font-bold text-blue-900" aria-hidden="true">
          공
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-950">공공 시설물·전산 자산 장애 관리</p>
          <p className="mt-0.5 text-xs text-slate-500">서비스 개발 준비</p>
        </div>
      </header>

      <section className="grid flex-1 content-center gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-800">PUBLIC ASSET OPERATIONS</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            장애 접수부터 조치 완료까지,
            <br className="hidden sm:block" />
            한 곳에서 관리합니다.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            신고자, 운영 담당자, 관리자가 시설과 전산 자산의 장애를 함께 추적하는 업무 서비스입니다.
            지금은 개발 기반을 구성하고 있습니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-900">신고 접수</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">역할별 접근</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">처리 이력과 기한</span>
          </div>
          <a href="/login" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-950">
            내부 계정으로 로그인
          </a>
        </div>

        <section aria-labelledby="progress-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="progress-heading" className="text-lg font-semibold">개발 진행</h2>
              <p className="mt-1 text-sm text-slate-500">P0 첫 사용 가능 버전</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">기반 구축 중</span>
          </div>

          <ol className="mt-6 divide-y divide-slate-100">
            {setupItems.map((item, index) => (
              <li key={item.number} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${index === 0 ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {item.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="text-xs text-slate-500">{item.status}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        업무 정책과 권한은 승인된 기준에 따라 적용하며, 예시 데이터는 실제 신고 정보가 아닙니다.
      </footer>
    </main>
  );
}
