# 최종배포준비 버전으로 롤백 가이드

**롤백 대상 커밋**: `190f562` (최종배포준비)  
**롤백 브랜치**: `rollback-to-final-deploy`  
**작성일**: 2025-12-19

---

## ✅ 로컬 롤백 완료

현재 로컬 저장소가 **"최종배포준비"** 커밋(`190f562`)으로 되돌아갔습니다.

### 현재 상태
- **브랜치**: `rollback-to-final-deploy`
- **커밋**: `190f562` (최종배포준비)
- **상태**: 안전한 롤백 브랜치 생성 완료

---

## 🚀 배포 플랫폼 롤백 방법

### Vercel (프론트엔드) 롤백

#### 방법 1: Git 브랜치로 배포 (권장)

1. **롤백 브랜치를 원격 저장소에 푸시**
   ```bash
   git push origin rollback-to-final-deploy
   ```

2. **Vercel 대시보드에서 브랜치 변경**
   - https://vercel.com/dashboard 접속
   - 프로젝트 선택
   - **Settings** → **Git** → **Production Branch**
   - `rollback-to-final-deploy` 선택
   - **Save** 클릭
   - 자동으로 재배포 시작

#### 방법 2: Deployment History에서 롤백

1. **Vercel 대시보드 → Deployments**
2. "최종배포준비" 커밋(`190f562`)이 포함된 배포 찾기
3. 해당 배포의 **"⋯"** 메뉴 → **"Promote to Production"**

---

### Render (백엔드) 롤백

#### 방법 1: Git 브랜치로 배포 (권장)

1. **롤백 브랜치를 원격 저장소에 푸시**
   ```bash
   git push origin rollback-to-final-deploy
   ```

2. **Render 대시보드에서 브랜치 변경**
   - https://dashboard.render.com 접속
   - 서비스 선택
   - **Settings** → **Build & Deploy**
   - **Branch** 필드를 `rollback-to-final-deploy`로 변경
   - **Save Changes** 클릭
   - 자동으로 재배포 시작

#### 방법 2: Manual Deploy

1. **Render 대시보드 → Manual Deploy**
2. **"Deploy latest commit"** 선택
3. (브랜치가 이미 변경되어 있으면 자동 배포됨)

---

## 📋 롤백 후 확인사항

### 프론트엔드 (Vercel)
- [ ] 로그인/회원가입 기능
- [ ] 캘린더 일정 조회
- [ ] 일정 등록/수정/삭제
- [ ] 관리자 페이지
- [ ] 필터링 기능

### 백엔드 (Render)
- [ ] API 엔드포인트 정상 응답
- [ ] 데이터베이스 연결
- [ ] 인증 토큰 발급
- [ ] CORS 설정
- [ ] 에러 로그 확인

---

## 🔄 main 브랜치로 완전히 롤백하려면

로컬에서 main 브랜치도 "최종배포준비" 커밋으로 되돌리려면:

```bash
# main 브랜치로 전환
git checkout main

# "최종배포준비" 커밋으로 리셋 (주의: 강제 리셋)
git reset --hard 190f562

# 원격 저장소에 푸시 (주의: 강제 푸시)
git push origin main --force
```

**⚠️ 주의**: 강제 푸시는 팀원들과 협의 후 진행하세요.

---

## 📝 롤백 커밋 정보

```
커밋 해시: 190f562a9e797b04fc1c15bbaaf80133964b5923
커밋 메시지: 최종배포준비
작성자: LEEJONGKWANG-star
작성일: Thu Dec 11 09:59:28 2025 +0900
```

### 주요 변경사항
- 배포 관련 문서 추가 (DEPLOYMENT_GUIDE.md, VERCEL_DEPLOY.md, RENDER_DEPLOY.md 등)
- 폴더명 변경 (캘린더프론트엔드 → frontend, 캘린더백엔드 → backend)
- 배포 설정 파일 추가 (vercel.json, render.yaml, Procfile)

---

## 💡 참고사항

- 롤백 브랜치 `rollback-to-final-deploy`는 임시 브랜치입니다.
- 롤백이 완료되고 안정화되면, 필요시 이 브랜치를 삭제할 수 있습니다.
- 문제가 해결되면 main 브랜치로 다시 머지할 수 있습니다.

---

**롤백 완료를 기원합니다! 🚀**

