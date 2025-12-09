-- EventType에 TRAINING, BUSINESS_TRIP 추가 (수정된 버전)
-- Supabase SQL Editor에서 실행하세요

-- EventType ENUM에 새 값 추가
-- 주의: PostgreSQL에서는 ENUM 값 추가가 트랜잭션 내에서 제한적이므로
-- 각 값 추가를 별도로 실행해야 할 수 있습니다.

-- 1. TRAINING 추가
DO $$ 
BEGIN
    -- 이미 존재하는지 확인
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
END $$;

-- 2. BUSINESS_TRIP 추가
DO $$ 
BEGIN
    -- 이미 존재하는지 확인
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

-- 3. 최종 확인
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
    RAISE NOTICE 'EventType enum 업데이트가 완료되었습니다!';
    RAISE NOTICE '다음 단계: 백엔드 서버 재시작';
END $$;

