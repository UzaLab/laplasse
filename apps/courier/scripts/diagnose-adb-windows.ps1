# Diagnostic ADB Windows - telephone non detecte
# PowerShell: Set-ExecutionPolicy -Scope Process Bypass
#             .\scripts\diagnose-adb-windows.ps1

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== 1. adb.exe ===" -ForegroundColor Cyan
$paths = @(
  "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
  "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
)
$adb = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $adb) {
  Write-Host "adb.exe NOT FOUND" -ForegroundColor Red
  Write-Host "Android Studio -> SDK Manager -> SDK Tools -> Android SDK Platform-Tools"
  exit 1
}
Write-Host "OK: $adb" -ForegroundColor Green

Write-Host ""
Write-Host "=== 2. Restart ADB server ===" -ForegroundColor Cyan
& $adb kill-server 2>$null
Start-Sleep -Seconds 2
& $adb start-server
& $adb devices -l

Write-Host ""
Write-Host "=== 3. USB devices (Windows) ===" -ForegroundColor Cyan
Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue |
  Where-Object {
    $_.FriendlyName -match 'Android|ADB|Composite|Mobile|MTP|Samsung|Xiaomi|Pixel|Huawei|OPPO|OnePlus|Redmi|Motorola|Google' -or
    $_.InstanceId -match 'USB\\VID'
  } |
  Select-Object Status, Class, FriendlyName |
  Format-Table -AutoSize

Write-Host ""
Write-Host "=== 4. Drivers (Android Studio SDK Manager -> SDK Tools) ===" -ForegroundColor Cyan
Write-Host "  [x] Android SDK Platform-Tools"
Write-Host "  [x] Google USB Driver"
Write-Host "  Samsung: install Samsung USB Driver separately if needed"

Write-Host ""
Write-Host "=== 5. Phone checklist ===" -ForegroundColor Cyan
Write-Host "  - Developer options ON, USB debugging ON"
Write-Host "  - Use a DATA cable (not charge-only), try another port"
Write-Host "  - Phone UNLOCKED when plugging in"
Write-Host "  - USB mode: File transfer / MTP (not charge only)"
Write-Host "  - Accept RSA popup on phone"
Write-Host "  - No popup? Revoke USB debugging authorizations, unplug, replug"

Write-Host ""
Write-Host "=== 6. Wireless debugging (Android 11+, no USB) ===" -ForegroundColor Cyan
Write-Host "  Phone: Developer options -> Wireless debugging -> Pair device"
Write-Host "  PC:    adb pair IP:PORT"
Write-Host "         adb connect IP:PORT"
Write-Host "         adb devices"

Write-Host ""
Write-Host "=== 7. Close WSL terminals running adb ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Retry: & `"$adb`" devices -l"
