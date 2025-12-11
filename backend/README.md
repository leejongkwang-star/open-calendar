# 팀 캘린더 앱 - 백엔드

부서원들 간 휴가 및 기타 일정을 공유할 수 있는 웹 기반 캘린더 애플리케이션의 백엔드 API입니다.

## 기술 스택

- **Node.js**: 런타임 환경
- **Express.js**: 웹 프레임워크
- **Prisma**: ORM (데이터베이스 관리)
- **PostgreSQL**: 데이터베이스
- **JWT**: 인증 토큰
- **bcryptjs**: 비밀번호 암호화

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example.txt` 파일을 참고하여 `.env` 파일을 생성하고 데이터베이스 연결 정보를 입력하세요:

**Windows:**
```powershell
Copy-Item env.example.txt .env
```

**Linux/Mac:**
```bash
cp env.example.txt .env
```

`.env` 파일 수정:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/calendar_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

### 3. 데이터베이스 설정

#### 옵션 1: Supabase 사용 (무료, 권장)

1. [Supabase](https://supabase.com) 접속 및 계정 생성
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 정보 입력:
   - Database Password 설정 (중요!)
   - Region 선택
4. 프로젝트 생성 완료 대기
5. Settings → Database → Connection string → URI 탭에서 연결 문자열 복사
6. `.env` 파일의 `DATABASE_URL`에 붙여넣기

**연결 문자열 형식:**
```
postgresql://postgres.[프로젝트-REF]:[비밀번호]@aws-0-[지역].pooler.supabase.com:6543/postgres
```

#### 옵션 2: 로컬 PostgreSQL

1. PostgreSQL 설치
2. 데이터베이스 생성:
```sql
CREATE DATABASE calendar_db;
```
3. `.env` 파일의 `DATABASE_URL` 설정

### 4. Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 실행
npm run prisma:migrate
```

### 5. 서버 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/auth/check-employee-number` - 직원번호 중복 확인
- `GET /api/auth/pending` - 승인 대기 사용자 목록 (관리자)
- `POST /api/auth/approve/:userId` - 사용자 승인 (관리자)
- `POST /api/auth/reject/:userId` - 사용자 거부 (관리자)

### 이벤트
- `GET /api/events` - 이벤트 목록 조회
- `POST /api/events` - 이벤트 생성
- `GET /api/events/:id` - 이벤트 상세 조회
- `PUT /api/events/:id` - 이벤트 수정
- `DELETE /api/events/:id` - 이벤트 삭제

### 팀
- `GET /api/teams` - 팀 목록 조회
- `POST /api/teams` - 팀 생성
- `GET /api/teams/:id` - 팀 상세 조회
- `PUT /api/teams/:id` - 팀 수정
- `DELETE /api/teams/:id` - 팀 삭제

### 구성원
- `GET /api/teams/:teamId/members` - 구성원 목록 조회
- `POST /api/teams/:teamId/members` - 구성원 추가
- `PUT /api/teams/:teamId/members/:memberId` - 구성원 수정
- `DELETE /api/teams/:teamId/members/:memberId` - 구성원 삭제
- `PATCH /api/teams/:teamId/members/:memberId/role` - 구성원 권한 변경

## 데이터베이스 관리

### Prisma Studio 실행
```bash
npm run prisma:studio
```

브라우저에서 데이터베이스 데이터를 시각적으로 확인하고 수정할 수 있습니다.

## 개발 가이드

### 프로젝트 구조

```
백엔드/
├── prisma/
│   ├── schema.prisma      # 데이터베이스 스키마
│   └── seed.js            # 초기 데이터 시드
├── src/
│   ├── routes/            # API 라우트
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── teams.js
│   ├── middleware/        # 미들웨어
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/             # 유틸리티
│   │   └── database.js
│   └── server.js           # 서버 진입점
├── .env                    # 환경 변수
├── package.json
└── README.md
```

## 무료 호스팅 옵션

### 데이터베이스
- **Supabase**: PostgreSQL 무료 호스팅 (500MB)
- **Neon**: PostgreSQL 무료 호스팅
- **Railway**: 무료 크레딧으로 DB 호스팅

### 백엔드
- **Render**: 무료 티어 (느리지만 무료)
- **Railway**: 무료 크레딧 $5/월
- **Fly.io**: 무료 티어

