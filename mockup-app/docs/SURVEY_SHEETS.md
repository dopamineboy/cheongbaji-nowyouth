# 설문 응답 → Google Sheets 연동 설정

`/api/survey`로 들어온 응답을 Google Sheets에 자동으로 한 줄씩 append합니다.
원리: Google Apps Script로 시트에 doPost 웹앱을 배포하고, 청바지 서버가
환경변수에 등록된 URL로 응답을 POST합니다.

> 환경변수 미설정 상태에서는 webhook 호출이 **자동으로 no-op** 처리되므로,
> 시트 연동을 안 쓰는 환경(로컬 dev, PR preview 등)에서도 안전합니다.

---

## 1) Google Sheet 만들기

1. https://sheets.new 에서 빈 시트 생성
2. 시트 이름은 자유 (예: `청바지 설문 응답`)
3. 첫 행은 비워두세요. Apps Script가 첫 응답이 들어올 때 자동으로 헤더를 작성합니다.

---

## 2) Apps Script 작성

1. 시트에서 **확장 프로그램 → Apps Script** 클릭
2. 기본 `Code.gs`의 내용을 모두 지우고 아래 코드 붙여넣기:

```javascript
// 청바지 설문 응답 수신 — Google Sheets append
// 청바지 서버의 SURVEY_WEBHOOK_SECRET 환경변수와 정확히 일치시켜야 합니다.
const SECRET = "여기에-비밀-문자열-입력";

// 객관식 10문항 키 (각각 _choice ①·②·③ + _etc 자유 입력 두 컬럼으로 펼침)
const CHOICE_KEYS = [
  "q1_ease",
  "q2_understanding",
  "q3_findFeature",
  "q4_confusion",
  "q5_readability",
  "q6_buttons",
  "q7_mistakes",
  "q8_selfUse",
  "q9_satisfaction",
  "q10_continue",
];

const COLUMNS = [
  "id", "createdAt",
  ...CHOICE_KEYS.flatMap((k) => [k + "_choice", k + "_etc"]),
  "q11_liked", "q12_disliked", "q13_oneChange",
  "contactEmail",
];

function doPost(e) {
  try {
    // 비밀 검증 (URL의 ?secret= 쿼리 파라미터)
    if (SECRET && e.parameter && e.parameter.secret !== SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // 첫 행이 비어 있으면 헤더 자동 작성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    }

    const row = [body.id, body.createdAt];
    for (const k of CHOICE_KEYS) {
      const a = body[k] || {};
      row.push(a.choice || "");
      row.push(a.etc || "");
    }
    row.push(body.q11_liked || "");
    row.push(body.q12_disliked || "");
    row.push(body.q13_oneChange || "");
    row.push(body.contactEmail || "");

    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

> **이미 시트가 운영 중이라면**: 컬럼 구조가 바뀌었으니 기존 시트는 백업 후 새 시트에서 다시 시작하세요. 첫 응답이 들어올 때 새 헤더가 자동으로 만들어집니다.

3. `SECRET` 값을 임의의 문자열로 바꾸세요 (예: `cb-survey-2026-xY9pQ`).
   같은 값을 곧 청바지 환경변수에도 등록할 거예요.

---

## 3) 웹앱으로 배포

1. 우측 상단 **배포 → 새 배포** 클릭
2. **유형 선택**: ⚙️ → **웹 앱**
3. 설정:
   - **설명**: `청바지 설문 webhook`
   - **다음 사용자로 실행**: `나`
   - **액세스 권한이 있는 사용자**: `모든 사용자` (익명 호출 허용 — secret으로 보호)
4. **배포** 클릭 → 권한 승인 다이얼로그 통과
5. 받은 **웹 앱 URL** 복사 (`https://script.google.com/macros/s/AKfycb.../exec`)

---

## 4) 청바지 환경변수 등록

### 로컬 dev (`.env.local`)
```bash
SURVEY_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
SURVEY_WEBHOOK_SECRET=cb-survey-2026-xY9pQ
```

`npm run dev` 재시작 → `/survey`에서 응답 제출 → Google Sheets에 한 줄 추가되는지 확인.

### Vercel (production)
1. Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**
2. 위 두 값을 `Production`(필요 시 `Preview`도) 환경에 추가
3. **Save** 후 재배포 (또는 자동 재배포 기다림)

---

## 5) 동작 확인

응답 제출 후 시트의 첫 시트(보통 `Sheet1` 또는 `시트1`)를 새로고침하면 한 줄씩
쌓입니다. 헤더는 첫 응답에서만 자동 생성되고 이후 보존됩니다.

이중 안전:
- 시트 연동이 끊기거나 Apps Script가 일시 오류여도 청바지 본문은
  `content/surveys/responses.jsonl`에 그대로 기록됩니다.
- `/api/survey/export`에서 CSV로 다시 받을 수 있어 백업이 됩니다.

---

## 6) 시트에서 차트·필터 만들기 (선택)

- **차트**: 데이터 범위 선택 → 삽입 → 차트 → "NPS 분포", "화면별 평균" 등
- **피벗 테이블**: 데이터 → 피벗 테이블 → painPoints별 카운트
- **공유**: 우측 상단 공유 → 심사위원 이메일에 "보기 전용" 권한 부여

---

## 보안 메모

- `SURVEY_WEBHOOK_URL`은 익명 호출이 가능한 endpoint입니다. 알려지면 누구나 시트에
  쓸 수 있으므로 **secret을 항상 설정**하세요.
- secret을 노출했다면 Apps Script에서 `SECRET` 값을 바꾸고 다시 배포하면 됩니다
  (URL은 그대로, 권한만 회전).
- 운영 단계로 가면 Apps Script 익명 webhook 대신 Google Sheets API +
  Service Account로 교체를 권장합니다.
