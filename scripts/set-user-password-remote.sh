#!/usr/bin/env bash
# Définit un mot de passe utilisateur via l'API admin (prod ou preprod).
# Usage: ./scripts/set-user-password-remote.sh preprod owner3@laplasse.ci 'Yale2026!'
set -euo pipefail

ENV="${1:?preprod|prod}"
EMAIL="${2:?email}"
PASSWORD="${3:?password}"

case "$ENV" in
  preprod) API="https://api-preprod.178.105.113.184.sslip.io/api" ;;
  prod)    API="https://api.178.105.113.184.sslip.io/api" ;;
  *) echo "Env inconnu: $ENV"; exit 1 ;;
esac

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@laplasse.ci}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin2026!}"
JAR=$(mktemp)

curl -sS -c "$JAR" -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" >/dev/null

curl -sS -b "$JAR" -X POST "$API/admin/users/set-password" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

rm -f "$JAR"
echo
