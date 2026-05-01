# API 키 발급·설정 가이드

> 본 문서는 청바지 MVP를 **샘플 데이터에서 실제 데이터로 전환**하기 위한 외부 API 키 발급·설정 절차입니다.

키를 발급받으면 아래의 환경 변수를 `.env.local`에 추가하면 즉시 어댑터가 작동합니다 (앱 재시작 필요).

---

## 🔴 1순위 — 즉시 발급 (1~2일)

### ① 워크넷 채용정보 API ⭐

- **발급처**: 공공데이터포털 — https://www.data.go.kr/data/15082929/openapi.do
- **신청 절차**: 회원가입 → "활용신청" 버튼 → 1~2일 내 자동 승인
- **트래픽 제한**: 운영계정 하루 최대 10만 건 (캐싱 필수)
- **환경 변수**:
  ```bash
  WORKNET_API_KEY=발급받은_일반_인증키
  # 선택 - endpoint URL 변경 시
  WORKNET_API_ENDPOINT=https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfoR210L.do
  ```
- **고령자 필터**: 어댑터가 자동으로 `ageLim=60` 파라미터를 보냄 — 발급 후 워크넷 응답 스펙에 맞게 필드명·페이지네이션 키 조정 필요 (`app/lib/jobs/ingestion/adapters/worknet.ts`).
- **갱신 주기**: 1시간

### ② Kakao 로컬 API (Geocoding + Map)

- **발급처**: Kakao Developers — https://developers.kakao.com
- **신청 절차**: 회원가입 → 애플리케이션 생성 → 플랫폼에 도메인 등록 → REST API 키 즉시 발급
- **무료 한도**: 월 30만 건 (Geocoding 기준)
- **환경 변수**:
  ```bash
  KAKAO_REST_API_KEY=발급받은_REST_키
  NEXT_PUBLIC_KAKAO_JS_KEY=프론트엔드용_JavaScript_키
  ```
- **사용처**:
  - 주소 → 좌표 변환 (사용자 거주지·일자리 지역)
  - 거리 계산 (이미 Haversine으로 구현돼 있어 fallback 가능)
  - 지도 임베드 (S2)

---

## 🟡 2순위 — 협약 후 (수주 ~ 수개월)

### ③ 한국노인인력개발원 통합정보 API

- **현재 상태** (2026-04 기준): 공식 공고 목록 API **미개방**.
- **임시 대안 1** — 공공데이터포털 **CSV 정적 데이터** 사용:
  - URL: https://www.data.go.kr/data/15061797/fileData.do
  - 매년 12월 업데이트
  - 환경 변수: `KORDI_CSV_URL=다운로드_URL` 또는 사전 변환된 `realSampleJobs` 사용 (현재 적용)
- **임시 대안 2** — 노인일자리포털 (seniorro.or.kr) 크롤링:
  - robots.txt + 이용약관 확인 필수 (현재 미수행)
- **공식 협약 시**:
  - `KORDI_API_KEY=발급_키`
  - `KORDI_API_ENDPOINT=공식_엔드포인트`
- **갱신 주기**: 1일

### ④ HRD-Net 직업훈련 API (선택, S2 이후)

- **발급처**: 고용노동부 HRD-Net 공공데이터포털 페이지
- **용도**: 시니어 학습 콘텐츠 추천 (디지털 교육·자격증)
- **환경 변수**:
  ```bash
  HRDNET_API_KEY=발급_키
  ```
- **현재 단계 우선순위 낮음** — S2 학습 모듈 빌드 시 활성화

---

## 🟢 키 없이 작동 — 즉시 가능

### ⑤ 직접 등록 (manual)

- 어드민이 `POST /api/admin/jobs`로 직접 입력
- 환경 변수 (선택, 운영 시):
  ```bash
  ADMIN_TOKEN=어드민_고유_토큰
  ```
- 미설정 시 토큰 검증 통과 (개발 편의)

### ⑥ 지자체 크롤링

- robots.txt + 이용약관 검토 후 활성화
- 현재 비활성화 (`municipalAdapter.SOURCES = []`)

---

## 환경 변수 적용 방법

1. `mockup-app/.env.local` 파일 생성
2. 위 환경 변수들 입력
3. `npm run dev` 재시작 — 어댑터가 자동으로 활성화됨 (`isAvailable()` 체크)
4. 상태 확인: `curl http://localhost:3000/api/admin/ingestion` → 어댑터별 사용 가능 여부 표시
5. 즉시 동기화: `curl -X POST http://localhost:3000/api/admin/ingestion -d '{"force":true}'`

---

## 운영 자동화 (S2 이후)

- **Vercel Cron**: `vercel.json`에 `crons`로 1시간마다 `/api/admin/ingestion` POST
- **마감 정리**: 6시간마다 `filterExpired()` 자동 실행 (현재는 매 fetch마다 inline 실행)
- **실패 알림**: Sentry 또는 Slack Webhook 연동 (S2)

---

## 정리: 지금 발급해주실 것

| 우선순위 | 키 이름 | 어디서 | 예상 시간 |
|---------|---------|--------|-----------|
| 🔴 1 | `WORKNET_API_KEY` | 공공데이터포털 | 1~2일 |
| 🔴 2 | `KAKAO_REST_API_KEY` + `NEXT_PUBLIC_KAKAO_JS_KEY` | Kakao Developers | 즉시 |
| 🟡 3 | `KORDI_*` | 한국노인인력개발원 협약 (또는 CSV로 진행) | 수주~수개월 |

**🔴 1·2번만 받아도** 워크넷 실데이터 + 지도 표시까지 작동합니다. 받으시면 `.env.local`에 넣어주시면 됩니다.
