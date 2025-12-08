# 프론트엔드 서버 실행 가이드

## 서버 시작 방법

### 방법 1: npm 명령어 사용 (권장)

```bash
cd 캘린더프론트엔드
npm run dev
```

### 방법 2: Vite 직접 실행

```bash
cd 캘린더프론트엔드
npx vite
```

## 실행 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
  VITE v5.0.8  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 접속 방법

브라우저에서 다음 URL로 접속하세요:
- http://localhost:5173

## 문제 해결

### 포트가 이미 사용 중인 경우
다른 포트로 실행:
```bash
npx vite --port 5174
```

### 의존성이 설치되지 않은 경우
```bash
npm install
```

### .env 파일 확인
`.env` 파일이 있는지 확인하고, 다음 내용이 포함되어 있는지 확인하세요:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## 백엔드 서버 확인

프론트엔드가 정상 작동하려면 백엔드 서버도 실행 중이어야 합니다:
- 백엔드 서버: http://localhost:3001

백엔드 서버 실행 방법:
```bash
cd 캘린더백엔드
npm run dev
```

