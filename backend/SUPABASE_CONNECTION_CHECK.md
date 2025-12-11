# Supabase 데이터베이스 연결 확인 가이드

## 현재 문제

데이터베이스 서버에 연결할 수 없습니다. 연결 문자열 형식이 잘못되었을 가능성이 높습니다.

## 해결 방법

### 1. Supabase 대시보드에서 올바른 연결 문자열 가져오기

1. [Supabase](https://supabase.com) 접속
2. 프로젝트 선택
3. 왼쪽 사이드바 → **Settings** (⚙️ 아이콘) 클릭
4. **Database** 메뉴 클릭
5. 페이지 아래로 스크롤 → **Connection string** 섹션
6. **URI** 탭 선택
7. **Session mode** 또는 **Transaction mode** 연결 문자열 복사

### 2. .env 파일 수정

`캘린더백엔드/.env` 파일을 열고 `DATABASE_URL`을 수정하세요:

**현재 (잘못된 형식):**
```env
DATABASE_URL= "postgresql://postgres:비밀번호@db.프로젝트ID.supabase.co:5432/postgres"
```

**올바른 형식 (Pooler 모드 - 권장):**
```env
DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

**또는 (Transaction mode):**
```env
DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

### 3. 연결 테스트

수정 후 다음 명령으로 확인:
```bash
cd 캘린더백엔드
node check-db.js
```

### 4. 데이터베이스 스키마 적용

연결이 성공하면, Supabase SQL Editor에서 스키마를 적용하세요:

1. Supabase 대시보드 → 왼쪽 사이드바 → **SQL Editor**
2. **New query** 클릭
3. `supabase_migration.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭

또는 Prisma 마이그레이션 사용:
```bash
cd 캘린더백엔드
npm run prisma:migrate
```

## 중요 사항

- ✅ Pooler mode (포트 6543) 권장: 동시 연결 지원
- ✅ 비밀번호에 특수문자가 있으면 URL 인코딩 필요
- ✅ 연결 문자열 전체를 따옴표로 감싸주세요
- ❌ 따옴표 앞에 공백 없어야 합니다

