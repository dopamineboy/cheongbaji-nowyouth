# 청바지(NowYouth) — MVP 개발 실행 계획서

## 1. Scope — 포함 / 제외

### ✅ 포함 (🟢 Now에서 반드시 만드는 것)

| 기능 | 핵심 요구 |
|------|----------|
| **온보딩·인증** | 휴대폰 본인인증(PASS 간편인증 or SMS OTP 대체) · 필수 3필드(생년월일·행정동·가구유형) |
| **홈 피드** | 사용자별 혜택 추천 N건 카드형 리스트 + 4대 기능 진입점 |
| **복지 알리미 (Rule Engine)** | 복지로 Open API 주기 수집 → SQL WHERE 매칭 → 카드 리스트 + 신청 서류 체크리스트 |
| **일자리 목록** | 노인인력개발원 Open API → 키워드·거리(Haversine) 필터 → 신청 링크 전달 |
| **활동 포인트 원장** | `user_points` 테이블 · 인지 훈련 미니게임 1종 · 적립 토스트 UI |
| **품앗이 게시판** | 행정동 지오펜싱 · 요청/응답 · 1:1 매칭 · 신고 시스템(3회→자동 정지) |
| **AI 챗봇(기초)** | OpenAI GPT-4o-mini 호출 · 자연어 Q&A(혜택·일자리 관련만) |
| **접근성** | 큰 글씨 모드 · 고대비 · KWCAG 2.2 AA 기본 준수 |

### ❌ 제외 (🟡 Next — 시드 투자 후)

- AI Ranker (pgvector 임베딩 + LLM 우선순위 재정렬)
- 네이티브 앱(iOS·Android) · HealthKit/Google Fit 연동
- 카카오·네이버페이 기프티콘 API 자동 발급
- 지자체 수행기관 API 직연동, GPS+QR 근태 체크
- 양방향 평점, 음성 요청 등록(Whisper)

### ❌ 제외 (🔴 Scale — Series A 이후)

- 문화누리카드 Webhook, 정부24 알림 서비스 API
- 급여 정산 미들웨어, 지하철 역사 QR 배너
- 지자체 사회복지사 모니터링 대시보드(B2G SaaS)

---

## 2. 기술 스택 확정

| 레이어 | 선택 | 선정 이유 |
|-------|-----|----------|
| **FE** | Next.js 16 (App Router) + React 19 + Tailwind CSS | PWA 내장, 서버 컴포넌트로 접근성·성능 유리, 기획팀이 이미 mockup-app에서 사용 중 |
| **BE** | NestJS (Node 22 LTS) + TypeScript | 모듈형 구조, FE와 언어 통일(타입 공유), 공공기관 납품 선례 |
| **DB** | PostgreSQL 16 | 관계형 + JSONB, 확장성(Next 단계에서 pgvector 추가) |
| **Cache** | Redis 7 | 세션·공공 API 응답 캐싱·큐 |
| **파일** | S3 호환 (AWS S3 or Cloudflare R2) | 인증 서류·게시판 이미지 |
| **AI** | OpenAI GPT-4o-mini · Whisper | API 호출만, 자체 모델 학습 없음 |
| **인증** | PASS 간편인증(유료, 건당 과금) · 개발 중에는 SMS OTP로 대체 | 공공기관 인정 |
| **배포 FE** | Vercel | Next.js 네이티브, 프리뷰 배포 무료 |
| **배포 BE** | Fly.io or Railway (초기) → AWS Seoul(ECS Fargate) 전환 예비 | 저비용 시작, 성장 시 이전 |
| **모니터링** | Sentry (오류) · BetterStack/Grafana Cloud (APM·로그) | 프리티어로 시작 가능 |
| **시크릿** | Doppler or 1Password CLI | `.env` 직접 관리 금지 |
| **CI/CD** | GitHub Actions | 무료 티어 충분 |

**결정 필요 (Kick-off 미팅에서 확정)**:
- [ ] 레포 구조: 모노레포(`/apps/web`, `/apps/api`, `/packages/shared`) vs 분리
- [ ] 본인인증 초기 방식: PASS 유료 즉시 vs SMS OTP 후 교체
- [ ] S3 vs R2 (비용·한국 보관 요건)

---

