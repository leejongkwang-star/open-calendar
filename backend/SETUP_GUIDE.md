# 백엔드 설정 가이드

## 1. 프로젝트 설정

### 의존성 설치
```bash
cd 백엔드
npm install
```

### 환경 변수 설정
`env.example.txt` 파일을 참고하여 `.env` 파일을 생성하세요.

**Windows에서 .env 파일 생성 방법:**
1. `env.example.txt` 파일을 복사
2. 파일 이름을 `.env`로 변경 (확장자 없음)
3. 내용을 실제 값으로 수정

또는 PowerShell에서:
```powershell
Copy-Item env.example.txt .env
```

**환경 변수 내용:**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/calendar_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

## 2. 데이터베이스 설정

### 옵션 1: Supabase 사용 (무료, 권장)

📖 **상세 가이드**: `SUPABASE_SETUP.md` 파일 참조

**간단한 설정 방법:**

1. [Supabase](https://supabase.com) 접속 및 계정 생성
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Organization 선택 (없으면 생성)
   - Project Name 입력
   - **Database Password 설정** (중요: 저장 필수!)
   - Region 선택 (한국: Seoul 또는 Singapore)
4. 프로젝트 생성 완료 대기 (약 1-2분)
5. 연결 문자열 가져오기:
   - 왼쪽 사이드바 → **Settings** (⚙️ 아이콘)
   - **Database** 메뉴 클릭
   - 페이지 아래로 스크롤 → **Connection string** 섹션
   - **URI** 탭 선택
   - 연결 문자열 복사
6. `.env` 파일에 붙여넣기:
```env
DATABASE_URL="복사한-연결-문자열"
```

**연결 문자열 형식 예시:**
```
postgresql://postgres.[프로젝트-REF]:[비밀번호]@aws-0-[지역].pooler.supabase.com:6543/postgres
```

**참고:**
- Pooler mode (포트 6543): 권장, 동시 연결 지원
- Transaction mode (포트 5432): 직접 연결
- 비밀번호는 프로젝트 생성 시 설정한 Database Password 사용

### 옵션 2: 로컬 PostgreSQL

1. PostgreSQL 설치
2. 데이터베이스 생성:
```sql
CREATE DATABASE calendar_db;
```
3. `.env` 파일 설정:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/calendar_db"
```

### 옵션 3: SQLite (개발용, 간단함)

`prisma/schema.prisma` 파일에서:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

## 3. 데이터베이스 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# 초기 데이터 시드 (선택)
npm run prisma:seed
```

## 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 5. 테스트 계정 (시드 실행 시)

- **관리자**: 직원번호 `ADM001`, 비밀번호 `admin123`
- **일반 사용자**: 직원번호 `USR001`, 비밀번호 `user123`

## 6. API 테스트

서버 실행 후:
- 헬스 체크: `http://localhost:3001/health`
- API 문서: 각 엔드포인트는 `/api/`로 시작

## 7. Prisma Studio

데이터베이스 데이터를 시각적으로 확인:
```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 접속

