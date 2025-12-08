# Supabase 데이터베이스 스키마 설정 가이드

## 방법 1: SQL Editor에서 직접 실행 (권장)

1. Supabase 프로젝트 대시보드 접속
2. 왼쪽 사이드바에서 **SQL Editor** 클릭
3. **New query** 클릭
4. `supabase_migration.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭 (또는 `Ctrl + Enter`)
6. 실행 완료 확인

## 방법 2: Prisma 마이그레이션 사용

Prisma를 사용하여 스키마를 생성하는 것이 더 안전하고 관리하기 쉽습니다.

### 1. Prisma 클라이언트 생성

```bash
cd 캘린더백엔드
npm install
npm run prisma:generate
```

### 2. 마이그레이션 생성 및 실행

```bash
# 마이그레이션 파일 생성 및 실행
npm run prisma:migrate

# 마이그레이션 이름 입력 (예: init)
```

이 명령은:
- `prisma/migrations/` 폴더에 마이그레이션 파일 생성
- 데이터베이스에 테이블 생성
- Prisma Client 생성

### 3. 초기 데이터 시드 (선택)

```bash
npm run prisma:seed
```

이 명령은 테스트 계정을 생성합니다:
- 관리자: 직원번호 `ADM001`, 비밀번호 `admin123`
- 일반 사용자: 직원번호 `USR001`, 비밀번호 `user123`

## 생성되는 테이블

### 1. users (사용자)
- 직원번호, 비밀번호, 이름
- 역할 (ADMIN, MEMBER)
- 승인 상태 (PENDING, APPROVED, REJECTED)
- 승인 정보 (승인일, 승인자, 거부 사유)

### 2. teams (팀)
- 팀 이름, 설명
- 생성자 정보

### 3. team_members (팀 구성원)
- 팀-사용자 관계
- 직책, 전화번호
- 팀 내 권한 (ADMIN, MEMBER)

### 4. events (이벤트)
- 일정 제목, 설명
- 시작일/종료일, 시작/종료 시간
- 일정 유형 (휴가, 회의, 기타)
- 사용자 및 팀 정보

## 주의사항

1. **비밀번호 암호화**: `supabase_migration.sql`의 초기 관리자 계정은 실제로 사용하지 마세요. 애플리케이션의 seed 스크립트를 사용하세요.

2. **외래키 제약조건**: 
   - 사용자 삭제 시 관련 데이터는 CASCADE로 삭제됩니다
   - 팀 삭제 시 구성원과 이벤트도 함께 삭제됩니다

3. **인덱스**: 자주 조회하는 필드에 인덱스가 생성되어 있습니다.

4. **트리거**: `updatedAt` 필드는 자동으로 업데이트됩니다.

## 문제 해결

### 마이그레이션 실패 시

1. **테이블이 이미 존재하는 경우**:
   - `supabase_migration.sql`의 `CREATE TABLE IF NOT EXISTS` 구문 사용
   - 또는 Prisma 마이그레이션 사용

2. **권한 오류**:
   - Supabase 프로젝트의 Database → Settings에서 권한 확인
   - Service Role 키 사용 (개발 환경)

3. **연결 오류**:
   - `.env` 파일의 `DATABASE_URL` 확인
   - Supabase 대시보드의 연결 문자열 재확인

## 다음 단계

스키마 생성 후:
1. `.env` 파일 설정 확인
2. `npm run prisma:generate` 실행
3. `npm run prisma:seed` 실행 (초기 데이터)
4. `npm run dev` 실행 (서버 시작)




