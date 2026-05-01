// content/benefits/*.yml YAML 파일을 모두 로드 — 서버 컴포넌트 / Route Handler 전용
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Benefit } from "./matcher";

const BENEFITS_DIR = path.join(process.cwd(), "content", "benefits");

let _cached: Benefit[] | null = null;

export function loadAllBenefits(): Benefit[] {
  if (_cached) return _cached;
  if (!fs.existsSync(BENEFITS_DIR)) {
    _cached = [];
    return _cached;
  }
  _cached = fs
    .readdirSync(BENEFITS_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(BENEFITS_DIR, f), "utf-8");
      return yaml.load(raw) as Benefit;
    });
  return _cached;
}

export function loadBenefitById(id: string): Benefit | null {
  return loadAllBenefits().find((b) => b.id === id) ?? null;
}
