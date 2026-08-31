# 부서별 신규 인스턴스 개설 절차

코드베이스는 하나이고, 부서별로 **DB / 백엔드 서비스 / 프론트엔드 배포**를 따로 둡니다.
데이터와 인증이 완전히 분리되며, 기능 개발은 한 번만 하면 양쪽에 반영됩니다.

```
저장소 1개
├── Cloud Run: calendar-backend         → Supabase DB (카드운영부)   → Vercel 프로젝트 A
└── Cloud Run: calendar-backend-common  → Supabase DB (공통업무지원부) → Vercel 프로젝트 B
```

이 문서는 공통업무지원부를 예로 들지만, 세 번째 부서도 같은 절차를 따릅니다.

## 고정 값

| 항목 | 값 |
|------|-----|
| GCP 프로젝트 | `open-calendar-481005` |
| 리전 | `asia-northeast3` |
| 이미지 | `asia-northeast3-docker.pkg.dev/open-calendar-481005/calendar-backend/calendar-backend` |
| 신규 서비스명 | `calendar-backend-common` |

## 현재 배포 현황

| 부서 | Cloud Run | 프론트엔드 |
|------|-----------|-----------|
| 카드운영부 | `calendar-backend` | https://open-calendar-frontend.vercel.app |
| 공통업무지원부 | `calendar-backend-common`<br/>https://calendar-backend-common-750665560932.asia-northeast3.run.app | https://open-calendar-common.vercel.app |

두 부서 모두 Vercel Hobby 플랜에서 동작합니다(프로젝트 200개, 저장소당 25개 한도).
단 Hobby 는 동시 배포가 1개라 같은 저장소를 쓰는 두 프로젝트가 순차로 빌드됩니다.

서비스명을 바꾸려면 [.github/workflows/deploy-cloud-run.yml](../.github/workflows/deploy-cloud-run.yml)의 `matrix.include`도 함께 수정해야 합니다.

---

## 0. (최초 1회) 기존 카드운영부 DB 베이스라인 처리

DB가 2개가 되므로 스키마 이력을 Prisma 마이그레이션으로 관리합니다.
기존 DB에는 이미 테이블이 있으므로, `0_init` 마이그레이션을 **적용된 것으로 표시만** 합니다.
이 작업은 `_prisma_migrations` 메타 테이블만 건드리고 **기존 데이터는 변경하지 않습니다.**

```bash
cd backend

# 기존 DATABASE_URL 의 포트만 5432 로 바꾼 값을 넣는다
export DIRECT_DATABASE_URL="postgresql://postgres.[카드운영부-REF]:[비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

npx prisma migrate resolve --applied 0_init
npm run db:status   # "Database schema is up to date" 확인
```

`db:status`에서 스키마 불일치가 보고되면, 실제 DB와 [prisma/schema.prisma](prisma/schema.prisma)가 어긋난 것입니다.
이 상태로 신규 DB를 만들면 두 부서의 스키마가 달라지므로, 먼저 차이를 해소해야 합니다.

```bash
# 실제 DB 와 스키마 파일의 차이 확인 (읽기 전용)
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

---

## 1. 신규 Supabase DB 생성

1. Supabase에서 새 프로젝트 생성 (리전은 `ap-northeast-2` 권장)
2. 접속 문자열 2개를 확보합니다.

| 용도 | 위치 | 포트 |
|------|------|------|
| 런타임 (`DATABASE_URL`) | Connection string → **Transaction pooler** | 6543 |
| 마이그레이션 (`DIRECT_DATABASE_URL`) | Connection string → **Session pooler** | 5432 |

두 문자열은 **포트만 다릅니다**(6543 → 5432). 호스트와 사용자명은 동일하므로,
런타임 URL 의 포트만 바꿔 쓰면 됩니다.

```
# 런타임
postgresql://postgres.[REF]:[비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
# 마이그레이션 (포트만 5432)
postgresql://postgres.[REF]:[비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

트랜잭션 모드(6543)는 prepared statement 를 지원하지 않아 마이그레이션이 멈출 수 있고,
세션 모드(5432)는 일반 Postgres 연결처럼 동작해 DDL 에 적합합니다.
`db.[REF].supabase.co` 형태의 Direct connection 은 최근 생성한 프로젝트에서 **DNS 에 아예 없는 경우가 있습니다**
(A/AAAA 레코드 모두 없음). 세션 풀러를 쓰면 이 문제를 피할 수 있습니다.

리전 풀러 접두어(`aws-0` / `aws-1`)는 **프로젝트마다 다릅니다.** 같은 서울 리전이라도 다를 수 있으니
Supabase 화면에 표시된 호스트를 그대로 사용하세요.
이 분리는 [prisma/schema.prisma](prisma/schema.prisma)의 `directUrl` 설정으로 처리됩니다.

## 2. 신규 DB에 스키마 적용

```bash
cd backend

export DATABASE_URL="<공통업무지원부 pooler URL (6543)>"
export DIRECT_DATABASE_URL="<공통업무지원부 direct URL (5432)>"

npm run db:deploy   # prisma migrate deploy
npm run db:status
```

적용 후 확인 (테이블 7개, `GameType`에 `GALAGA` 포함):

```bash
npx prisma studio
```

> 주의: `prisma db push`와 `prisma/seed.js`는 사용하지 않습니다.
> `db push`는 마이그레이션 이력을 남기지 않아 부서 간 스키마가 어긋나고,
> `seed.js`는 `admin123` 같은 약한 비밀번호와 샘플 데이터를 만듭니다.

## 3. Cloud Run 신규 서비스 생성

