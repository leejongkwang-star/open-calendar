# 배포 롤백 가이드 (Rollback Guide)

**작성일**: 2025-12-19  
**프로젝트**: 팀 캘린더 애플리케이션

---

## 📋 목차

1. [롤백이 필요한 경우](#롤백이-필요한-경우)
2. [Vercel (프론트엔드) 롤백](#vercel-프론트엔드-롤백)
3. [Render (백엔드) 롤백](#render-백엔드-롤백)
4. [전체 롤백 프로세스](#전체-롤백-프로세스)
5. [롤백 후 확인사항](#롤백-후-확인사항)

---

## ⚠️ 롤백이 필요한 경우

- 배포 후 심각한 버그 발견
- 기능이 정상 작동하지 않음
- 성능 문제 발생
- 데이터베이스 연결 오류
- API 엔드포인트 오류

---

## 🔄 Vercel (프론트엔드) 롤백

### 방법 1: Deployment History에서 이전 배포로 롤백 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - 로그인 후 프로젝트 선택

2. **Deployments 탭으로 이동**
   - 프로젝트 페이지에서 상단 메뉴의 **"Deployments"** 클릭

3. **이전 배포 버전 찾기**
   - 배포 목록에서 정상 작동했던 이전 배포 찾기
   - 배포 상태가 **"Ready"**인 것을 확인

4. **롤백 실행**
   - 롤백하고 싶은 배포 항목의 **"⋯"** (점 3개) 메뉴 클릭
   - **"Promote to Production"** 선택
   - 확인 대화상자에서 **"Promote"** 클릭

5. **롤백 확인**
   - 배포 상태가 업데이트되는지 확인
   - 몇 초 후 프론트엔드 URL에서 정상 작동 확인

### 방법 2: Git 커밋으로 롤백

1. **로컬에서 이전 커밋 확인**
   ```bash
   cd frontend
   git log --oneline
   ```

2. **이전 커밋으로 되돌리기 (임시)**
   ```bash
   # 이전 커밋 해시 복사 (예: abc1234)
   git checkout abc1234
   ```

3. **Vercel에 수동 배포 또는 Git Push**
   - 이전 커밋을 임시 브랜치로 푸시
   ```bash
   git checkout -b rollback-temp
   git push origin rollback-temp
   ```
   - Vercel 대시보드에서 해당 브랜치 선택 후 배포

### 방법 3: 환경 변수 롤백 (환경 변수 문제인 경우)

1. **Vercel 대시보드 → Settings → Environment Variables**
2. 이전 환경 변수 값으로 복원
3. 새 배포 트리거 (변경사항 커밋 & 푸시)

---

## 🔄 Render (백엔드) 롤백

### 방법 1: Manual Deploy로 이전 배포 재배포 (권장)

1. **Render 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인 후 서비스 선택

2. **Manual Deploy 옵션 사용**
   - 서비스 페이지에서 **"Manual Deploy"** 버튼 클릭
   - **"Deploy latest commit"** 또는 **"Clear build cache & deploy"** 선택

3. **Git 커밋 히스토리 확인**
   - **"Events"** 탭에서 이전 배포 커밋 확인
   - 정상 작동했던 커밋 해시 기록

### 방법 2: Git 태그/브랜치로 롤백

1. **로컬에서 이전 커밋 확인**
   ```bash
   cd backend
   git log --oneline
   ```

2. **이전 커밋으로 롤백 브랜치 생성**
   ```bash
   # 이전 커밋 해시 복사 (예: def5678)
   git checkout -b rollback-backend def5678
   git push origin rollback-backend
   ```

3. **Render에서 브랜치 변경**
   - Render 대시보드 → Settings → Build & Deploy
   - **"Branch"** 필드를 `rollback-backend`로 변경
   - **"Save Changes"** 클릭
   - 자동으로 재배포 시작

4. **롤백 완료 후 원래 브랜치로 복원**
   - 문제 해결 후 `main` 또는 `master` 브랜치로 다시 변경

### 방법 3: 환경 변수 롤백

1. **Render 대시보드 → Environment**
2. 이전 환경 변수 값으로 복원
3. **"Save Changes"** 클릭 (자동 재배포)

---

## 🔄 전체 롤백 프로세스

### 시나리오 1: 프론트엔드만 롤백

```
1. Vercel 대시보드 접속
2. Deployments → 이전 배포 → "Promote to Production"
3. 프론트엔드 URL에서 확인
```

### 시나리오 2: 백엔드만 롤백

```
1. Render 대시보드 접속
2. Manual Deploy 또는 Git 브랜치 변경
3. API 엔드포인트 테스트
```

### 시나리오 3: 전체 롤백 (프론트엔드 + 백엔드)

```
1. 백엔드 먼저 롤백 (Render)
   - API가 정상 작동하는지 확인
   
2. 프론트엔드 롤백 (Vercel)
   - 프론트엔드가 백엔드와 정상 통신하는지 확인
```

---

## ✅ 롤백 후 확인사항

### 프론트엔드 확인

- [ ] 로그인/회원가입 기능 정상 작동
- [ ] 캘린더 일정 조회 정상
- [ ] 일정 등록/수정/삭제 정상
- [ ] 관리자 페이지 접근 가능
- [ ] 필터링 기능 정상

### 백엔드 확인

- [ ] API 엔드포인트 정상 응답
- [ ] 데이터베이스 연결 정상
- [ ] 인증 토큰 발급 정상
- [ ] CORS 설정 정상
- [ ] 에러 로그 확인

### 통합 확인

- [ ] 프론트엔드 → 백엔드 API 호출 정상
- [ ] 환경 변수 일치 (API URL 등)
- [ ] 데이터 동기화 정상

---

## 🚨 롤백 시 주의사항

1. **데이터베이스 마이그레이션**
   - 롤백 시 데이터베이스 스키마가 변경되었을 경우 주의
   - Prisma 마이그레이션을 되돌려야 할 수 있음

2. **환경 변수 호환성**
   - 롤백하는 버전과 현재 환경 변수가 호환되는지 확인
   - API URL, 데이터베이스 URL 등 확인

3. **의존성 버전**
   - package.json의 의존성 버전이 롤백 버전과 일치하는지 확인

4. **백업 확인**
   - 데이터베이스 백업이 있는지 확인
   - 롤백 전 현재 상태 백업 권장

---

## 📝 롤백 기록 예시

```
롤백 일시: 2025-12-19 14:30
롤백 사유: 일정 등록 시 시간대 오류 발생
롤백 대상: 프론트엔드 (Vercel)
이전 배포: Deployment #123 (Commit: abc1234)
현재 배포: Deployment #124 (Commit: def5678) → 롤백
결과: 정상 작동 확인
```

---

## 🔗 관련 문서

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 가이드
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 배포 상세 가이드
- [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) - Render 배포 상세 가이드

---

## 💡 빠른 롤백 체크리스트

### Vercel (프론트엔드)
- [ ] Vercel 대시보드 → Deployments
- [ ] 이전 배포 → "Promote to Production"
- [ ] 배포 상태 확인
- [ ] 프론트엔드 URL 테스트

### Render (백엔드)
- [ ] Render 대시보드 → Services
- [ ] Manual Deploy 또는 브랜치 변경
- [ ] 배포 로그 확인
- [ ] API 엔드포인트 테스트

---

**참고**: 롤백 후 문제가 해결되지 않으면, 로컬에서 이전 버전을 확인하고 문제를 수정한 후 다시 배포하세요.

