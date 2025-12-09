-- EventType CHECK constraint 문제 해결
-- Supabase SQL Editor에서 실행하세요

-- 1. 먼저 기존 CHECK constraint 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'events'::regclass
AND conname LIKE '%eventType%';

-- 2. 기존 CHECK constraint 제거 (있는 경우)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_eventType_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_eventtype_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS "events_eventType_check";

-- 3. EventType ENUM에 TRAINING, BUSINESS_TRIP 추가
DO $$ 
BEGIN
    -- TRAINING 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'TRAINING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EventType')
    ) THEN
        ALTER TYPE "EventType" ADD VALUE 'TRAINING';
        RAISE NOTICE 'TRAINING이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'TRAINING은 이미 존재합니다.';
    END IF;
    
    -- BUSINESS_TRIP 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BUSINESS_TRIP' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EventType')
    ) THEN
        ALTER TYPE "EventType" ADD VALUE 'BUSINESS_TRIP';
        RAISE NOTICE 'BUSINESS_TRIP이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'BUSINESS_TRIP은 이미 존재합니다.';
    END IF;
END $$;

-- 4. 최종 확인 - EventType enum 값들
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'EventType'
ORDER BY e.enumsortorder;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'EventType enum 및 constraint 문제가 해결되었습니다!';
    RAISE NOTICE '다음 단계: 백엔드 서버 재시작';
END $$;

