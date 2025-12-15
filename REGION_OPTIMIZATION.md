# 리전 최적화 가이드

## 📊 현재 리전 설정

| 서비스 | 현재 리전 | 변경 가능 여부 |
|--------|----------|--------------|
| **Vercel** (프론트엔드) | 서울 | ✅ 변경 가능 |
| **Render** (백엔드) | 싱가폴 | ❌ 서울 리전 없음 |
| **Supabase** (데이터베이스) | 서울 | ⚠️ 변경 시 데이터 마이그레이션 필요 |

> ⚠️ **중요**: Render는 서울 리전을 지원하지 않습니다. 싱가폴만 사용 가능합니다.

---

## 🔍 성능 분석

### 현재 구성의 지연 시간

```
사용자 (한국)
  ↓ ~10ms
Vercel (서울)
  ↓ ~50-100ms (싱가폴까지)
Render (싱가폴)
  ↓ ~50-100ms (서울까지)
Supabase (서울)
  ↓ ~50-100ms
Render (싱가폴)
  ↓ ~50-100ms
Vercel (서울)
  ↓ ~10ms
사용자 (한국)
```

**총 예상 지연 시간: 약 220-420ms**

### 문제점
1. **Vercel ↔ Render**: 서울 ↔ 싱가폴 간 지연 (50-100ms)
2. **Render ↔ Supabase**: 싱가폴 ↔ 서울 간 지연 (50-100ms)
3. **이중 지연**: 요청과 응답 모두 지연 발생

---

## ✅ 최적화 방안

### 🎯 **방안 1: Render와 Supabase를 싱가폴로 통일 (권장)**

**구성:**
- Vercel: 서울 ✅ (유지)
- Render: 싱가폴 ✅ (이미 설정됨)
- Supabase: 싱가폴 (변경 필요)

**예상 지연 시간: 약 60-120ms**

**통신 경로:**
```
사용자 (한국)
  ↓ ~10ms
Vercel (서울)
  ↓ ~50-100ms (싱가폴까지)
Render (싱가폴)
  ↓ ~5-10ms (같은 리전)
Supabase (싱가폴)
```

**장점:**
- ✅ Render ↔ Supabase 지연 최소화 (5-10ms)
- ✅ Render 변경 불필요
- ✅ 백엔드-데이터베이스 통신 최적화
- ✅ 데이터베이스 쿼리 속도 향상

**단점:**
- ⚠️ Vercel ↔ Render 지연 유지 (50-100ms) - 하지만 이는 불가피함
- ⚠️ Supabase 데이터 마이그레이션 필요
- ⚠️ 한국 사용자 → Vercel 지연은 유지 (10ms, 이미 최적)

**추천도: ⭐⭐⭐⭐ (최선의 선택)**

**개선 효과:**
- 현재: Vercel(서울) → Render(싱가폴) → Supabase(서울) = 200-400ms
- 개선: Vercel(서울) → Render(싱가폴) → Supabase(싱가폴) = 60-120ms
- **성능 향상: 약 50-70% 개선** ⚡

---

### 방안 2: 모든 서비스를 싱가폴로 통일

**구성:**
- Vercel: 싱가폴 (변경 필요)
- Render: 싱가폴 ✅ (이미 설정됨)
- Supabase: 싱가폴 (변경 필요)

**예상 지연 시간: 약 60-120ms**

**통신 경로:**
```
사용자 (한국)
  ↓ ~50-100ms (싱가폴까지)
Vercel (싱가폴)
  ↓ ~5-10ms (같은 리전)
Render (싱가폴)
  ↓ ~5-10ms (같은 리전)
Supabase (싱가폴)
```

**장점:**
- ✅ 모든 서비스 간 통신 최소화 (5-10ms)
- ✅ Vercel ↔ Render 지연 제거
- ✅ Render ↔ Supabase 지연 제거
- ✅ 서비스 간 통신 최적화

**단점:**
- ⚠️ 한국 사용자 → Vercel 지연 증가 (10ms → 50-100ms)
- ⚠️ Vercel 리전 변경 필요
- ⚠️ Supabase 데이터 마이그레이션 필요
- ⚠️ 사용자 경험 측면에서는 방안 1과 비슷하거나 약간 나쁨

