# GitHub Secret 설정 가이드

## 현재 상태

✅ 서비스 계정 생성 완료  
✅ 권한 부여 완료  
✅ 서비스 계정 키 파일 생성 완료: `github-actions-key.json`  
⏳ GitHub Secret 설정 필요

---

## GitHub Secret 설정 방법

### 1단계: GitHub 저장소 접속

1. [GitHub 저장소](https://github.com/leejongkwang-star/open-calendar) 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭

### 2단계: Secret 추가

1. **New repository secret** 버튼 클릭

2. Secret 정보 입력:
   - **Name**: `GCP_SA_KEY` (정확히 이 이름으로 입력)
   - **Secret**: `github-actions-key.json` 파일의 **전체 내용**을 복사하여 붙여넣기

3. **Add secret** 클릭

---

## JSON 파일 내용 복사 방법

### 방법 1: PowerShell 사용

```powershell
# 파일 내용 확인
Get-Content github-actions-key.json

# 파일 내용을 클립보드에 복사
Get-Content github-actions-key.json | Set-Clipboard
```

### 방법 2: 텍스트 에디터 사용

1. `github-actions-key.json` 파일을 텍스트 에디터로 열기
2. 전체 내용 선택 (Ctrl+A)
3. 복사 (Ctrl+C)
4. GitHub Secret의 Secret 필드에 붙여넣기 (Ctrl+V)

---

## 중요 사항

⚠️ **주의사항**:
- JSON 파일의 **전체 내용**을 복사해야 합니다 (중괄호 `{}` 포함)
- Secret 이름은 반드시 `GCP_SA_KEY`여야 합니다 (대소문자 구분)
- JSON 파일은 절대 GitHub에 커밋하지 마세요 (`.gitignore`에 추가됨)

---

## 확인

GitHub 저장소 Settings → Secrets and variables → Actions 페이지에서:
- ✅ `GCP_SA_KEY` Secret이 보이는지 확인

---

## 다음 단계

Secret 설정이 완료되면:
1. 워크플로우 파일 커밋 및 푸시
2. GitHub Actions 실행 확인

