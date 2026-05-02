# 청바지 프로젝트 — Claude Code Remote Control 빠른 시작
# 더블클릭하거나 PowerShell에서 실행하면 자동으로 청바지 프로젝트 디렉터리에서 claude 시작
# 첫 실행 시 /login 한 번만 진행하면 이후엔 자동.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  청바지(NowYouth) — Claude Code Remote Control" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 프로젝트 디렉터리 이동
$projectDir = "C:\Users\User\Desktop\모두의창업-도우다"
Set-Location $projectDir
Write-Host "프로젝트 디렉터리: $projectDir" -ForegroundColor Green
Write-Host ""

# Claude CLI 경로 확인
$claudeBin = "$env:APPDATA\Claude\claude-code\2.1.121\claude.exe"
if (-not (Test-Path $claudeBin)) {
    Write-Host "❌ Claude Code CLI를 찾지 못했습니다: $claudeBin" -ForegroundColor Red
    Write-Host "   Claude Desktop 앱이 실행 중이어야 자동 설치됩니다." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Claude CLI 버전 확인 중..." -ForegroundColor Yellow
& $claudeBin --version
Write-Host ""

Write-Host "📱 폰 Remote Control 안내" -ForegroundColor Cyan
Write-Host "  1. 잠시 후 'claude' 인터랙티브 세션이 시작됩니다." -ForegroundColor White
Write-Host "  2. 처음이면 /login 입력해서 Pro 계정으로 로그인하세요." -ForegroundColor White
Write-Host "  3. 그다음 슬래시 명령으로 Remote Control 시작:" -ForegroundColor White
Write-Host "       /remote-control" -ForegroundColor Green
Write-Host "  4. QR 코드가 표시되면 Claude iPhone/Android 앱에서 스캔하세요." -ForegroundColor White
Write-Host ""
Write-Host "  ⚠ 이 PowerShell 창을 끄면 폰 세션이 종료됩니다." -ForegroundColor Yellow
Write-Host ""
Write-Host "Enter 키를 눌러 시작..." -ForegroundColor Cyan
Read-Host

# 청바지 프로젝트 컨텍스트로 claude 시작
& $claudeBin --name "청바지(NowYouth)" --add-dir $projectDir
