-- Enum 타입만 추가하는 SQL
-- supabase_migration.sql을 이미 실행했다면 이 파일만 실행하세요

-- 기존 테이블이 있다면 컬럼 타입 변경 전에 먼저 데이터 확인
-- (기존 데이터가 있으면 먼저 백업하세요)

-- 1. Enum 타입 생성 (이미 존재하면 건너뜀)
DO $$ 
BEGIN
    -- UserRole 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');
    END IF;
    
    -- UserStatus 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    
    -- TeamRole 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TeamRole') THEN
        CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'MEMBER');
    END IF;
    
    -- EventType 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
        CREATE TYPE "EventType" AS ENUM ('VACATION', 'MEETING', 'OTHER');
    END IF;
END $$;

-- 2. 기존 테이블이 있다면 타입 변경 (데이터가 없을 경우)
-- 주의: 기존 데이터가 있으면 먼저 마이그레이션해야 합니다

-- users 테이블 타입 변경
DO $$ 
BEGIN
    -- role 컬럼 변경 (DEFAULT 제거 후 타입 변경, 다시 DEFAULT 추가)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'character varying') THEN
        ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::"UserRole";
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'MEMBER'::"UserRole";
    END IF;
    
    -- status 컬럼 변경
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status' AND data_type = 'character varying') THEN
        ALTER TABLE users ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE users ALTER COLUMN status TYPE "UserStatus" USING status::"UserStatus";
        ALTER TABLE users ALTER COLUMN status SET DEFAULT 'PENDING'::"UserStatus";
    END IF;
END $$;

-- team_members 테이블 타입 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'role' AND data_type = 'character varying') THEN
        ALTER TABLE team_members ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE team_members ALTER COLUMN role TYPE "TeamRole" USING role::"TeamRole";
        ALTER TABLE team_members ALTER COLUMN role SET DEFAULT 'MEMBER'::"TeamRole";
    END IF;
END $$;

-- events 테이블 타입 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'eventType' AND data_type = 'character varying') THEN
        ALTER TABLE events ALTER COLUMN "eventType" TYPE "EventType" USING "eventType"::"EventType";
    END IF;
END $$;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Enum 타입이 생성/변경되었습니다!';
    RAISE NOTICE '다음 단계: npm run prisma:seed';
END $$;

