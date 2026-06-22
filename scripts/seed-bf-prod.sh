#!/usr/bin/env bash
# Seed marchands BF (et verticals) sur prod/preprod via API admin.
# Prérequis : compte ADMIN, cookie session ou token.
#
# Usage :
#   ADMIN_EMAIL=admin@laplasse.ci ADMIN_PASSWORD=xxx API_URL=https://api... ./scripts/seed-bf-prod.sh
#   ./scripts/seed-bf-prod.sh BF   # défaut BF
set -euo pipefail

COUNTRY="${1:-BF}"
API_URL="${API_URL:-https://api.178.105.113.184.sslip.io/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:?Définir ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Définir ADMIN_PASSWORD}"

jar=$(mktemp)
trap 'rm -f "$jar"' EXIT

echo "→ Login admin..."
curl -sS -c "$jar" -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | head -c 200
echo ""

echo "→ Seed multipays ($COUNTRY)..."
curl -sS -b "$jar" -X POST "$API_URL/admin/seed-multipays?country=$COUNTRY" \
  -H 'Content-Type: application/json'
echo ""

echo "→ Sync Meilisearch..."
curl -sS -b "$jar" -X POST "$API_URL/admin/sync-search" \
  -H 'Content-Type: application/json'
echo ""

echo "✓ Terminé."
