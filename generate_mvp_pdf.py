"""청바지(NowYouth) MVP 개발 실행 계획서 — Markdown → PDF 변환."""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"C:\Users\User\Desktop\모두의창업-도우다")
MD_PATH = BASE / "청바지_MVP_개발계획서.md"
HTML_PATH_FINAL = BASE / "청바지_MVP_개발계획서.html"
PDF_PATH_FINAL = BASE / "청바지_MVP_개발계획서.pdf"
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def find_browser():
    for p in CHROME_CANDIDATES:
        if Path(p).exists():
            return p
    raise RuntimeError("Chrome / Edge not found")


CSS = """
@page { size: A4; margin: 20mm 18mm; }
body {
  font-family: "Malgun Gothic", "맑은 고딕", sans-serif;
  font-size: 10.5pt; line-height: 1.6; color: #222;
  max-width: 100%; margin: 0; padding: 0;
}
h1 {
  font-size: 22pt; color: #1f6feb; border-bottom: 3px solid #1f6feb;
  padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px;
  page-break-after: avoid;
}
h2 {
  font-size: 16pt; color: #1f6feb; border-left: 5px solid #1f6feb;
  padding-left: 12px; margin-top: 28px; margin-bottom: 12px;
  page-break-after: avoid;
}
h3 {
  font-size: 13pt; color: #2d5fb9; margin-top: 20px; margin-bottom: 8px;
  page-break-after: avoid;
}
h4 { font-size: 11.5pt; color: #444; margin-top: 16px; }
p { margin: 8px 0; }
strong { color: #0b4a96; }
blockquote {
  border-left: 4px solid #ff9800; background: #fff8e7;
  padding: 10px 16px; margin: 12px 0; color: #5a4420;
  font-style: italic;
}
table {
  border-collapse: collapse; width: 100%; margin: 12px 0;
  font-size: 10pt; page-break-inside: avoid;
}
th {
  background: #1f6feb; color: white; padding: 8px 10px;
  text-align: left; border: 1px solid #0b4a96;
}
td {
  padding: 7px 10px; border: 1px solid #d0d6e6; vertical-align: top;
}
tr:nth-child(even) td { background: #f4f8ff; }
code {
  background: #f3f4f8; padding: 2px 6px; border-radius: 3px;
  font-family: "Consolas", "D2Coding", monospace;
  font-size: 9.5pt; color: #c0392b;
}
pre {
  background: #f8f9fb; border: 1px solid #e0e4ef;
  padding: 12px; border-radius: 4px; overflow-x: auto;
  font-family: "Consolas", "D2Coding", monospace;
  font-size: 8.5pt; line-height: 1.35;
  page-break-inside: avoid; white-space: pre;
}
pre code { background: none; padding: 0; color: #333; font-size: 8.5pt; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
hr {
  border: none; border-top: 2px solid #1f6feb;
  margin: 28px 0; page-break-after: avoid;
}
a { color: #1f6feb; text-decoration: none; }
/* 체크리스트 스타일 */
li input[type="checkbox"] { margin-right: 6px; }
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>청바지(NowYouth) MVP 개발 실행 계획서</title>
<style>{css}</style>
</head>
<body>
{body}
</body>
</html>
"""


def main():
    md_text = MD_PATH.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "attr_list", "toc", "sane_lists"],
    )
    full_html = HTML_TEMPLATE.format(css=CSS, body=html_body)

    HTML_PATH_FINAL.write_text(full_html, encoding="utf-8")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_html = Path(tmpdir) / "mvp_plan.html"
        tmp_pdf = Path(tmpdir) / "mvp_plan.pdf"
        tmp_html.write_text(full_html, encoding="utf-8")

        browser = find_browser()
        print(f"Browser: {browser}")
        user_data = Path(tmpdir) / "browser_profile"
        cmd = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=5000",
            f"--user-data-dir={user_data}",
            f"--print-to-pdf={tmp_pdf}",
            tmp_html.as_uri(),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if not tmp_pdf.exists():
            cmd_legacy = [
                browser,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--user-data-dir={user_data}",
                f"--print-to-pdf={tmp_pdf}",
                tmp_html.as_uri(),
            ]
            result = subprocess.run(cmd_legacy, capture_output=True, text=True, timeout=120)

        if not tmp_pdf.exists():
            print("PDF 생성 실패")
            print("RET:", result.returncode)
            print("STDOUT:", result.stdout[:1000])
            print("STDERR:", result.stderr[:1000])
            sys.exit(1)

        shutil.copyfile(tmp_pdf, PDF_PATH_FINAL)

    size = PDF_PATH_FINAL.stat().st_size / 1024
    print(f"PDF 생성 완료: {PDF_PATH_FINAL.name} ({size:.0f} KB)")
    print(f"경로: {PDF_PATH_FINAL}")


if __name__ == "__main__":
    main()
