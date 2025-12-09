-- EventType enum 현재 값 확인
-- Supabase SQL Editor에서 실행하세요

-- EventType enum의 현재 값들 확인
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
    RAISE NOTICE 'EventType enum 값을 확인했습니다.';
    RAISE NOTICE '현재 값: VACATION, MEETING, OTHER 만 있다면 TRAINING과 BUSINESS_TRIP을 추가해야 합니다.';
END $$;