## 3. 외부 API 사용 가능 현황

MVP 개발 시점에 **실제로 연동 가능한 외부 API**를 ✅ 즉시 사용 가능과 ⏳ 별도 신청·계약 필요로 구분합니다. 스프린트 계획(§6)은 ✅ 군 API만을 전제로 수립되었습니다.

### ✅ 즉시 사용 가능 — 회원가입·키 발급만, 대부분 자동/당일 승인

| API | 제공 기관 | 용도 | 발급 절차 | 비용 |
|-----|----------|------|----------|------|
| **복지로 Open API** | 보건복지부 | 중앙정부 복지 제도 약 360종 | 공공데이터포털([data.go.kr](https://www.data.go.kr)) 활용신청 · 1~2일 | 무료 |
| **워크넷 채용정보 API** ⭐ 일자리 1차 소스 | 고용노동부 (KEIS) | 고령자 채용정보 카테고리 포함 · 시간당 갱신 | 공공데이터포털 활용신청 · 1~2일 | 무료 |
| **한국노인인력개발원 Open API** | 노인인력개발원 | ⚠️ 기관코드·지역코드만 개방 / 공고 목록 API는 미확인 — 별도 협약 신청 필요 | 공공데이터포털 활용신청 · 자동 승인 | 무료 |
| **공공데이터포털 (행정구역 코드·지자체 복지)** | 행정안전부 | 행정동 코드 · 지자체 복지사업 DB | 회원가입 후 개별 API 활용신청 | 무료 |
| **Kakao Map REST API** | 카카오 | 주소↔좌표 변환, 거리 계산, 지도 렌더 | Kakao Developers 앱 키 즉시 발급 | 월 30만 건까지 무료 |
| **OpenAI API** (GPT-4o-mini · Whisper) | OpenAI | AI 챗봇, 요약, 음성→텍스트 | 결제 카드 등록 즉시 | 사용량 기반(MVP 월 예산 10만원 이내 목표) |
| **SMS OTP** (NHN Cloud / Toast) | NHN · Toast | 개발 단계 본인인증 대체 | 사업자 가입 · 즉시 발급 | 건당 약 9원 |

### ⏳ 별도 신청·계약 필요 — 심사·파트너십 기간 존재

| API | 제공 기관 | 신청 방식 | 소요 기간 | 비용 | 단계 |
|-----|----------|----------|----------|------|------|
| **PASS 간편인증** | NICE평가정보 | 사업자 심사 · 계약 체결 | 2~4주 | 건당 약 80~150원 | 🟢 S5 도입 목표 |
| **KISA 본인확인 서비스** | 한국인터넷진흥원 | 행안부 지정 절차·심사 | 4~8주 | 연 분담금 + 건당 과금 | 🟡 시드 후 |
| **토스페이먼츠 / 카카오페이 결제** | 토스 · 카카오 | 사업자 등록 후 심사 | 1~2주 | 건당 수수료 2.5~3% | 🟡 리워드 유료 발송 시 |
| **카카오·네이버페이 기프티콘 발급 API** | 카카오 · 네이버 | 월 거래액 심사·사업자 파트너십 | 1~3개월 | 계약 조건별 상이 | 🟡 Next |
| **지자체 수행기관 포털** | 개별 지자체·복지관 | 개별 B2B 계약 (실증 1곳부터) | 1~3개월 | 수수료 협의 | 🟡 실증 단계 |
| **정부24 알림 서비스 API** | 행정안전부 | 민간 개방 제한 · 기관 협약 | 6개월 이상 | 무료(협약 전제) | 🔴 Scale |
| **문화누리카드 결제 Webhook** | NH농협 · 문체부 | 카드사 데이터 제휴 · 여신금융 법무 | 6개월 이상 | 계약 조건별 | 🔴 Scale |
| **한국철도공사 역사 QR** | 코레일 · 지자체 | 기관 협약 · 시설 사용 허가 | 6개월 이상 | 협약 조건별 | 🔴 Scale |

### 📌 대표 착수 체크리스트

**이번 주 즉시 신청** (1~2일 내 발급 예상):
- [ ] 공공데이터포털 회원가입 · **복지로 Open API** 활용신청
- [ ] 공공데이터포털 · **한국노인인력개발원 Open API** 활용신청
- [ ] 공공데이터포털 · **행정구역 코드 API** 활용신청
- [ ] Kakao Developers 앱 생성 · REST API 키 발급
- [ ] OpenAI 조직 계정 개설 · 결제카드 등록 · API 키 발급
- [ ] NHN Cloud(또는 Toast) SMS 사업자 가입

**병행 진행** (2~4주 소요, S5 시점 목표):
- [ ] PASS 간편인증(NICE평가정보) 영업 담당자 미팅 요청

**시드 투자 후 착수** (본 문서 Scope 외): KISA 본인확인 · 토스페이먼츠 · 기프티콘 API · 지자체 수행기관 B2B

---

## 4. 도메인 모델 — 주요 테이블

```sql
-- 사용자
users (id, phone_hash, created_at, last_login_at, status)
user_profiles (user_id PK, birth_year, dong_code, household_type,
               income_bracket NULL, pension_status NULL, interests JSONB)

-- 복지 (복지로 API 수집 캐시)
welfare_programs (id, source, source_id, title, summary, eligibility JSONB,
                  benefit_amount_krw, apply_url, deadline, region_codes TEXT[],
                  updated_at)

-- 포인트 원장 (감사 추적)
point_ledger (id, user_id, type, amount, metadata JSONB, created_at)
  -- type: WALK | STAMP | GAME | CULTURE | POOMASI | REDEEM | BONUS

-- 일자리 (노인인력개발원 API 수집 캐시)
jobs (id, source, source_id, title, org, region_code, wage, hours,
      requirements JSONB, apply_url, expires_at, updated_at)

-- 품앗이
poomasi_posts (id, author_id, dong_code, category, title, body,
               status, created_at)
poomasi_matches (id, post_id, helper_id, status, created_at)
poomasi_reports (id, target_user_id, reporter_id, reason, created_at)

-- 감사
audit_logs (id, user_id, action, entity, entity_id, metadata JSONB, created_at)
```

**원칙**:
- 휴대폰 번호는 해시(phone_hash)로 저장, 원문은 본인확인 세션에서만 보관 후 삭제
- 모든 포인트 거래는 `point_ledger` **append-only**, 수정·삭제 금지 (감사 요건)
- PII 최소 수집: 이름·상세주소는 품앗이 매칭 시에만 마스킹 상태로 노출

---

## 5. API 스펙 (BE ↔ FE 계약)

**공통**: REST(JSON), `Authorization: Bearer <JWT>`, 에러 포맷 `{ code, message, field? }`

| Method | Path | 설명 |
|-------|------|------|
| POST | `/auth/otp/send` | SMS OTP 발송 |
| POST | `/auth/otp/verify` | OTP 검증 → JWT 발급 |
| POST | `/auth/pass/callback` | (Phase 2) PASS 간편인증 콜백 |
| GET | `/me` | 내 프로필 |
| PATCH | `/me` | 프로필 수정 |
| GET | `/welfare/match` | 내 프로필 기반 복지 추천 (Rule Engine) |
| GET | `/welfare/:id` | 상세 + 서류 체크리스트 |
| GET | `/jobs/search?kw=&dong=&radius=` | 일자리 검색 |
| GET | `/jobs/:id` | 상세 |
| GET | `/points/balance` | 잔액 조회 |
| POST | `/points/earn` | 내부 이벤트(게임 완료 등)로 적립 |
| GET | `/points/history` | 거래 내역 |
| GET | `/poomasi/feed?dong=` | 우리 동 게시판 |
| POST | `/poomasi/posts` | 글 작성 |
| POST | `/poomasi/posts/:id/apply` | 매칭 신청 |
| POST | `/poomasi/reports` | 신고 |
| POST | `/chat` | 챗봇 질의 (스트리밍) |

**Rate limit**: User 60/min, IP 300/min (Gateway에서 통제)

---

## 6. 스프린트 로드맵 (12주 · MVP → 실증 준비)

| Sprint | 기간 | FE | BE | 공통 산출물 |
|-------|------|-----|-----|------------|
| **S0** | 1주 | 레포 셋업·Tailwind 디자인 토큰·Storybook | 레포 셋업·CI/CD·DB 스키마 v1·인증 뼈대 | Kick-off 문서·환경변수 정책 |
| **S1** | 2주 | 온보딩 3-step 폼·홈 스켈레톤 | SMS OTP 인증·JWT·`/me` | 온보딩 E2E |
| **S2** | 2주 | 복지 알리미 화면·카드 UI | 복지로 API 수집 잡·Rule Engine·`/welfare/*` | 복지 추천 실작동 |
| **S3** | 2주 | 포인트 화면·인지 게임 1종 | `/points/*`·원장 테이블 | 포인트 적립·조회 |
| **S4** | 2주 | 일자리 화면·지도(Kakao Map) | 노인인력개발원 수집·`/jobs/*` | 일자리 검색 |
| **S5** | 2주 | 품앗이 게시판·신고 플로우 | 지오펜싱·`/poomasi/*`·신고 자동화 | 품앗이 MVP |
| **S6** | 1주 | 접근성 감사(axe)·QA·디자인 폴리시 | 로깅·Sentry·부하 테스트 | **실증 1곳 파일럿 배포 준비** |

**마일스톤**:
- M1 (S2 말): 내부 데모 가능 (기획팀·엔지니어만)
- M2 (S5 말): 클로즈드 베타 (지인 시니어 10~20명)
- M3 (S6 말): 실증 지자체 1곳 공식 런칭

---

## 7. 역할 분장

| 인원 | 담당 영역 |
|-----|----------|
| **FE 엔지니어** | Next.js 앱, PWA 설정, 컴포넌트 라이브러리, 접근성(KWCAG), Storybook, 디자인 토큰 준수 |
| **BE 엔지니어** | NestJS API, DB 스키마·마이그레이션, 공공 API 수집 잡(BullMQ/node-cron), 인증, 보안, 배포 |
| **주상윤 (대표)** | 제품 결정, 공공 API 발급·계약, 실증 지자체 섭외, 투자 유치, 우선순위 조정 |
| **김경림 (보조 기획)** | QA 시나리오, 시니어 사용자 인터뷰, 운영 문서, 콘텐츠(도움말·FAQ) |

**협업 도구**:
- 이슈 트래킹: GitHub Projects (Kanban)
- 문서: 이 레포 `/docs`
- 커뮤니케이션: Slack or Discord (결정) + 주 1회 스탠드업

---

## 8. Non-Functional Requirements

| 항목 | 기준 |
|-----|-----|
| **성능** | P95 API 응답 500ms 이하, 홈 LCP 2.5초 이하 |
| **접근성** | KWCAG 2.2 AA · axe-core CI 통과 · 폰트 스케일 200%까지 깨지지 않음 |
| **보안** | TLS 1.3 · AES-256 at rest · PII 최소 수집 · `.env` 커밋 금지 |
| **개인정보** | 수집 항목 사전 동의 화면 · 3년 후 자동 파기 배치 |
| **가용성** | 99.5% (월 약 3.6시간 장애 허용) · 자동 백업 일 1회 |
| **로깅** | 모든 인증·결제·포인트 이벤트 감사 로그 불변 기록 |

---

## 9. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|-------|------|------|
| PASS 간편인증 비용 | 건당 과금 → 초기 비용 부담 | S1~S4는 SMS OTP로 개발, S5에 PASS 연동 |
| 공공 API 불안정 | 복지로·노인인력개발원 장애 시 기능 정지 | 일일 수집 캐시 + 장애 감지 시 stale 허용 |
| 실증 지자체 미확보 | M3 런칭 지연 | 대표가 S3 시점까지 MOU 1곳 확정, 미확보 시 지인 시니어 베타로 전환 |
| 인력 확보 후 이탈 | 12주 로드맵 붕괴 | 스프린트 단위 검수 · 페어프로그래밍 · 문서화 강제 |
| 접근성 미준수 지적 | B2G 납품 시 감점 | 매 스프린트 axe CI · S6 전문가 감사 1회 |

---

**부록 A**: UI 참고 — `/mockup-app/app/` 4대 기능 페이지 (welfare, activity, infographic, …)
**부록 B**: 접근성 가이드 — KWCAG 2.2 AA 체크리스트 (별도 문서 예정)
**부록 C**: 공공 API 원문 레퍼런스 — `/docs/public-api-refs.md` (BE 엔지니어가 초안 작성)
