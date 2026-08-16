#!/usr/bin/env bash
# Configure ADB pour le projet livreur (WSL + fallback Windows/Android Studio).
set -euo pipefail

WSL_ADB="${HOME}/.local/android/sdk/platform-tools"
WIN_ADB="/mnt/c/Users/kadso/AppData/Local/Android/Sdk/platform-tools/adb.exe"

echo "=== ADB LaPlasse Livraison ==="
echo

if [[ -x "${WSL_ADB}/adb" ]]; then
  echo "✓ ADB WSL  : ${WSL_ADB}/adb"
  export PATH="${WSL_ADB}:${PATH}"
else
  echo "✗ ADB WSL introuvable dans ${WSL_ADB}"
  echo "  Installez platform-tools :"
  echo "  ${WSL_ADB}/..  → sdkmanager \"platform-tools\""
fi

if [[ -f "${WIN_ADB}" ]]; then
  echo "✓ ADB Windows (Android Studio) : ${WIN_ADB}"
else
  echo "✗ adb.exe Android Studio introuvable (chemin Windows habituel)"
  echo "  Android Studio → SDK Manager → SDK Tools → Android SDK Platform-Tools"
fi

echo
echo "=== Test connexion téléphone ==="
echo "Sur le téléphone : Débogage USB ON + autoriser cet ordinateur (RSA)"
echo "Mode USB : Transfert de fichiers (MTP), pas \"Charge uniquement\""
echo

DEV_WSL=""
if command -v adb >/dev/null 2>&1; then
  DEV_WSL=$(adb devices 2>/dev/null | grep -c 'device$' || true)
  echo "WSL adb devices :"
  adb devices -l || true
fi

DEV_WIN=0
if [[ -f "${WIN_ADB}" ]]; then
  echo
  echo "Windows adb.exe devices :"
  DEV_WIN=$("${WIN_ADB}" devices 2>/dev/null | grep -c 'device$' || true)
  "${WIN_ADB}" devices -l || true
fi

echo
if [[ "${DEV_WSL}" -gt 0 ]]; then
  echo "→ Utilisez : export PATH=\"${WSL_ADB}:\$PATH\" && pnpm log:crash"
elif [[ "${DEV_WIN}" -gt 0 ]]; then
  echo "→ Téléphone visible sous Windows. Dans PowerShell :"
  echo "  cd C:\\Users\\kadso\\projets\\laplasse\\apps\\courier"
  echo "  .\\scripts\\capture-crash-log.ps1"
  echo
  echo "  Ou depuis WSL avec :"
  echo "  ADB='${WIN_ADB}' pnpm log:crash"
else
  echo "❌ Aucun appareil détecté."
  echo
  echo "Checklist :"
  echo "  1. Câble USB data (pas charge seule)"
  echo "  2. Téléphone déverrouillé → popup « Autoriser le débogage USB » → OK"
  echo "  3. Options développeur → Débogage USB activé"
  echo "  4. Windows : installer pilote USB (Android Studio → SDK Manager → Google USB Driver)"
  echo
  echo "WSL2 : le USB reste souvent côté Windows. Deux options :"
  echo "  A) PowerShell : .\\scripts\\capture-crash-log.ps1  (recommandé)"
  echo "  B) Installer usbipd-win pour brancher le USB dans WSL"
fi
