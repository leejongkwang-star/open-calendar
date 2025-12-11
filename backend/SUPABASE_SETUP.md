# Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. 계정 생성 (GitHub 계정으로 로그인 가능)
3. "New Project" 버튼 클릭

## 2. 프로젝트 정보 입력

### 필수 정보
- **Organization**: 조직 선택 (없으면 "New Organization" 생성)
- **Project Name**: 프로젝트 이름 (예: `calendar-app`)
- **Database Password**: 데이터베이스 비밀번호 설정
  - ⚠️ 중요: 이 비밀번호는 프로젝트 생성 후 확인할 수 없습니다!
  - 복잡한 비밀번호 생성 후 안전한 곳에 저장하세요
- **Region**: 가장 가까운 지역 선택
  - 한국: `Northeast Asia (Seoul)` 또는 `Southeast Asia (Singapore)`
- **Pricing Plan**: Free Plan 선택

## 3. 프로젝트 생성 대기

- 프로젝트 생성에 약 1-2분 소요됩니다
- 생성 완료 알림을 기다립니다

## 4. 연결 문자열 가져오기

### 방법 1: Settings에서 가져오기 (권장)

1. 프로젝트 대시보드에서 왼쪽 사이드바의 **Settings** (톱니바퀴 아이콘) 클릭
2. **Database** 메뉴 클릭
3. 페이지 아래쪽으로 스크롤하여 **Connection string** 섹션 찾기
4. **URI** 탭 선택
5. 연결 문자열 복사

### 연결 문자열 형식

**Pooler mode (권장, 포트 6543):**
```
postgresql://postgres.[프로젝트-REF]:[비밀번호]@aws-0-[지역].pooler.supabase.com:6543/postgres
```

**Transaction mode (직접 연결, 포트 5432):**
```
postgresql://postgres.[프로젝트-REF]:[비밀번호]@aws-0-[지역].pooler.supabase.com:5432/postgres
```

**예시:**
```
postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 방법 2: Connection Pooling 섹션에서 가져오기

1. Settings → Database
2. **Connection Pooling** 섹션 확인
3. **Session mode** 또는 **Transaction mode** 선택
4. 연결 문자열 복사

## 5. .env 파일 설정

1. `캘린더백엔드` 폴더에 `.env` 파일 생성
2. 다음 내용 추가:

```env
DATABASE_URL="위에서 복사한 연결 문자열"
```

**주의사항:**
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요할 수 있습니다
- 연결 문자열 전체를 따옴표로 감싸주세요

## 6. 연결 테스트

```bash
cd 캘린더백엔드
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션이 성공하면 연결이 정상입니다!

## 문제 해결

### 연결 실패 시

1. **비밀번호 확인**: 프로젝트 생성 시 설정한 Database Password가 맞는지 확인
2. **연결 문자열 형식 확인**: URI 형식이 올바른지 확인
3. **방화벽**: Supabase 대시보드에서 IP 제한이 있는지 확인
4. **Pooler vs Direct**: 다른 모드(Pooler/Transaction)로 시도

### 비밀번호 분실 시

Supabase에서는 Database Password를 확인할 수 없습니다. 다음 중 선택:

1. **Reset Database Password**: 
   - Settings → Database → Reset database password
   - 새 비밀번호 설정 후 연결 문자열 업데이트

2. **새 프로젝트 생성** (초기 단계인 경우)

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs/guides/database)
- [Prisma + Supabase 가이드](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-supabase)

