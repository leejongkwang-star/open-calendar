# CORS 오류 해결 방법

## 문제
프론트엔드에서 백엔드 API 호출 시 "Network Error" 또는 CORS 오류가 발생합니다.

## 원인
백엔드의 CORS 설정이 프론트엔드 URL과 일치하지 않습니다.

## 해결 방법

### 1. .env 파일 수정

`캘린더백엔드/.env` 파일을 열고 다음 줄을 찾아서:

```env
CORS_ORIGIN="http://localhost:3000"
```

다음과 같이 변경하세요:

```env
CORS_ORIGIN="http://localhost:5173"
```

### 2. 백엔드 서버 재시작

1. 백엔드 서버가 실행 중인 터미널에서 `Ctrl + C`로 서버를 중지합니다.
2. 다시 실행합니다:
   ```bash
   npm run dev
   ```

### 3. 확인

서버가 재시작되면 프론트엔드 페이지를 새로고침하고 로그인을 다시 시도하세요.

## 참고

- 프론트엔드 포트: 5173 (Vite 기본 포트)
- 백엔드 포트: 3001
- CORS 설정은 백엔드 서버 재시작 후에만 적용됩니다.

## 여러 프론트엔드 포트 허용 (선택사항)

개발 중 여러 포트를 사용하는 경우, 다음과 같이 설정할 수 있습니다:

```javascript
// src/server.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  credentials: true,
}))
```

또는 모든 origin 허용 (개발 환경만):

```javascript
app.use(cors({
  origin: true,  // 모든 origin 허용
  credentials: true,
}))
```

