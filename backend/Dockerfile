# Node.js 18 LTS 사용
FROM node:18-alpine

# OpenSSL 설치 (Prisma가 필요로 함)
RUN apk add --no-cache openssl

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# Prisma 스키마 파일 복사 (prisma generate를 위해 필요)
COPY prisma ./prisma

# 모든 의존성 설치 (prisma generate를 위해 devDependencies도 필요)
# npm install은 package-lock.json이 없어도 작동하며, 있으면 사용합니다
RUN npm install

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=8080

# 포트 노출 (Cloud Run, App Runner는 PORT 환경 변수 사용)
EXPOSE 8080

# 헬스 체크 추가 (선택사항)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
CMD ["node", "src/server.js"]

