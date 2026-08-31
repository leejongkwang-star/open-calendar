-- password_reset_requests 를 add_password_reset_requests.sql 로 수동 생성할 때
-- updatedAt 에 DEFAULT CURRENT_TIMESTAMP 가 붙었으나, schema.prisma 의 @updatedAt 은
-- 애플리케이션에서 값을 채우므로 DB 기본값이 없다.
-- 기본값을 남겨두면 부서별 DB 스키마가 어긋나므로 제거한다.
ALTER TABLE "password_reset_requests" ALTER COLUMN "updatedAt" DROP DEFAULT;
