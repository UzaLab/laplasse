#!/usr/bin/env bash
# Déploiement Coolify séquentiel — une app à la fois pour VPS limité.
# Usage:
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh preprod
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh prod
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh all
#   COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh api-preprod   # une seule app
set -euo pipefail

COOLIFY_HOST="${COOLIFY_HOST:-http://178.105.113.184:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:?Définir COOLIFY_TOKEN}"

API_PREPROD="z145ag9pnpqb0y864cwodsfk"
API_PROD="iaai1jhevil8prxsusoptfin"
WEB_PREPROD="i5nviaj74152319gctpeyq27"
WEB_PROD="pn73rp4w4dk0wyxfazyk0se0"

POLL_SEC="${POLL_SEC:-30}"
MAX_POLLS="${MAX_POLLS:-40}"

deploy_one() {
  local uuid="$1" name="$2"
  echo ""
  echo "▶ Déploiement: $name"
  local resp dep st
  resp=$(curl -sf -X POST "$COOLIFY_HOST/api/v1/deploy" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"uuid\":\"$uuid\",\"force\":${FORCE:-false}}")
  dep=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['deployments'][0]['deployment_uuid'])")
  echo "  uuid=$dep"

  for ((i=1; i<=MAX_POLLS; i++)); do
    st=$(curl -sf "$COOLIFY_HOST/api/v1/deployments/$dep" \
      -H "Authorization: Bearer $COOLIFY_TOKEN" \
      | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))")
    echo "  [$i/$MAX_POLLS] $st"
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
  for entry in "$@"; do
    IFS='|' read -r uuid name <<< "$entry"
    deploy_one "$uuid" "$name" || true
  done
}

TARGET="${1:-all}"
FORCE="${FORCE:-false}"

case "$TARGET" in
  preprod)
    run_set "Préproduction" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    ;;
  prod)
    run_set "Production" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    ;;
  all)
    run_set "Préproduction" \
      "$API_PREPROD|laplasse-api-preprod" \
      "$WEB_PREPROD|laplasse-web-preprod"
    run_set "Production" \
      "$API_PROD|laplasse-api-prod" \
      "$WEB_PROD|laplasse-web-prod"
    ;;
  api-preprod) deploy_one "$API_PREPROD" "laplasse-api-preprod" ;;
  api-prod)    deploy_one "$API_PROD" "laplasse-api-prod" ;;
  web-preprod) deploy_one "$WEB_PREPROD" "laplasse-web-preprod" ;;
  web-prod)    deploy_one "$WEB_PROD" "laplasse-web-prod" ;;
  *)
    echo "Cible inconnue: $TARGET"
    echo "Usage: $0 {preprod|prod|all|api-preprod|api-prod|web-preprod|web-prod}"
    exit 1
    ;;
esac

echo ""
echo "Terminé."
