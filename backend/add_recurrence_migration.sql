-- 반복 일정 기능 추가 마이그레이션
-- Supabase SQL Editor에서 실행하거나, 로컬에서 `npx prisma db push`로 적용하세요.

-- events 테이블에 반복 일정 묶음 식별자 컬럼 추가
ALTER TABLE events
ADD COLUMN IF NOT EXISTS "recurrenceGroupId" TEXT;

-- 반복 일정 묶음 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_events_recurrence_group
ON events("recurrenceGroupId");
