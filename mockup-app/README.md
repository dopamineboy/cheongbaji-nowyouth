# 청바지(NowYouth) — MVP S1

4대 통합 서비스(복지 알리미 · 활동 리워드 · 일자리 매칭 · 품앗이) 작동하는 MVP.

> **현재 단계**: S1 (Pilot Product) 진입 직전 — 외부 API 키 없이 샘플 데이터로 4대 기능 모두 end-to-end 시연 가능.

## 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

## 화면 구성

| 경로 | 기능 | 데이터 출처 |
|------|------|------------|
| `/` | 통합 홈 — 4대 서비스 믹스 피드 | 매칭 엔진 결과 |
| `/welfare` | 복지 알리미 — Rule Engine 매칭 | `lib/welfare/match.ts` |
| `/jobs` | 일자리 — 3단계 매칭 (Hard filter → 100점 → Top-5 다양성) | `lib/jobs/match.ts` |
| `/community` | 품앗이 — 우리 동 게시판 | 인메모리 스토어 |
| `/activity` | 포인트 원장 + 인지 게임 미션 | `point_ledger` |

## API 엔드포인트

- `GET /api/welfare/match` — 복지 자동 매칭
- `GET /api/jobs/search?mode=match|search&kw=` — 일자리 매칭/검색
- `GET /api/points/balance` — 포인트 잔액 + 최근 거래
- `POST /api/points/earn` `{ type, metadata? }` — 활동 완료 → 포인트 적립
- `GET /api/poomasi/feed` — 우리 동 품앗이 피드
- `POST /api/poomasi/posts` `{ category, title, body, preferredTime }` — 새 글 (금지 키워드·길이 검증)

## 핵심 로직

### 복지 매칭 (Rule Engine, S1)
연령·소득·가구·지역·마감 SQL WHERE 필터 → 마감 임박 + 혜택 금액 정렬.
`lib/welfare/match.ts`

### 일자리 3단계 매칭 (시니어 일자리 매칭 보고서 §6 적용)
1. **Hard Filter** — 연령·신체조건·통근시간·마감으로 80~90% 제거
2. **Soft Score** — 100점 (거리 25 + 경력 25 + 시간 20 + 임금 15 + 활동유형 15)
3. **Top-5 다양성** — 1~2위 최고점 / 3위 경력활용 / 4위 임금우수 / 5위 새로운 분야 (탐색)

`lib/jobs/match.ts`

### 포인트 원장 (불변 append-only)
`lib/store.ts` `point_ledger` — `WALK / GAME / STAMP / CULTURE / LEARN / EVENT / WELFARE / JOB / POOMASI / REDEEM / ADMIN_ADJUST`. 잔액은 합산.

### 품앗이 모더레이션
- 행정동 단위 노출
- 본인인증 + 신고 3회 자동 정지
- 금지 키워드 필터 (대출·투자·종교·후원금)
- 매칭 전 실명 마스킹 (`김정숙` → `김○○`)

## 데이터 소스 (현재)

⚠️ **모든 데이터는 `lib/sample-data.ts`의 샘플** — 외부 API 키 발급 후 `lib/store.ts`만 교체하면 호환.

| 서비스 | 실제 연동 시 사용할 API |
|--------|----------------------|
| 복지 | 복지로 Open API · 공공데이터포털 (활용신청 1~2일) |
| 일자리 | **워크넷 채용정보 API ⭐** (고령자 카테고리 포함) · 한국노인인력개발원 (기관코드만 개방) |
| 일자리 (지자체) | 크롤링 (robots.txt 확인 후) |
| 품앗이 | 자체 (사용자 생성) |
| 포인트 | 자체 (HealthKit/Google Fit는 S2 네이티브 앱) |

## 구조

```
app/
├── page.tsx                    # 통합 홈
├── welfare/page.tsx            # 복지
├── jobs/page.tsx               # 일자리
├── community/page.tsx          # 품앗이
├── activity/
│   ├── page.tsx                # 포인트·미션
│   └── game-mission.tsx        # 클라이언트 컴포넌트 (게임)
├── api/
│   ├── welfare/match/route.ts
│   ├── jobs/search/route.ts
│   ├── points/balance/route.ts
│   ├── points/earn/route.ts
│   ├── poomasi/feed/route.ts
│   └── poomasi/posts/route.ts
└── lib/
    ├── types.ts                # 도메인 타입
    ├── sample-data.ts          # 시드 데이터
    ├── store.ts                # 인메모리 스토어 (S2에서 Postgres로 교체)
    ├── welfare/match.ts        # Rule Engine
    └── jobs/match.ts           # 3단계 매칭 엔진
```

## 데모 사용자

`lib/sample-data.ts` `sampleUser` — **김정숙, 만 70세, 종로구 종로1·2·3·4가동, 1인 가구, 월 소득 90만원, 기초연금 수급**. 모든 페이지가 이 사용자 기준으로 매칭 결과를 보여줌.

## 다음 작업 (S2 진입 전)

- [ ] PostgreSQL 마이그레이션 (Supabase 또는 Neon)
- [ ] SMS OTP 인증 (NHN Cloud) → JWT
- [ ] 공공데이터포털 워크넷 API 실제 연동 (Cron 일 1회 동기화)
- [ ] 복지로 API 실제 연동
- [ ] 사용자 온보딩 4단계 화면 (현재는 데모 사용자 고정)
- [ ] 품앗이 글쓰기 화면 (API는 작동, UI 추가 필요)
- [ ] 접근성 axe-core CI 통과
- [ ] Vercel 배포 + 도메인 연결

## 관련 문서

- `../청바지_MVP_개발계획서.md` — 12주 스프린트 계획
- `../청바지_4대통합서비스_구현계획서.md` — 본 코드의 설계 근거
- `../시니어_일자리_매칭_플랫폼_보고서.docx` — 일자리 3단계 매칭 보고서
