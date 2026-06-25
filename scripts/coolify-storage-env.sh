#!/usr/bin/env bash
# Configure les variables stockage Hetzner sur Coolify (sans les secrets S3).
# Les clés S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY doivent être ajoutées
# manuellement dans Coolify (Runtime only + Is Literal).
#
# Usage (après génération des tokens Hetzner) :
#   COOLIFY_TOKEN=xxx S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... ./scripts/coolify-storage-env.sh preprod
#   COOLIFY_TOKEN=xxx S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... ./scripts/coolify-storage-env.sh prod
#   COOLIFY_TOKEN=xxx ./scripts/coolify-storage-env.sh preprod-dry   # sans secrets
#
# Doc : Docs/STORAGE_HETZNER.md
set -euo pipefail

COOLIFY_HOST="${COOLIFY_HOST:-http://178.105.113.184:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:?Définir COOLIFY_TOKEN}"

API_PREPROD="z145ag9pnpqb0y864cwodsfk"
API_PROD="iaai1jhevil8prxsusoptfin"
WEB_PREPROD="i5nviaj74152319gctpeyq27"
WEB_PROD="pn73rp4w4dk0wyxfazyk0se0"
MEDIA_PREPROD="b81wyf4n0rszw1blm8s6i5pi"
MEDIA_PROD="mdgzdgfso4hykfv5v0fxghvx"

R2_ENDPOINT="${R2_ENDPOINT:-https://fsn1.your-objectstorage.com}"
R2_REGION="${R2_REGION:-fsn1}"

set_env() {
  local app_uuid="$1" key="$2" value="$3" build="${4:-false}" runtime="${5:-true}"
  curl -sS --max-time 20 -X POST "$COOLIFY_HOST/api/v1/applications/$app_uuid/envs" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"is_buildtime\":$build,\"is_runtime\":$runtime}" \
    >/dev/null
  echo "  ✓ $key"
}

apply_api_vars() {
  local uuid="$1" bucket="$2" public_url="$3"
  echo "API $uuid"
  set_env "$uuid" "STORAGE_PROVIDER" "s3"
  set_env "$uuid" "R2_ENDPOINT" "$R2_ENDPOINT"
  set_env "$uuid" "R2_REGION" "$R2_REGION"
  set_env "$uuid" "R2_BUCKET_NAME" "$bucket"
  set_env "$uuid" "R2_PUBLIC_URL" "$public_url"
  if [[ -n "${S3_ACCESS_KEY_ID:-}" ]]; then
    set_env "$uuid" "S3_ACCESS_KEY_ID" "$S3_ACCESS_KEY_ID"
    set_env "$uuid" "S3_SECRET_ACCESS_KEY" "${S3_SECRET_ACCESS_KEY:?}"
  else
    echo "  ⚠ S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY non fournis — à ajouter dans Coolify"
  fi
}

apply_web_vars() {
  local uuid="$1" public_url="$2"
  echo "Web $uuid"
  set_env "$uuid" "NEXT_PUBLIC_MEDIA_URL" "$public_url" true true
}

TARGET="${1:-}"

case "$TARGET" in
  preprod|preprod-dry)
    apply_api_vars "$API_PREPROD" "laplasse-preprod" "https://media-preprod.laplasse.tech"
    apply_web_vars "$WEB_PREPROD" "https://media-preprod.laplasse.tech"
    echo ""
    echo "Ensuite :"
    echo "  1. DNS A media-preprod → 178.105.113.184 (Cloudflare proxy OK)"
    echo "  2. Deploy laplasse-media-preprod ($MEDIA_PREPROD) dans Coolify"
    echo "  3. COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh api-preprod"
    echo "  4. COOLIFY_TOKEN=xxx ./scripts/coolify-deploy.sh web-preprod"
    ;;
  prod)
    apply_api_vars "$API_PROD" "laplasse-prod" "https://media.laplasse.tech"
    apply_web_vars "$WEB_PROD" "https://media.laplasse.tech"
    echo ""
    echo "Ensuite :"
    echo "  1. Monter nginx-prod.conf sur laplasse-media-prod ($MEDIA_PROD)"
    echo "  2. DNS A media → 178.105.113.184"
    echo "  3. Deploy media-prod + api-prod + web-prod"
    ;;
  *)
    echo "Usage: $0 {preprod|preprod-dry|prod}"
    exit 1
    ;;
esac
