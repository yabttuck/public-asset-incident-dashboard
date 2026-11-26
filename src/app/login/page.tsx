import Link from "next/link";
import { signIn, signInAsTestAdmin, signInAsTestReporter } from "@/app/login/actions";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getTestLoginPassword, getTestReporterCredentials } from "@/lib/auth/test-login";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; setup?: string }>;
};

const loginErrors: Record<string, string> = {
  credentials: "이메일 또는 비밀번호를 확인해 주세요.",
  profile: "계정 역할을 확인할 수 없습니다. 시스템 관리자에게 문의해 주세요.",
  disabled: "사용이 중지된 계정입니다. 시스템 관리자에게 문의해 주세요.",
  test: "이 환경에서는 테스트 로그인을 사용할 수 없습니다.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isConfigured = Boolean(getSupabasePublicEnv());
  const showTestAdminLogin = Boolean(getTestLoginPassword());
  const showTestReporterLogin = Boolean(getTestReporterCredentials());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 text-sm text-blue-800 hover:underline">← 서비스 소개</Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-800">기관 내부 사용자</p>
          <h1 className="mt-2 text-2xl font-bold">로그인</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">기관에서 발급한 계정으로 접속해 주세요.</p>
        </div>

        {params.setup === "1" || !isConfigured ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
            Supabase 연결 설정이 필요합니다. 개발자는 `.env.local`에 프로젝트 URL과 publishable key를 추가한 뒤 서버를 다시 시작해 주세요.
          </div>
        ) : null}

        {params.error && loginErrors[params.error] ? (
          <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {loginErrors[params.error]}
          </p>
        ) : null}

        <form action={signIn} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">기관 이메일</label>
            <input id="email" name="email" type="email" autoComplete="username" required disabled={!isConfigured} className="min-h-12 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">비밀번호</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!isConfigured} className="min-h-12 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </div>
          <button type="submit" disabled={!isConfigured} className="min-h-12 w-full rounded-lg bg-blue-900 px-4 font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-400">
            로그인
          </button>
        </form>
        {showTestReporterLogin || showTestAdminLogin ? (
          <div className="mt-2 flex justify-center gap-3">
            {showTestReporterLogin ? (
              <form action={signInAsTestReporter}>
                <button type="submit" className="min-h-9 cursor-pointer rounded px-3 text-xs text-gray-600 [zoom:0.75] hover:underline focus-visible:outline-2">
                  신고자 계정으로 로그인
                </button>
              </form>
            ) : null}
            {showTestAdminLogin ? (
              <form action={signInAsTestAdmin}>
                <button type="submit" className="min-h-9 cursor-pointer rounded px-3 text-xs text-gray-600 [zoom:0.75] hover:underline focus-visible:outline-2">
                  관리자 계정으로 로그인
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
          계정 생성과 비밀번호 복구는 기관 계정 운영 절차를 따릅니다. 가입이 필요하면 기관 관리자에게 문의해 주세요.
        </p>
      </section>
    </main>
  );
}
