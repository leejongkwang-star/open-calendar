-- EventType에 TRAINING, BUSINESS_TRIP 추가
-- Supabase SQL Editor에서 실행하세요

-- EventType ENUM에 새 값 추가
DO $$ 
BEGIN
    -- TRAINING 추가 (이미 존재하면 에러 무시)
    BEGIN
        ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'TRAINING';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    -- BUSINESS_TRIP 추가 (이미 존재하면 에러 무시)
    BEGIN
        ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'BUSINESS_TRIP';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'EventType에 TRAINING, BUSINESS_TRIP이 추가되었습니다!';
    RAISE NOTICE '다음 단계: npm run prisma:generate (Prisma Client 재생성)';
END $$;

