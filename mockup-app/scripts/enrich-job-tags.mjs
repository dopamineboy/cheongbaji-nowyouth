// 시드 일자리(app/lib/sample-jobs-real.ts)의 jobTags를 자동 보강.
// title·org·activityType에서 키워드를 추출해서 3~5개 태그로 만든다.
// 시노님 사전(app/lib/jobs/match.ts의 OCCUPATION_SYNONYMS)과 정확히 일치해야
// scoreCareer가 잡아주므로, 같은 어휘를 쓰자.
//
// 실행: node scripts/enrich-job-tags.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../app/lib/sample-jobs-real.ts");

// match.ts의 OCCUPATION_SYNONYMS과 같은 어휘 — title/org에 어떤 키워드가 있으면
// 어떤 카테고리 태그를 붙일지.
const KEYWORD_TO_TAGS = [
  // [정규식, 추가할 태그들]
  [/보육|어린이|아동|학교|초등|방과후|돌보미/, ["보육", "돌봄"]],
  [/돌봄|요양|장애|취약|독거|복지|복지관/, ["사회복지", "돌봄"]],
  [/환경|청소|미화|쓰레기|재활용|EM|공원|조경/, ["환경", "청소"]],
  [/카페|찻집|커피/, ["카페", "응대"]],
  [/택배|배달|운전|기사|택시|버스|교통/, ["교통", "운수"]],
  [/식당|급식|주방|조리|식사|도시락/, ["식당", "주방"]],
  [/도서관|책정리/, ["도서관", "교육"]],
  [/문화유산|문화재|해설사|관광|박물관|한옥|전통문화|문화체험/, ["문화", "해설"]],
  [/안내|응대|매장|고객|리셉션|도우미|등하원/, ["응대", "안내"]],
  [/교육|교실|학습|강사|교사|튜터|학습지|교사보조/, ["교육"]],
  [/안전|모니터링|지킴이|예방/, ["안전", "관리"]],
  [/매장|판매|작업장|상점|시장|영업/, ["판매"]],
  [/전통식품|수산물|농산물|식품가공|장醬|장상품|가공작업/, ["제조", "식품"]],
  [/IT|전산|디지털|스마트|컴퓨터|PC/, ["디지털", "IT"]],
];

// activityType → 기본 태그
const ACTIVITY_TO_TAG = {
  "공익활동형": "공익",
  "사회서비스형": "사회서비스",
  "시장형": "시장형",
  "민간": "민간",
};

function deriveTags(job) {
  const haystack = `${job.title} ${job.org}`;
  const tags = new Set();

  // 활동유형 1개 (항상 들어가도록)
  const at = ACTIVITY_TO_TAG[job.activityType];
  if (at) tags.add(at);

  // 키워드 기반
  for (const [re, addTags] of KEYWORD_TO_TAGS) {
    if (re.test(haystack)) {
      for (const t of addTags) tags.add(t);
    }
  }

  // 기존 jobTags 보존
  for (const t of job.jobTags ?? []) tags.add(t);

  // 너무 많으면 자르고, 너무 적으면 활동유형으로 보완
  const arr = Array.from(tags);
  if (arr.length === 0) {
    arr.push("공익"); // 최후 fallback
  }
  // 최대 5개로 제한
  return arr.slice(0, 5);
}

const text = fs.readFileSync(FILE, "utf8");
const lines = text.split(/\r?\n/);

let modified = 0;
const newLines = lines.map((line) => {
  // 한 줄에 들어있는 job 객체 찾기 (시작 `{"id":`, 끝 `},`)
  const m = line.match(/^(\s*)(\{.*\})(,?)\s*$/);
  if (!m) return line;

  let obj;
  try {
    // 후행 콤마 제외하고 파싱 시도
    obj = JSON.parse(m[2]);
  } catch {
    return line; // 객체 아니면 패스
  }
  // job 형태 검증
  if (!obj.id || !obj.title || !Array.isArray(obj.jobTags)) return line;

  const newTags = deriveTags(obj);
  obj.jobTags = newTags;

  modified += 1;
  return `${m[1]}${JSON.stringify(obj)}${m[3]}`;
});

fs.writeFileSync(FILE, newLines.join("\n"), "utf8");
console.log(`Enriched ${modified} jobs in ${path.basename(FILE)}`);
