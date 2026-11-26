# 공공 자산 장애 신고·관제 대시보드

Stitch 화면을 기반으로 만든 Next.js 앱입니다. 신고자 접수·본인 신고 조회, 운영자 신고 검색 및 처리, 관리자 자산 관리 화면을 제공합니다. 인증과 데이터는 Supabase Auth/Postgres를 사용하며 DB 접근은 RLS와 제한된 RPC로 보호합니다.

## 로컬 실행

필요 환경: Node.js 20.9 이상, npm 10 이상.

```powershell
npm ci
npm run dev
```

`.env.example`을 참고해 루트에 `.env.local`을 만들고 Supabase 개발 프로젝트의 URL과 publishable key를 설정합니다. `.env.local`은 Git에서 제외됩니다. secret/service-role 키를 브라우저 설정이나 저장소에 넣지 마세요.

## 확인 명령

```powershell
npm run lint
npm run typecheck
npm run build
```

현재 테스트 러너는 구성되어 있지 않습니다. 개발 Supabase 프로젝트의 스키마는 Dashboard SQL Editor에서 적용했으며, CLI 마이그레이션 이력 정합화 및 역할별 테스트 계정 구성이 후속 과제입니다. 자세한 진행 상태는 [진행 현황](docs/04-구현/진행현황.md), 개발·정책 계획은 [PLAN.md](PLAN.md)를 참고하세요.

## 정적 Stitch 시안

`design/stitch/krds_*/code.html`은 비교용 정적 화면입니다. 실제 앱 라우트나 백엔드 연결은 이 HTML 시안에서 제공하지 않습니다. 시안 목록과 안내는 [design/stitch/README.md](design/stitch/README.md)에 있습니다.