**추천도: ⭐⭐⭐ (보통)**

**분석:**
- 전체적인 서비스 간 통신은 최적이지만, 사용자가 가장 많이 느끼는 "첫 로딩" 지연이 증가합니다.
- API 응답 시간은 방안 1과 비슷하지만, 초기 리소스 로딩이 느려질 수 있습니다.

---

### 방안 3: 현재 구성 유지 (권장하지 않음)

**구성:**
- Vercel: 서울 ✅
- Render: 싱가폴 ✅
- Supabase: 서울 ✅

**예상 지연 시간: 약 200-400ms**

**문제점:**
- ❌ Render ↔ Supabase 간 이중 리전 통신 (50-100ms × 2)
- ❌ 최악의 성능 조합

**추천도: ⭐ (비추천)**

---

## 🚀 권장 조치사항

### **방안 1 선택 시 (Render와 Supabase를 싱가폴로 통일)**

#### 1단계: Supabase 리전 변경

1. **Supabase 대시보드 접속**
   - https://app.supabase.com

2. **프로젝트 선택 → Settings**
   - 왼쪽 메뉴에서 **Settings** 클릭

3. **General → Region 변경**
   - **Region**: `Seoul (ap-northeast-2)` → `Southeast Asia (Singapore)` 
   - 또는 **Asia Pacific (Singapore)** 선택
   - ⚠️ **주의**: 이 작업은 데이터 마이그레이션이 필요하며 다운타임이 발생할 수 있습니다.

4. **대안: 새 프로젝트 생성 (권장)**
   - 기존 프로젝트는 백업으로 유지
   - 새 프로젝트를 싱가폴 리전으로 생성
   - 데이터 마이그레이션 수행 (아래 참고)

#### 2단계: 데이터 마이그레이션 (새 프로젝트 생성 시)

1. **기존 데이터 백업**
   ```sql
   -- Supabase SQL Editor에서 실행
   -- 또는 pg_dump 사용
   ```

2. **새 프로젝트에 스키마 적용**
   - `backend/prisma/create_tables.sql` 실행
   - 또는 `npx prisma migrate deploy` 실행

3. **데이터 이전**
   - 기존 데이터베이스에서 데이터 export
   - 새 데이터베이스로 import

4. **환경 변수 업데이트**
   - Render: `DATABASE_URL` 업데이트
   - 로컬 개발 환경 `.env` 업데이트

#### 3단계: Render 환경 변수 업데이트

1. **Render 대시보드 접속**
   - https://dashboard.render.com

2. **백엔드 서비스 선택 → Environment**
   - `DATABASE_URL` 환경 변수 클릭

3. **새 Supabase 연결 문자열 입력**
   - 새 싱가폴 리전의 Supabase 연결 문자열로 업데이트
   - 형식: `postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true`

4. **서비스 재배포**
   - 환경 변수 저장 후 자동 재배포
   - 또는 **Manual Deploy** 클릭

#### 4단계: 연결 테스트

```bash
# 백엔드 API 테스트
curl https://your-backend.onrender.com/api/health

# 프론트엔드에서 API 호출 테스트
# 브라우저 개발자 도구 → Network 탭에서 응답 시간 확인
```

#### 5단계: 성능 모니터링

- **이전**: 200-400ms 응답 시간
- **이후**: 60-120ms 응답 시간 (예상)
- **개선**: 약 **50-70% 성능 향상** 🚀

---

## 📈 예상 성능 개선

### 현재 (서울-싱가폴-서울)
- 사용자 → Vercel: 10ms
- Vercel → Render: 50-100ms
- Render → Supabase: 50-100ms
- Supabase → Render: 50-100ms
- Render → Vercel: 50-100ms
- **총 응답 시간: 210-410ms** ⏱️

### 최적화 후 - 방안 1 (서울-싱가폴-싱가폴)
- 사용자 → Vercel: 10ms
- Vercel → Render: 50-100ms (불가피한 지연)
- Render → Supabase: 5-10ms ✅ (같은 리전)
- Supabase → Render: 5-10ms ✅ (같은 리전)
- Render → Vercel: 50-100ms (불가피한 지연)
- **총 응답 시간: 120-230ms** ⚡

