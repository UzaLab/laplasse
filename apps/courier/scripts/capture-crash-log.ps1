# Capture logcat crash — lancer dans PowerShell Windows (Android Studio / USB).
param(
  [string]$OutFile = "$PSScriptRoot\..\dist\last-crash-log.txt"
)

$adbCandidates = @(
  "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
  "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
)

$adb = $adbCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $adb) {
  Write-Error "adb.exe introuvable. Android Studio → SDK Manager → Android SDK Platform-Tools"
  exit 1
}

Write-Host "→ ADB : $adb"
& $adb kill-server 2>$null
Start-Sleep -Seconds 1
& $adb start-server

$devices = & $adb devices | Select-String "device$"
if (-not $devices) {
  Write-Host "❌ Aucun téléphone. Branchez-le, acceptez « Débogage USB », relancez." -ForegroundColor Red
  & $adb devices -l
  exit 1
}

$outDir = Split-Path $OutFile -Parent
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "→ Effacement logcat…"
& $adb logcat -c

Write-Host "→ Ouvrez LaPlasse Livraison sur le téléphone (crash)… Attente 25 s"
Start-Sleep -Seconds 25

Write-Host "→ Extraction vers $OutFile"
$header = "=== $(Get-Date -Format o) ==="
$logs = & $adb logcat -d -t 800
$filtered = $logs | Select-String -Pattern "AndroidRuntime|FATAL EXCEPTION|ReactNativeJS|ReactNative|laplasse|livraison|tech\.laplasse\.livraison|Hermes|SoLoader|expo\.modules|Fatal signal" -CaseSensitive:$false

@($header) + ($filtered | ForEach-Object { $_.Line }) | Set-Content -Encoding utf8 $OutFile

$count = ($filtered | Measure-Object).Count
Write-Host "→ $count lignes → $OutFile"
Get-Content $OutFile -Tail 40
