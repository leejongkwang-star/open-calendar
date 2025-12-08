-- 초기 데이터 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 관리자 계정 생성 (비밀번호: admin123)
-- 주의: 실제 비밀번호는 bcrypt로 해시화되어야 하므로
-- 이 스크립트는 임시로 사용하며, 애플리케이션에서는 bcrypt를 사용합니다

-- 먼저 비밀번호를 bcrypt로 해시화해야 합니다
-- Node.js에서: const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));

-- 임시로 일반 텍스트로 저장 (실제 환경에서는 bcrypt 사용)
-- 실제 사용 시 애플리케이션의 seed 스크립트를 사용하는 것을 권장합니다

-- 사용자 데이터는 애플리케이션의 seed 스크립트를 통해 생성하는 것이 안전합니다
-- Prisma seed는 bcrypt로 비밀번호를 암호화하여 저장합니다

-- 참고: 이 파일은 참고용이며, 실제 데이터 생성은 npm run prisma:seed를 사용하세요
-- Pooler 모드 문제 해결 후 seed 스크립트를 실행하세요

