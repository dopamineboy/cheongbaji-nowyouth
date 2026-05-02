#!/usr/bin/env node
// 워크넷 API 빠른 점검 도구.
//
// 사용:
//   WORKNET_API_KEY=발급받은키 node scripts/test-worknet.mjs
//   또는 .env.local에 WORKNET_API_KEY 입력 후 그냥 실행.
//
// 결과:
//   - 응답 상태(HTTP)
//   - 첫 5건 채용공고 제목·회사·지역
//   - 응답 형식(XML/JSON) 자동 감지

import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.join(process.cwd(), ".env.local");
if (!process.env.WORKNET_API_KEY && fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const KEY = process.env.WORKNET_API_KEY;
if (!KEY) {
  console.error("❌ WORKNET_API_KEY 환경 변수가 없습니다. .env.local에 입력하거나 셸에서 설정하세요.");
  process.exit(1);
}

const url = new URL(
  process.env.WORKNET_API_ENDPOINT ??
    "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do",
);
url.searchParams.set("authKey", KEY);
url.searchParams.set("returnType", "JSON");
url.searchParams.set("callTp", "L");
url.searchParams.set("startPage", "1");
url.searchParams.set("display", "10");
url.searchParams.set("minAge", "60");

console.log("→ GET", url.toString().replace(KEY, "***"));

const res = await fetch(url);
console.log(`HTTP ${res.status} ${res.statusText}`);
const text = await res.text();

if (text.trim().startsWith("<")) {
  console.log("형식: XML");
  const blocks = text.match(/<wanted>[\s\S]*?<\/wanted>/g) ?? [];
  console.log(`총 ${blocks.length}건`);
  blocks.slice(0, 5).forEach((b, i) => {
    const get = (tag) => b.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`))?.[1] ?? "";
    console.log(`  [${i + 1}] ${get("wantedTitle")} | ${get("company")} | ${get("region")} | ${get("closeDt")}`);
  });
  if (blocks.length === 0) {
    console.log("--- 응답 본문 (앞 600자) ---");
    console.log(text.slice(0, 600));
  }
} else {
  console.log("형식: JSON");
  const data = JSON.parse(text);
  console.log("키:", Object.keys(data));
  const items = Array.isArray(data) ? data : data.items ?? data.wantedRoot?.wanted ?? [];
  console.log(`총 ${items.length}건`);
  items.slice(0, 5).forEach((item, i) => {
    console.log(`  [${i + 1}]`, item.wantedTitle ?? item.title, "|", item.company, "|", item.region);
  });
}
