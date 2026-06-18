#!/usr/bin/env bash
# Déploiement Coolify séquentiel — une app à la fois pour VPS limité.
#
# Usage:
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh recover-prod   # redémarre sans rebuild (504 → remettre en ligne)
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh api-prod        # un seul build
#   FORCE=true  COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh web-prod
#
# Sur VPS modeste : un build Web (~30-45 min) provoque des 504 temporaires — normal.
# Ne jamais enchaîner plusieurs builds sans laisser le VPS se stabiliser.
set -euo pipefail

COOLIFY_HOST="${COOLIFY_HOST:-http://178.105.113.184:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:?Définir COOLIFY_TOKEN}"

API_PREPROD="z145ag9pnpqb0y864cwodsfk"
API_PROD="iaai1jhevil8prxsusoptfin"
WEB_PREPROD="i5nviaj74152319gctpeyq27"
WEB_PROD="pn73rp4w4dk0wyxfazyk0se0"

POLL_SEC="${POLL_SEC:-60}"
MAX_POLLS="${MAX_POLLS:-50}"
CURL_MAX="${CURL_MAX:-30}"
COOLDOWN_SEC="${COOLDOWN_SEC:-90}"
FORCE="${FORCE:-false}"
RESTART_ONLY="${RESTART_ONLY:-false}"

curl_json() {
  local url="$1"
  shift
  local tmp code attempt
  tmp=$(mktemp)
  for attempt in 1 2 3; do
    code=$(curl -sS --max-time "$CURL_MAX" -o "$tmp" -w "%{http_code}" "$@" "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]] && [[ -s "$tmp" ]]; then
      cat "$tmp"
      rm -f "$tmp"
      return 0
    fi
    echo "  retry curl ($attempt/3) http=$code" >&2
    sleep 20
  done
  rm -f "$tmp"
  return 1
}

curl_light() {
  local url="$1"
  shift
  curl -sS --max-time 15 "$@" "$url" 2>/dev/null || true
}

wait_for_coolify() {
  echo "⏳ Attente API Coolify..."
  for i in $(seq 1 20); do
    local code
    code=$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}" \
      "$COOLIFY_HOST/api/v1/version" -H "Authorization: Bearer $COOLIFY_TOKEN" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
      echo "✓ Coolify disponible"
      return 0
    fi
    echo "  [$i/20] Coolify indisponible (http=$code), pause 15s..."
    sleep 15
  done
  echo "✗ Coolify toujours indisponible"
  return 1
}

wait_for_health() {
  local url="$1" label="$2"
  echo "⏳ Attente $label ($url)..."
  for i in $(seq 1 15); do
    local code
    code=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
      echo "✓ $label OK"
      return 0
    fi
    echo "  [$i/15] $label → $code"
    sleep 10
  done
  echo "⚠ $label pas encore OK (continuer quand même)"
  return 0
}

post_deploy() {
  local uuid="$1"
  curl_json "$COOLIFY_HOST/api/v1/deploy" \
    -X POST \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"uuid\":\"$uuid\",\"force\":${FORCE},\"restart_only\":${RESTART_ONLY}}"
}

deploy_status() {
  local dep="$1"
  curl_light "$COOLIFY_HOST/api/v1/deployments/$dep" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "?"
}

deploy_one() {
  local uuid="$1" name="$2"
  local polls="${3:-$MAX_POLLS}"
  echo ""
  if [[ "$RESTART_ONLY" == "true" ]]; then
    echo "▶ Redémarrage (sans rebuild): $name"
  else
    echo "▶ Déploiement: $name"
    echo "  ⚠ Les 504 pendant le build sont normaux sur ce VPS — ne pas relancer d'autres builds."
  fi
  local resp dep st
  resp=$(post_deploy "$uuid") || { echo "✗ $name (échec POST deploy)"; return 1; }
  dep=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['deployments'][0]['deployment_uuid'])")
  echo "  uuid=$dep"

  for ((i=1; i<=polls; i++)); do
    st=$(deploy_status "$dep")
    echo "  [$i/$polls] $st"
    case "$st" in
      finished) echo "✓ $name"; return 0 ;;
      failed|cancelled|cancelled-by-user) echo "✗ $name ($st)"; return 1 ;;
    esac
    sleep "$POLL_SEC"
  done
  echo "✗ $name (timeout)"; return 1
}

run_set() {
  local label="$1"; shift
  echo "═══ $label ═══"
  local first=true
  for entry in "$@"; do
    IFS='|' read -r uuid name <<< "$entry"
    if [[ "$first" != "true" ]]; then
      echo ""
      echo "⏸ Pause ${COOLDOWN_SEC}s (stabilisation VPS)..."
      sleep "$COOLDOWN_SEC"
    fi
    first=false
    deploy_one "$uuid" "$name" || true
  done
}

TARGET="${1:-all}"

case "$TARGET" in
  recover-prod)
    wait_for_coolify || exit 1
    RESTART_ONLY=true FORCE=false
    run_set "Recovery prod (restart sans rebuild)" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    wait_for_health "https://api.178.105.113.184.sslip.io/api/health" "API prod"
    wait_for_health "https://178.105.113.184.sslip.io/" "Web prod"
    ;;
  recover-preprod)
    wait_for_coolify || exit 1
    RESTART_ONLY=true FORCE=false
    run_set "Recovery preprod" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    ;;
  preprod)
    wait_for_coolify || exit 1
    run_set "Préproduction" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    ;;
  prod)
    wait_for_coolify || exit 1
    run_set "Production" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    ;;
  all)
    wait_for_coolify || exit 1
    run_set "Préproduction" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    run_set "Production" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    ;;
  api-preprod)
    wait_for_coolify || exit 1
    deploy_one "$API_PREPROD" "laplasse-api-preprod" 20
    ;;
  api-prod)
    wait_for_coolify || exit 1
    deploy_one "$API_PROD" "laplasse-api-prod" 20
    ;;
  web-preprod)
    wait_for_coolify || exit 1
    deploy_one "$WEB_PREPROD" "laplasse-web-preprod" 80
    ;;
  web-prod)
    wait_for_coolify || exit 1
    deploy_one "$WEB_PROD" "laplasse-web-prod" 80
    ;;
  prod-first)
    wait_for_coolify || exit 1
    run_set "Production (prioritaire)" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    run_set "Préproduction" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    ;;
  *)
    echo "Cible inconnue: $TARGET"
    echo "Usage: $0 {recover-prod|recover-preprod|preprod|prod|all|prod-first|api-preprod|api-prod|web-preprod|web-prod}"
    exit 1
    ;;
esac

echo ""
echo "Terminé."