**성능 향상: 약 43-55% 개선** 🚀

### 최적화 후 - 방안 2 (싱가폴-싱가폴-싱가폴)
- 사용자 → Vercel: 50-100ms ⚠️ (지연 증가)
- Vercel → Render: 5-10ms ✅ (같은 리전)
- Render → Supabase: 5-10ms ✅ (같은 리전)
- Supabase → Render: 5-10ms ✅ (같은 리전)
- Render → Vercel: 5-10ms ✅ (같은 리전)
- **총 응답 시간: 70-140ms** (서비스 간 통신 최적, 하지만 초기 로딩 느림)

**분석**: 
- API 응답은 빠르지만, 초기 리소스 로딩이 느려져 사용자 체감 성능은 방안 1과 비슷할 수 있습니다.

---

## ⚠️ 주의사항

### Render 리전 변경 시
1. **다운타임 발생 가능**
   - 재배포 중 일시적 서비스 중단 (1-5분)
   - 사용자에게 사전 공지 권장

2. **환경 변수 확인**
   - `DATABASE_URL`이 올바른지 확인
   - 다른 환경 변수도 재확인

3. **DNS/도메인 설정**
   - 커스텀 도메인 사용 시 DNS 설정 확인

### Supabase 리전 변경 시 (방안 2 선택 시)
1. **데이터 백업 필수**
2. **마이그레이션 시간 소요**
3. **다운타임 발생**

---

## 🎯 최종 권장사항

### **✅ 방안 1: Render와 Supabase를 싱가폴로 통일**

**이유:**
1. ✅ Render는 서울 리전을 지원하지 않으므로, 싱가폴에서 최적화가 필요
2. ✅ Render ↔ Supabase 통신 최소화 (5-10ms)
3. ✅ 데이터베이스 쿼리 성능 최대 50% 향상
4. ✅ Vercel(서울) 유지로 사용자 초기 접속은 빠름 (10ms)
5. ✅ 전체 응답 시간 약 50-70% 개선 예상

**실행 순서:**
1. Supabase 새 프로젝트 생성 (싱가폴 리전) 또는 기존 프로젝트 리전 변경
2. 데이터 마이그레이션 수행
3. Render 환경 변수(`DATABASE_URL`) 업데이트
4. 서비스 재배포
5. 성능 테스트 및 모니터링

**대안 고려사항:**
- 방안 2 (모든 것을 싱가폴)도 고려 가능하나, 사용자 초기 로딩이 느려질 수 있음
- **장기적으로는 Render 대신 AWS/Google Cloud/Azure의 서울 리전 사용도 고려 가능**
  - 📖 상세 가이드: [클라우드 플랫폼 이전 가이드](./CLOUD_MIGRATION_GUIDE.md)
  - 추천: **Google Cloud Run** (완전 서버리스, 경제적, 간단한 배포)

---

## 📝 체크리스트 (방안 1 기준)

### Supabase 마이그레이션
- [ ] Supabase 새 프로젝트 생성 (싱가폴 리전)
- [ ] 기존 데이터 백업
- [ ] 새 프로젝트에 스키마 적용 (`create_tables.sql` 또는 `prisma migrate`)
- [ ] 데이터 이전 완료
- [ ] 새 `DATABASE_URL` 확인

### Render 설정
- [ ] Render 대시보드 접속
- [ ] 환경 변수 `DATABASE_URL` 업데이트
- [ ] 서비스 재배포 완료 대기

### 테스트 및 검증
- [ ] API 연결 테스트 (`/api/health`)
- [ ] 로그인 기능 테스트
- [ ] 프론트엔드에서 응답 시간 측정 (Network 탭)
- [ ] 성능 개선 확인 (이전 대비 50-70% 개선 기대)
- [ ] 데이터 정합성 확인

---

## 🔗 참고 자료

- [Render 리전 설정](https://render.com/docs/regions)
- [Vercel 리전 설정](https://vercel.com/docs/edge-network/regions)
- [Supabase 리전 정보](https://supabase.com/docs/guides/platform/regions-and-availability)
- [클라우드 플랫폼 이전 가이드](./CLOUD_MIGRATION_GUIDE.md) - AWS/GCP/Azure 서울 리전 마이그레이션 상세 가이드

