#!/usr/bin/env bash
# Capture logcat crash livreur — WSL ou adb.exe Windows (Android Studio).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist/last-crash-log.txt}"
WIN_ADB="/mnt/c/Users/kadso/AppData/Local/Android/Sdk/platform-tools/adb.exe"
WSL_ADB="${HOME}/.local/android/sdk/platform-tools/adb"

pick_adb() {
  if [[ -n "${ADB:-}" ]]; then
    echo "$ADB"
    return
  fi
  if [[ -x "$WSL_ADB" ]] && "$WSL_ADB" devices 2>/dev/null | grep -q 'device$'; then
    echo "$WSL_ADB"
    return
  fi
  if [[ -f "$WIN_ADB" ]] && "$WIN_ADB" devices 2>/dev/null | grep -q 'device$'; then
    echo "$WIN_ADB"
    return
  fi
  if [[ -x "$WSL_ADB" ]]; then
    echo "$WSL_ADB"
    return
  fi
  if [[ -f "$WIN_ADB" ]]; then
    echo "$WIN_ADB"
    return
  fi
  command -v adb || true
}

ADB_BIN="$(pick_adb || true)"
mkdir -p "$(dirname "$OUT")"

if [[ -z "$ADB_BIN" ]]; then
  cat > "$OUT" <<EOF
=== $(date -Iseconds) ===
ADB introuvable.

Installez Android SDK Platform-Tools :
  bash apps/courier/scripts/setup-adb.sh

Ou Android Studio → SDK Manager → SDK Tools → Android SDK Platform-Tools
EOF
  echo "❌ ADB introuvable. Voir $OUT" >&2
  exit 1
fi

echo "→ ADB : $ADB_BIN"
# Ne pas kill-server : casse le débogage sans fil déjà connecté
"$ADB_BIN" start-server 2>/dev/null || true

pick_device_serial() {
  if [[ -n "${ADB_SERIAL:-}" ]]; then
    echo "$ADB_SERIAL"
    return
  fi
  "$ADB_BIN" devices 2>/dev/null | awk 'NR>1 && $2=="device" { print $1; exit }'
}

ADB_SERIAL="$(pick_device_serial || true)"
if [[ -z "$ADB_SERIAL" ]]; then
  cat > "$OUT" <<EOF
=== $(date -Iseconds) ===
Aucun appareil ADB détecté.

Checklist :
1. Câble USB data + mode « Transfert de fichiers »
2. Débogage USB activé + popup RSA acceptée
3. Sous WSL2, utilisez souvent PowerShell :
   cd apps/courier
   .\\scripts\\capture-crash-log.ps1

Devices :
$("$ADB_BIN" devices -l 2>&1)
EOF
  echo "❌ Aucun appareil. Instructions écrites dans :" >&2
  echo "   $OUT" >&2
  "$ADB_BIN" devices -l >&2
  exit 1
fi

echo "→ Appareil : $ADB_SERIAL"
ADB_FLAGS=(-s "$ADB_SERIAL")

PKG="tech.laplasse.livraison"

echo "→ Effacement logcat…"
"$ADB_BIN" "${ADB_FLAGS[@]}" logcat -c

echo "→ Ouvrez l'app LaPlasse Livraison (crash)… Attente 25 s"
sleep 25

echo "→ Extraction vers $OUT"
{
  echo "=== $(date -Iseconds) ==="
  echo "ADB=$ADB_BIN"
  echo "SERIAL=$ADB_SERIAL"
  "$ADB_BIN" "${ADB_FLAGS[@]}" logcat -d -t 800 | grep -iE \
    "AndroidRuntime|FATAL EXCEPTION|ReactNativeJS|ReactNative|laplasse|livraison|${PKG}|Hermes|SoLoader|expo\.modules|Fatal signal" \
    || true
} > "$OUT"

LINES=$(wc -l < "$OUT")
echo "→ $LINES lignes → $OUT"
tail -40 "$OUT"
