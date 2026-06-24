#!/usr/bin/env bash
# Seed catégories produit e-commerce sur prod/preprod via API admin.
#
# Usage :
#   ADMIN_EMAIL=admin@laplasse.ci ADMIN_PASSWORD=xxx ./scripts/seed-product-categories-remote.sh preprod
#   ADMIN_EMAIL=... ADMIN_PASSWORD=... ./scripts/seed-product-categories-remote.sh prod
set -euo pipefail

ENV="${1:-prod}"
case "$ENV" in
  preprod) API_URL="${API_URL:-https://api-preprod.178.105.113.184.sslip.io/api}" ;;
  prod)    API_URL="${API_URL:-https://api.178.105.113.184.sslip.io/api}" ;;
  *) echo "Usage: $0 {preprod|prod}"; exit 1 ;;
esac

ADMIN_EMAIL="${ADMIN_EMAIL:?Définir ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Définir ADMIN_PASSWORD}"

jar=$(mktemp)
trap 'rm -f "$jar"' EXIT

echo "→ Login admin ($ENV)..."
curl -sS -c "$jar" -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | head -c 200
echo ""

echo "→ Seed catégories produit..."
curl -sS -b "$jar" -X POST "$API_URL/admin/seed-product-categories" \
  -H 'Content-Type: application/json'
echo ""
echo "✓ Terminé ($ENV)."
