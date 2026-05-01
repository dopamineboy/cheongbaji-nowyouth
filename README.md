# 청바지(NowYouth)

> **청춘은 바로 지금** — 65세 이상 시니어를 위한 복지·활동·관계 통합 라이프스타일 플랫폼

[![Made with Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

## 4대 통합 서비스

| 영역 | 핵심 가치 | 구현 |
|------|----------|------|
| 📋 **복지 알리미** | 25개 실제 복지 제도 자동 매칭 (4단계 자격 분류) | `app/lib/welfare/matcher.ts` + YAML 데이터 |
| 💼 **일자리 매칭** | 한국노인인력개발원 실제 데이터 + 100점 적합도 + Top-5 다양성 | `app/lib/jobs/match.ts` |
| 💬 **품앗이 커뮤니티** | 행정동 단위 이웃 도움 매칭 + 안전 모더레이션 | `app/community/` |
| 🎯 **활동 리워드** | 인지게임·학습퀴즈·복지신청·일자리·품앗이 통합 포인트 원장 | `app/lib/store.ts` |

## 빠른 실행

```bash
cd mockup-app
npm install
npm run dev
# http://localhost:3000
```

## 프로젝트 구조

```
모두의창업-도우다/
├── mockup-app/                        # Next.js 16 PWA (실제 MVP)
│   ├── app/                           # App Router 페이지·API
│   │   ├── page.tsx                   # 통합 홈
│   │   ├── welcome/                   # 첫 진입 랜딩
│   │   ├── onboarding/                # 4단계 가입 플로우
│   │   ├── welfare/                   # 복지 알리미 + 디테일
│   │   ├── jobs/                      # 일자리 매칭 + 디테일
│   │   ├── community/                 # 품앗이 게시판 + 글쓰기
│   │   ├── activity/                  # 포인트·게임·배지·차트
│   │   ├── rewards/                   # 리워드 교환
│   │   ├── api/                       # Route Handlers
│   │   ├── components/                # 챗봇 등 공통
│   │   └── lib/
│   │       ├── welfare/               # 매칭 엔진 + YAML 로더
│   │       ├── jobs/                  # 3단계 매칭 + 수집 파이프라인
│   │       ├── store.ts               # 인메모리 (S2에서 Postgres)
│   │       ├── sample-data.ts
│   │       ├── sample-jobs-real.ts    # 한국노인인력개발원 CSV → TS
│   │       ├── badges.ts              # 성취 배지 로직
│   │       └── rewards.ts             # 리워드 카탈로그
│   ├── content/benefits/              # 25개 실제 복지 YAML
│   └── docs/API_KEYS.md               # 외부 API 발급 가이드
├── 청바지_AC투자_기획서.md             # AC 투자 피치
├── 청바지_4대통합서비스_구현계획서.md   # 4대 서비스 상세 명세
├── 청바지_MVP_개발계획서.md            # 12주 엔지니어 스프린트
├── 청바지_서비스구현_실행계획서.md     # 36개월 서비스 진화 로드맵
└── 청바지_시장조사_노인일자리.md       # 시장조사 보고서
```

## 단계별 진화 계획

| 단계 | 기간 | 핵심 산출물 |
|------|------|-------------|
| **S0** Paper/Prototype | 0~3M | 기획·목업·PoC PWA *(현재)* |
| **S1** Pilot Product | 3~6M | MVP 실가동 + 실증 1곳 |
| **S2** Scalable Service | 6~18M | 유료 구독 + B2G 첫 계약 |
| **S3** Platform/SaaS | 18~36M | 멀티테넌트 B2G SaaS |

## 외부 API (S1 시점)

`mockup-app/docs/API_KEYS.md` 참조. 키 발급 후 `.env.local`에만 추가.

| API | 우선순위 | 발급처 | 비고 |
|-----|---------|--------|------|
| 워크넷 채용정보 API | 🔴 1순위 | 공공데이터포털 | 1~2일, 일자리 1차 소스 |
| Kakao Local API | 🔴 1순위 | Kakao Developers | 즉시, Geocoding·지도 |
| 한국노인인력개발원 | 🟡 2순위 | 공공데이터포털 | 협약 후, 보조 데이터 |

키 없이도 정적 시드 데이터(36건)로 4대 기능 모두 작동.

## 라이선스

Private — 청바지(NowYouth) 팀 내부 자료.
