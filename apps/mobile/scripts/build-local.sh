#!/usr/bin/env bash
# Build APK/AAB locally via EAS (no cloud queue).
# Requires: Docker, Java 17 (JDK), eas-cli, EAS login (`eas login`).
#
# Usage:
#   ./scripts/build-local.sh                    # preview APK (default)
#   ./scripts/build-local.sh production         # production AAB/APK
#   ./scripts/build-local.sh preview android    # explicit platform
#   PROFILE=development ./scripts/build-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROFILE="${PROFILE:-${1:-preview}}"
PLATFORM="${PLATFORM:-${2:-android}}"
OUTPUT_DIR="$ROOT/dist"

die() {
  echo "❌ $*" >&2
  exit 1
}

info() {
  echo "→ $*"
}

# ── Java (required for Gradle on the host during --local builds) ─────────────

detect_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    return 0
  fi

  local candidates=(
    "${HOME}/.local/java/jdk-17"
    /usr/lib/jvm/java-17-openjdk-amd64
    /usr/lib/jvm/java-17-openjdk-arm64
    /usr/lib/jvm/java-21-openjdk-amd64
    /usr/lib/jvm/java-21-openjdk-arm64
    /usr/lib/jvm/default-java
  )

  for dir in "${candidates[@]}"; do
    if [[ -x "$dir/bin/java" ]]; then
      export JAVA_HOME="$dir"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done

  return 1
}

if ! detect_java_home; then
  cat >&2 <<'EOF'
❌ Java (JDK 17+) introuvable — requis pour Gradle lors d'un build local EAS.

Installez-le sous WSL/Ubuntu :
  sudo apt update
  sudo apt install -y openjdk-17-jdk

Puis vérifiez :
  java -version
  echo $JAVA_HOME   # ou export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

Relancez ensuite : pnpm mobile:build:preview
EOF
  exit 1
fi

info "Java      : $(java -version 2>&1 | head -1)"
info "JAVA_HOME : $JAVA_HOME"

# ── Android SDK (required for Gradle assembleRelease) ─────────────────────────

detect_android_home() {
  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}/platforms" ]]; then
    return 0
  fi

  local candidates=(
    "${HOME}/.local/android/sdk"
    "${HOME}/Android/Sdk"
    "/mnt/c/Users/${USER}/AppData/Local/Android/Sdk"
  )

  for dir in "${candidates[@]}"; do
    if [[ -d "$dir/platforms" ]]; then
      export ANDROID_HOME="$dir"
      export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
      return 0
    fi
  done

  return 1
}

if ! detect_android_home; then
  cat >&2 <<'EOF'
❌ Android SDK introuvable — requis pour Gradle.

Installez-le (WSL, sans sudo) :
  mkdir -p ~/.local/android/sdk/cmdline-tools
  # puis sdkmanager platform-tools platforms;android-36 build-tools;36.0.0

Ou définissez ANDROID_HOME si déjà installé (Android Studio).
Relancez : pnpm mobile:build:preview
EOF
  exit 1
fi

info "ANDROID_HOME : $ANDROID_HOME"

# ── Other prerequisites ──────────────────────────────────────────────────────

command -v eas >/dev/null 2>&1 || die "eas-cli manquant. Installez-le : npm install -g eas-cli"

if ! docker info >/dev/null 2>&1; then
  cat >&2 <<'EOF'
❌ Docker n'est pas démarré.

Sous WSL2 :
  • Docker Desktop (Windows) → Settings → Resources → WSL Integration → activer votre distro
  • ou : sudo service docker start

Puis relancez ce script.
EOF
  exit 1
fi

if ! eas whoami >/dev/null 2>&1; then
  die "Non connecté à EAS. Lancez : eas login"
fi

mkdir -p "$OUTPUT_DIR"

# EAS local + Gradle use /tmp by default (tmpfs ~8 Go on WSL) — redirect to disk.
# Ne pas fixer EAS_LOCAL_BUILD_WORKINGDIR : eas CLI y dépose project.tar.gz avant le
# plugin local, qui exige ensuite un dossier vide → conflit garanti.
BUILD_CACHE_DIR="${BUILD_CACHE_DIR:-$HOME/.cache/laplasse-eas-build}"
mkdir -p "$BUILD_CACHE_DIR"
export TMPDIR="$BUILD_CACHE_DIR/tmp"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$BUILD_CACHE_DIR/gradle}"
mkdir -p "$TMPDIR" "$GRADLE_USER_HOME"
info "Build cache: $BUILD_CACHE_DIR (disque, hors projet)"

# Ancien répertoire working (script précédent) — libérer l'espace si présent.
LEGACY_WORKING="$BUILD_CACHE_DIR/working"
if [[ -d "$LEGACY_WORKING" ]]; then
  info "Suppression de l'ancien cache working ($LEGACY_WORKING)…"
  rm -rf "$LEGACY_WORKING" 2>/dev/null || info "  (ignoré si fichiers root — sudo rm -rf \"$LEGACY_WORKING\")"
fi
unset EAS_LOCAL_BUILD_WORKINGDIR

# ── Low-resource mode (recommended on WSL) ───────────────────────────────────
# Usage: BUILD_LOW_RESOURCE=1 pnpm mobile:build:preview

if [[ "${BUILD_LOW_RESOURCE:-0}" == "1" ]]; then
  export GRADLE_OPTS="${GRADLE_OPTS:-} -Xmx1536m -XX:MaxMetaspaceSize=384m -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=1"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
  # Limit parallel npm/pnpm inside EAS local worker when possible
  export EAS_BUILD_NPM_CACHE_URL=""
  info "Mode low-resource : Gradle 1 worker, heap 1.5 Go, Node 2 Go"
fi

# Skip expo-doctor if version warnings reappear (optional safety net)
export EAS_BUILD_DISABLE_EXPO_DOCTOR_STEP=1

# ── Output filename ──────────────────────────────────────────────────────────

TIMESTAMP="$(date +%Y%m%d-%H%M)"
case "$PROFILE" in
  preview)     OUTPUT_FILE="$OUTPUT_DIR/laplasse-preview-${TIMESTAMP}.apk" ;;
  production)  OUTPUT_FILE="$OUTPUT_DIR/laplasse-production-${TIMESTAMP}.aab" ;;
  development) OUTPUT_FILE="$OUTPUT_DIR/laplasse-dev-${TIMESTAMP}.apk" ;;
  *)           OUTPUT_FILE="$OUTPUT_DIR/laplasse-${PROFILE}-${TIMESTAMP}.apk" ;;
esac

info "Profil    : $PROFILE"
info "Plateforme: $PLATFORM"
info "Sortie    : $OUTPUT_FILE"
info "Build local EAS en cours (Docker + Gradle, ~10-20 min la 1ère fois)…"
echo

eas build \
  --profile "$PROFILE" \
  --platform "$PLATFORM" \
  --local \
  --output "$OUTPUT_FILE"

echo
info "Build terminé : $OUTPUT_FILE"
info "Installer sur un appareil Android : adb install -r \"$OUTPUT_FILE\""
