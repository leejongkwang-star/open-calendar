-- Supabase 데이터베이스 스키마 마이그레이션
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 0. Enum 타입 생성 (Prisma와 호환성을 위해)
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "EventType" AS ENUM ('VACATION', 'MEETING', 'OTHER');

-- 1. 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "employeeNumber" VARCHAR(6) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role "UserRole" NOT NULL DEFAULT 'MEMBER',
    status "UserStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP,
    "approvedBy" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_employee_number ON users("employeeNumber");
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 외래키 제약조건 (승인한 관리자)
ALTER TABLE users 
ADD CONSTRAINT fk_users_approved_by 
FOREIGN KEY ("approvedBy") REFERENCES users(id) ON DELETE SET NULL;

-- 2. 팀 테이블 생성
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_teams_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. 팀 구성원 테이블 생성
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    position VARCHAR(255),
    phone VARCHAR(50),
    "profileImageUrl" TEXT,
    role "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_team_members_team FOREIGN KEY ("teamId") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_team_members_team_user UNIQUE ("teamId", "userId")
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members("teamId");
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members("userId");

-- 4. 이벤트 테이블 생성
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "startTime" TIMESTAMP,
    "endTime" TIMESTAMP,
    "eventType" "EventType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_events_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_events_team FOREIGN KEY ("teamId") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT chk_events_date CHECK ("startDate" <= "endDate")
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events("userId");
CREATE INDEX IF NOT EXISTS idx_events_team_id ON events("teamId");
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events("startDate");
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events("endDate");

-- 5. updatedAt 자동 업데이트를 위한 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updatedAt 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 초기 관리자 계정 생성은 하지 않습니다
-- 애플리케이션의 seed 스크립트를 사용하여 생성하세요:
-- npm run prisma:seed

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '데이터베이스 스키마 생성이 완료되었습니다!';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. npm run prisma:generate';
    RAISE NOTICE '2. npm run prisma:seed (초기 데이터 생성)';
END $$;

