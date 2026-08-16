#!/usr/bin/env bash
# Build APK livreur (LaPlasse Livraison) via EAS local.
# Prérequis : Docker, Java 17+, eas-cli (`npm i -g eas-cli`), `eas login`.
# Première fois : `cd apps/courier && eas init` pour obtenir un projectId EAS.
#
# Usage:
#   ./scripts/build-local.sh
#   ./scripts/build-local.sh production
#   BUILD_LOW_RESOURCE=1 ./scripts/build-local.sh

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
  die "Java 17+ requis. Relancez : pnpm courier:build:preview"
fi

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
  die "Android SDK introuvable. Relancez : pnpm courier:build:preview"
fi

command -v eas >/dev/null 2>&1 || die "eas-cli manquant : npm install -g eas-cli"
docker info >/dev/null 2>&1 || die "Docker n'est pas démarré"
eas whoami >/dev/null 2>&1 || die "Non connecté à EAS : eas login"

mkdir -p "$OUTPUT_DIR"

BUILD_CACHE_DIR="${BUILD_CACHE_DIR:-$HOME/.cache/laplasse-eas-build-courier}"
mkdir -p "$BUILD_CACHE_DIR"
export TMPDIR="$BUILD_CACHE_DIR/tmp"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$BUILD_CACHE_DIR/gradle}"
mkdir -p "$TMPDIR" "$GRADLE_USER_HOME"
unset EAS_LOCAL_BUILD_WORKINGDIR

if [[ "${CLEAN_BUILD:-0}" == "1" ]]; then
  info "Nettoyage cache Gradle/EAS (CLEAN_BUILD=1)…"
  rm -rf "$GRADLE_USER_HOME/caches" "$GRADLE_USER_HOME/daemon" "$BUILD_CACHE_DIR/tmp" 2>/dev/null || true
  rm -rf "$ROOT/android" "$ROOT/.expo" 2>/dev/null || true
fi

if [[ "${BUILD_LOW_RESOURCE:-0}" == "1" ]]; then
  export GRADLE_OPTS="${GRADLE_OPTS:-} -Xmx1536m -XX:MaxMetaspaceSize=384m -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=1"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
  info "Mode low-resource activé"
fi

export EAS_BUILD_DISABLE_EXPO_DOCTOR_STEP=1

TIMESTAMP="$(date +%Y%m%d-%H%M)"
case "$PROFILE" in
  preview)     OUTPUT_FILE="$OUTPUT_DIR/laplasse-livraison-preview-${TIMESTAMP}.apk" ;;
  production)  OUTPUT_FILE="$OUTPUT_DIR/laplasse-livraison-production-${TIMESTAMP}.aab" ;;
  development) OUTPUT_FILE="$OUTPUT_DIR/laplasse-livraison-dev-${TIMESTAMP}.apk" ;;
  *)           OUTPUT_FILE="$OUTPUT_DIR/laplasse-livraison-${PROFILE}-${TIMESTAMP}.apk" ;;
esac

info "App       : LaPlasse Livraison (courier)"
info "Profil    : $PROFILE"
info "Plateforme: $PLATFORM"
info "Sortie    : $OUTPUT_FILE"

eas build \
  --profile "$PROFILE" \
  --platform "$PLATFORM" \
  --local \
  --output "$OUTPUT_FILE"

info "Build terminé : $OUTPUT_FILE"
info "Install : adb install -r \"$OUTPUT_FILE\""
