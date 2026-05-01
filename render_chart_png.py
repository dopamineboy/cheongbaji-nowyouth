"""HTML 차트 → PNG 렌더링 (Chrome headless)."""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = Path(r"C:\Users\User\Desktop\모두의창업-도우다\captures\proposal")

TARGETS = [
    ("01_mau_growth.html", "01_mau_growth.png", 1680, 1500),
    ("02_revenue_stack.html", "02_revenue_stack.png", 1680, 1500),
    ("03_system_architecture.html", "03_system_architecture.png", 1680, 2200),
]


def render(html_name: str, png_name: str, width: int, height: int):
    src = BASE / html_name
    dst = BASE / png_name
    with tempfile.TemporaryDirectory() as tmp:
        tmp_png = Path(tmp) / "out.png"
        tmp_profile = Path(tmp) / "profile"
        cmd = [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-sandbox",
            f"--window-size={width},{height}",
            f"--user-data-dir={tmp_profile}",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=8000",
            f"--screenshot={tmp_png}",
            src.as_uri(),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if not tmp_png.exists():
            print(f"FAIL: {png_name}")
            print(result.stderr[:600])
            return False
        shutil.copyfile(tmp_png, dst)
        size = dst.stat().st_size / 1024
        print(f"OK  : {png_name} ({size:.0f} KB)")
        return True


def main():
    ok = all(render(*t) for t in TARGETS)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
