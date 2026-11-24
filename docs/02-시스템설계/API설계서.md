# API 설계서

## 1. 개요와 원칙
별도 백엔드 서버는 확정되지 않았다. Supabase Auth/Postgres를 예정 기술로 삼고, 세션을 전달하는 Supabase 클라이언트와 Next.js 서버 액션 또는 DB 함수/RPC를 조합하는 논리 인터페이스 초안이다. 아래 API 경로는 제안이며 이미 구현되어 있지 않다.

- 모든 데이터 요청은 사용자 세션, 역할 검사, RLS를 적용한다.
- 상태와 감사 이력 동시 저장은 트랜잭션이 보장되는 서버 경로에서 처리한다.
- 서비스 역할 키는 브라우저에 포함하지 않는다.
- 모든 날짜는 ISO 8601 시간대 포함 형식을 사용한다.
- 목록 페이지 크기, 검색 대상, 속도 제한 수치는 구현·운영 조건에 맞춰 결정한다.

## 2. 인증 및 권한
Supabase Auth 세션으로 인증한다. 신고자는 신고 생성 및 본인 건·공개 기록 조회, 운영자는 전체 신고 처리, 관리자는 자산·역할·기준 관리 권한을 갖는다. 요청 본문에 담긴 역할 값은 권한 근거로 신뢰하지 않는다. 세션 만료·권한 부족 요청은 거부한다.

## 3. 공통 오류 형식
~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요.",
    "fields": {"title": "제목을 입력해 주세요."}
  }
}
~~~

| 코드 | 의미 |
|---|---|
| UNAUTHENTICATED | 인증 세션 없음/만료 |
| FORBIDDEN | 권한 부족 |
| VALIDATION_ERROR | 필수값 또는 형식 오류 |
| NOT_FOUND | 대상 없음 또는 접근 불가 |
| CONFLICT | 현재 상태가 예상과 다름 |
| INTERNAL_ERROR | 일반 처리 실패 |

내부 SQL, 토큰, 스택 추적은 사용자 응답에 포함하지 않는다.

## 4. 논리 엔드포인트
| 작업 | 제안 경로 | 권한 |
|---|---|---|
| 내 프로필 | GET /api/me | 인증 |
| 활성 자산 조회 | GET /api/assets | 인증 |
| 자산 등록·수정·비활성화 | POST/PATCH /api/assets | 관리자 |
| 신고 목록 | GET /api/incidents | 역할별 접근 범위 |
| 신고 접수 | POST /api/incidents | 신고자 이상 |
| 신고 상세 | GET /api/incidents/{id} | 역할별 접근 범위 |
| 배정·우선순위·기한 변경 | PATCH /api/incidents/{id}/assignment | 운영자 이상 |
| 공개 업데이트·내부 메모 | POST /api/incidents/{id}/updates | 운영자 이상 |
| 상태 전이 | POST /api/incidents/{id}/transitions | 운영자 이상 |
| 대시보드 요약 | GET /api/dashboard | 운영자 이상 |
| 역할 변경 | PATCH /api/users/{id}/role | 관리자 |
| 첨부 업로드 (P1) | POST /api/incidents/{id}/attachments | 승인된 사용자 |

읽기 경로는 Supabase 쿼리로 구현할 수도 있다. 논리 경로를 사용할 경우에도 DB 정책을 우회하지 않는다.

## 5. 주요 계약
### 5.1 신고 생성
요청: assetId 또는 location, title, description, priority, occurredAt. 시스템은 reporterId, incidentNumber, createdAt, received 상태를 설정한다. 성공 응답은 접수 번호·상태·접수 시각을 반환한다. 동일 자산에 미해결 신고가 있으면 유사 신고 안내를 반환해도 생성은 차단하지 않는다. 재시도 중 중복 생성 방지는 서버 검증 또는 idempotency 전략으로 처리한다.

### 5.2 분류 및 조치
배정 요청은 assigneeId, priority, dueAt을 받는다. 업데이트 요청은 visibility(public/internal), body를 받는다. 서버는 역할·값을 확인하고 변경 행과 감사 로그를 일관되게 기록한다. 신고자 응답에는 public 기록만 포함한다.

### 5.3 상태 변경
요청은 targetStatus, 예상 현재 상태(또는 버전), 완료 시 resolutionSummary를 포함한다. 허용 흐름은 received → in_progress → completed다. 완료에는 결과 요약이 필수다. 서버는 최신 상태를 재검증하고 업무 행·완료 시각·감사 로그를 원자적으로 저장한다. 충돌 시 CONFLICT를 반환한다.

### 5.4 목록·필터
상태, 우선순위, 자산/위치, 기간, 검색어, 정렬 후보를 지원한다. 사용자 데이터 범위를 먼저 제한하고 필터 허용값을 검증한다. 페이징·검색 컬럼은 구현 전에 확정한다.

## 6. 보안·변경 관리
RLS 테스트는 타인 신고, 내부 메모, 비인가 변경, 자기 역할 승격 차단을 확인한다. 서버 액션도 역할 검증 테스트를 수행한다. 요청 로그에 증상 전문·토큰 등 민감 정보를 남기지 않는다. API 계약 변경 시 SRS, RTM, 화면 설계를 함께 갱신한다.

참조: [SRS](../01-요구사항분석/요구사항명세서-SRS.md), [DB 설계서](데이터베이스설계서.md), [SAD](시스템아키텍처설계서-SAD.md).

