"""추가 문서(서비스구현·4대통합서비스) — Markdown → PDF 변환."""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"C:\Users\User\Desktop\모두의창업-도우다")

TARGETS = [
    ("청바지_서비스구현_실행계획서", "청바지(NowYouth) 서비스 구현·전달 실행 계획서"),
    ("청바지_4대통합서비스_구현계획서", "청바지(NowYouth) 4대 통합 서비스 구현 상세 계획서"),
]

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
  font-size: 22pt; color: #0b4a96; border-bottom: 3px solid #1f6feb;
  padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px;
  page-break-after: avoid;
}
h2 {
  font-size: 16pt; color: #0b4a96; border-left: 5px solid #1f6feb;
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
  font-size: 9.5pt; page-break-inside: avoid;
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
  font-size: 8pt; line-height: 1.35;
  page-break-inside: avoid; white-space: pre;
}
pre code { background: none; padding: 0; color: #333; font-size: 8pt; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
hr {
  border: none; border-top: 2px solid #1f6feb;
  margin: 28px 0; page-break-after: avoid;
}
a { color: #1f6feb; text-decoration: none; }
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{css}</style>
</head>
<body>
{body}
</body>
</html>
"""


def convert_one(stem: str, title: str) -> None:
    md_path = BASE / f"{stem}.md"
    html_path_final = BASE / f"{stem}.html"
    pdf_path_final = BASE / f"{stem}.pdf"

    md_text = md_path.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "attr_list", "toc", "sane_lists"],
    )
    full_html = HTML_TEMPLATE.format(title=title, css=CSS, body=html_body)
    html_path_final.write_text(full_html, encoding="utf-8")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_html = Path(tmpdir) / "doc.html"
        tmp_pdf = Path(tmpdir) / "doc.pdf"
        tmp_html.write_text(full_html, encoding="utf-8")

        browser = find_browser()
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
            print(f"[FAIL] {stem}: PDF 생성 실패")
            print("STDERR:", result.stderr[:500])
            return

        shutil.copyfile(tmp_pdf, pdf_path_final)

    size = pdf_path_final.stat().st_size / 1024
    print(f"[OK] {pdf_path_final.name} ({size:.0f} KB)")


def main():
    print(f"Browser: {find_browser()}")
    for stem, title in TARGETS:
        convert_one(stem, title)


if __name__ == "__main__":
    main()
