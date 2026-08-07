-- GameType enum에 GALAGA 추가 (PostgreSQL 9.3+)
ALTER TYPE "GameType" ADD VALUE IF NOT EXISTS 'GALAGA';
