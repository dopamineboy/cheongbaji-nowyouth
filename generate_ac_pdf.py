"""청바지(NowYouth) AC 투자 기획서 — Markdown → PDF 변환."""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"C:\Users\User\Desktop\cheongbaji-nowyouth")
MD_PATH = BASE / "청바지_AC투자_기획서.md"
HTML_PATH_FINAL = BASE / "청바지_AC투자_기획서.html"
PDF_PATH_FINAL = BASE / "청바지_AC투자_기획서.pdf"
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
img {
  max-width: 100%; height: auto;
  display: block; margin: 16px auto;
  border: 1px solid #e0e4ef; border-radius: 6px;
  page-break-inside: avoid;
}
h1 {
  font-size: 22pt; color: #2c3e8f; border-bottom: 3px solid #4a5bc7;
  padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px;
  page-break-after: avoid;
}
h2 {
  font-size: 16pt; color: #2c3e8f; border-left: 5px solid #4a5bc7;
  padding-left: 12px; margin-top: 28px; margin-bottom: 12px;
  page-break-after: avoid;
}
h3 {
  font-size: 13pt; color: #3a4db3; margin-top: 20px; margin-bottom: 8px;
  page-break-after: avoid;
}
h4 { font-size: 11.5pt; color: #444; margin-top: 16px; }
p { margin: 8px 0; }
strong { color: #1a2a6c; }
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
  background: #4a5bc7; color: white; padding: 8px 10px;
  text-align: left; border: 1px solid #3a4db3;
}
td {
  padding: 7px 10px; border: 1px solid #d0d6e6; vertical-align: top;
}
tr:nth-child(even) td { background: #f5f7fc; }
code {
  background: #f3f4f8; padding: 2px 6px; border-radius: 3px;
  font-family: "Consolas", monospace; font-size: 9.5pt; color: #c0392b;
}
pre {
  background: #f8f9fb; border: 1px solid #e0e4ef;
  padding: 12px; border-radius: 4px; overflow-x: auto;
  font-family: "Consolas", monospace; font-size: 9pt; line-height: 1.4;
  page-break-inside: avoid;
}
pre code { background: none; padding: 0; color: #333; }
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }
hr {
  border: none; border-top: 2px solid #4a5bc7;
  margin: 28px 0; page-break-after: avoid;
}
a { color: #4a5bc7; text-decoration: none; }
/* Executive Summary, Closing 등 테이블 강조 */
h2 + table, h2 + p + table { box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>청바지(NowYouth) AC 투자 기획서</title>
<style>{css}</style>
</head>
<body>
{body}
</body>
</html>
"""


def absolutize_images(html: str) -> str:
    """상대 경로 이미지 src를 BASE 기준 file:// URI로 치환 (임시 디렉터리에서도 로드 가능)."""
    base_uri = BASE.as_uri() + "/"

    def repl(match):
        before = match.group(1)
        src = match.group(2)
        if src.startswith(("http://", "https://", "file://", "data:", "//")):
            return match.group(0)
        return f'<img{before}src="{base_uri}{src}"'

    return re.sub(r'<img([^>]*?)src="([^"]+)"', repl, html)


def main():
    md_text = MD_PATH.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "attr_list", "toc", "sane_lists"],
    )
    html_body = absolutize_images(html_body)
    full_html = HTML_TEMPLATE.format(css=CSS, body=html_body)

    # 최종 한글 이름 HTML 저장 (참고용)
    HTML_PATH_FINAL.write_text(full_html, encoding="utf-8")

    # Edge는 한글 경로·파일명 처리가 불안정 → 임시 영문 경로에서 생성 후 이동
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_html = Path(tmpdir) / "proposal.html"
        tmp_pdf = Path(tmpdir) / "proposal.pdf"
        tmp_html.write_text(full_html, encoding="utf-8")

        browser = find_browser()
        print(f"Browser: {browser}")
        # Chrome/Edge headless PDF 출력. 사용자 데이터 디렉토리 분리.
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
            # legacy headless 재시도
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
