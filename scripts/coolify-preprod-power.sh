#!/usr/bin/env bash
# Arrête ou démarre toute la stack preprod LaPlasse sur Coolify (libère RAM/CPU sur le VPS).
#
# Usage:
#   COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh stop
#   COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh start
#   COOLIFY_TOKEN=xxx ./scripts/coolify-preprod-power.sh status
#
# Doc complète : Docs/PREPROD_POWER_MANAGEMENT.md
set -euo pipefail

COOLIFY_HOST="${COOLIFY_HOST:-http://178.105.113.184:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:?Définir COOLIFY_TOKEN}"

# Ordre stop : front → back
STOP_ORDER=(
  "applications|i5nviaj74152319gctpeyq27|laplasse-web-preprod"
  "applications|z145ag9pnpqb0y864cwodsfk|laplasse-api-preprod"
  "services|s9i9rhxxfy86s93yulpeouwu|laplasse-meili-preprod"
  "databases|xzjbs8fiim0unys2guc01k00|laplasse-redis-preprod"
  "databases|zo2kc0vnvhqb1mtoba5cgsky|laplasse-db-preprod"
)

# Ordre start : back → front
START_ORDER=(
  "databases|zo2kc0vnvhqb1mtoba5cgsky|laplasse-db-preprod"
  "databases|xzjbs8fiim0unys2guc01k00|laplasse-redis-preprod"
  "services|s9i9rhxxfy86s93yulpeouwu|laplasse-meili-preprod"
  "applications|z145ag9pnpqb0y864cwodsfk|laplasse-api-preprod"
  "applications|i5nviaj74152319gctpeyq27|laplasse-web-preprod"
)

# Proxy média preprod — arrêté avec la stack preprod si MEDIA_PREPROD_UUID est défini
MEDIA_PREPROD_UUID="${MEDIA_PREPROD_UUID:-b81wyf4n0rszw1blm8s6i5pi}"

PAUSE_SEC="${PAUSE_SEC:-8}"

coolify_control() {
  local collection="$1" action="$2" uuid="$3" name="$4"
  local code
  code=$(curl -sS --max-time 30 -o /dev/null -w "%{http_code}" \
    -X POST "$COOLIFY_HOST/api/v1/$collection/$uuid/$action" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" 2>/dev/null || echo "000")

  if [[ "$code" == "200" ]] || [[ "$code" == "201" ]]; then
    echo "✓ $action $name"
  else
    echo "⚠ $action $name (http=$code)"
  fi
}

run_sequence() {
  local action="$1"
  shift
  local entries=("$@")
  echo "═══ Preprod : $action ═══"
  for entry in "${entries[@]}"; do
    IFS='|' read -r collection uuid name <<< "$entry"
    coolify_control "$collection" "$action" "$uuid" "$name"
    sleep "$PAUSE_SEC"
  done
  if [[ -n "$MEDIA_PREPROD_UUID" ]]; then
    coolify_control "applications" "$action" "$MEDIA_PREPROD_UUID" "laplasse-media-preprod"
  fi
}

check_health() {
  echo ""
  echo "═══ Vérification ═══"
  local api_code web_code
  api_code=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" \
    "https://api-preprod.laplasse.tech/api/health" 2>/dev/null || echo "000")
  web_code=$(curl -sS --max-time 10 -o /dev/null -w "%{http_code}" \
    "https://preprod.laplasse.tech/" 2>/dev/null || echo "000")
  echo "  API preprod  → $api_code (200 = OK, 000/502/503 = arrêté ou en cours)"
  echo "  Web preprod  → $web_code"
}

ACTION="${1:-}"

case "$ACTION" in
  stop)
    run_sequence "stop" "${STOP_ORDER[@]}"
    echo ""
    echo "Preprod arrêtée. Prod non impactée."
    ;;
  start)
    run_sequence "start" "${START_ORDER[@]}"
    echo ""
    echo "⏳ Attente stabilisation (30s)..."
    sleep 30
    check_health
    echo ""
    echo "Si l'API n'est pas OK : COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh recover-preprod"
    ;;
  status)
    check_health
    ;;
  *)
    echo "Usage: $0 {stop|start|status}"
    exit 1
    ;;
esac
