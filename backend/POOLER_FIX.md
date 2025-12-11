# Pooler 모드 Prisma 오류 해결 방법

## 문제
Supabase Pooler 모드(포트 6543)에서 Prisma를 사용할 때 "prepared statement already exists" 오류가 발생합니다.

## 해결 방법

### 방법 1: Transaction 모드로 변경 (권장)

1. Supabase 대시보드 → Settings → Database
2. Connection string 섹션 → URI 탭
3. **Transaction mode** 연결 문자열 복사
4. `.env` 파일의 `DATABASE_URL`을 Transaction mode 연결 문자열로 변경

**Transaction mode 형식:**
```
DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

변경 후:
```bash
npm run prisma:seed
```

### 방법 2: Prisma Studio 사용

Prisma Studio는 Pooler 모드에서도 작동합니다:

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 접속하여 데이터를 수동으로 추가할 수 있습니다.

### 방법 3: 직접 연결 사용 (비권장)

Supabase의 직접 연결을 사용할 수도 있지만, IP 제한이 있을 수 있습니다:

```
DATABASE_URL="postgresql://postgres:비밀번호@db.프로젝트ID.supabase.co:5432/postgres"
```

## 현재 상태

- ✅ 데이터베이스 연결: 성공
- ✅ 테이블 생성: 완료 (users, teams, team_members, events)
- ⚠️  Seed 데이터: Pooler 모드 오류로 인해 대기 중

## 다음 단계

1. Transaction mode로 연결 문자열 변경
2. `npm run prisma:seed` 실행하여 초기 데이터 생성
3. 또는 Prisma Studio를 사용하여 수동으로 데이터 추가