GitHub Actions는 **환경변수를 설정하지 않습니다.** 최초 생성만 아래처럼 수동으로 하고,
이후 배포는 워크플로가 이미지만 교체합니다.
아직 개설되지 않은 부서는 워크플로가 경고만 남기고 건너뛰므로, 서비스 생성 전에도 CI는 정상입니다.

```bash
# 부서별로 반드시 다른 JWT_SECRET 을 쓴다 (한쪽 토큰이 다른 쪽에서 통하면 안 됨)
JWT_SECRET=$(openssl rand -base64 32)

gcloud run deploy calendar-backend-common \
  --image asia-northeast3-docker.pkg.dev/open-calendar-481005/calendar-backend/calendar-backend:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300s \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=<공통업무지원부 pooler URL>,JWT_SECRET=${JWT_SECRET},CORS_ORIGIN=https://<신규 프론트 도메인>"
```

`PORT` 는 Cloud Run 예약 변수라 `--set-env-vars` 로 지정하면 배포가 거부됩니다.
런타임 포트는 Cloud Run 이 자동으로 주입하고, [Dockerfile](Dockerfile) 의 기본값(8080)과 일치합니다.
`JWT_EXPIRES_IN` 을 생략하면 코드 기본값 `7d` 가 적용됩니다.

`CORS_ORIGIN`은 5번에서 프론트 도메인이 확정된 뒤 다시 설정해도 됩니다.

```bash
gcloud run services update calendar-backend-common \
  --region asia-northeast3 \
  --update-env-vars "CORS_ORIGIN=https://<신규 프론트 도메인>"
```

배포된 백엔드 URL 확인:

```bash
gcloud run services describe calendar-backend-common \
  --region asia-northeast3 --format 'value(status.url)'
```

## 4. 최초 관리자 생성

빈 DB에는 관리자가 없습니다. 팀 생성과 가입 승인은 관리자 권한이 필요하므로 1명을 먼저 만듭니다.

```bash
cd backend
export DATABASE_URL="<공통업무지원부 pooler URL>"

ADMIN_EMPLOYEE_NUMBER=ADM001 \
ADMIN_NAME=관리자 \
ADMIN_PASSWORD='<12자 이상 강한 비밀번호>' \
npm run bootstrap:admin
```

스크립트는 대상 DB를 마스킹해 출력하고, 이미 관리자가 있으면 중단합니다.
실행 직전에 출력된 호스트가 신규 DB인지 반드시 확인하세요.

이후 팀 생성과 구성원 초대는 관리자 화면(`/admin`)에서 정상 흐름으로 진행합니다.

## 5. Vercel 신규 프로젝트 생성

같은 저장소를 연결하고 Root Directory를 `frontend`로 지정합니다.

| 환경변수 | 값 |
|----------|-----|
| `VITE_API_BASE_URL` | `https://calendar-backend-common-<...>.run.app/api` |
| `VITE_DEPT_NAME` | `공통업무지원부` |

- `VITE_API_BASE_URL`에는 **`/api`까지 포함**해야 합니다. 백엔드 라우트가 `/api/*`로 마운트되어 있습니다.
- Vite는 빌드 시점에 환경변수를 치환하므로, 값을 바꾸면 **재배포**가 필요합니다.
- 기존 카드운영부 프로젝트에도 `VITE_DEPT_NAME=카드운영부`를 추가해 설정 형태를 통일합니다.

## 6. 검증

| 항목 | 확인 방법 | 기대 결과 |
|------|-----------|-----------|
| 인증 분리 | 카드운영부 계정으로 공통업무지원부 도메인 로그인 | 실패 (사번이 신규 DB에 없음) |
| 토큰 분리 | 카드운영부 토큰을 공통업무지원부 API에 사용 | 401 (JWT_SECRET 이 다름) |
| 일정 분리 | 한쪽에서 일정 등록 후 다른 쪽 캘린더 확인 | 노출되지 않음 |
| 랭킹/단식 분리 | 게임 점수 등록 후 상대 부서 랭킹 확인 | 노출되지 않음 |
| 브랜딩 | 로그인 화면 제목, 헤더, PWA 설치 이름 | 각 부서명으로 표시 |
| 배포 | `backend/**` 수정 후 push | 두 서비스 모두 갱신 |
| CORS | 각 프론트에서 API 호출 | 차단 없음 |

## 이후 스키마 변경 절차

부서가 늘어난 뒤에는 **모든 부서 DB에 같은 마이그레이션을 적용**해야 합니다.

```bash
# 1. 개발 환경에서 마이그레이션 생성 (schema.prisma 수정 후)
npx prisma migrate dev --name <변경_내용>

# 2. 생성된 prisma/migrations/* 를 커밋

# 3. 부서별로 순서대로 적용
export DATABASE_URL=... DIRECT_DATABASE_URL=...   # 카드운영부
npm run db:deploy

export DATABASE_URL=... DIRECT_DATABASE_URL=...   # 공통업무지원부
npm run db:deploy
```

`prisma/migrations/`는 의도적으로 커밋합니다. 여러 DB의 스키마를 맞추는 유일한 근거이기 때문입니다.

## 주의사항

- **JWT_SECRET은 부서별로 반드시 다르게** 설정합니다. 같으면 한쪽 토큰으로 다른 쪽 API를 호출할 수 있습니다.
- 사번(`employeeNumber`)은 DB별로 유일합니다. 같은 사람이 부서별로 각각 계정을 가질 수 있고, 부서 간 통합 조회는 불가능합니다.
- 백엔드 배포는 두 서비스에 동시에 적용됩니다. 부서별로 다른 버전이 필요하면 이미지 태그 전략을 분리해야 합니다.
- 시크릿은 `.env`와 Cloud Run 환경변수에만 둡니다. `env.example.txt` 같은 커밋 대상 파일에 실제 값을 넣지 않습니다.
