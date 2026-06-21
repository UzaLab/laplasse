#!/usr/bin/env bash
# Smoke tests — critères « Burkina ready » (§11.12 ROADMAP)
# Usage: API_URL=https://api.example.com ./scripts/smoke-burkina-ready.sh

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001/api}"
BF_HEADER="X-LaPlasse-Country: BF"
CI_HEADER="X-LaPlasse-Country: CI"
PASS=0
FAIL=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "true" ]]; then
    echo "✅ $name"
    PASS=$((PASS + 1))
  else
    echo "❌ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Smoke Burkina ready — $API_URL ==="
echo

# Health
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
check "API health" "$([[ "$HTTP" == "200" ]] && echo true || echo false)"

# Geo BF — Ouagadougou
CITIES=$(curl -sS -H "$BF_HEADER" "$API_URL/geo/cities")
HAS_OUAGA=$(echo "$CITIES" | grep -ci ouagadougou || true)
check "Geo BF — Ouagadougou présent" "$([[ "$HAS_OUAGA" -gt 0 ]] && echo true || echo false)"

COMMUNES=$(curl -sS -H "$BF_HEADER" "$API_URL/geo/cities/ouagadougou/communes")
HAS_GOUNGHIN=$(echo "$COMMUNES" | grep -ci gounghin || true)
check "Geo BF — commune Gounghin" "$([[ "$HAS_GOUNGHIN" -gt 0 ]] && echo true || echo false)"

# Search scoped BF — no CI-only leakage (heuristic: Cocody absent)
SEARCH_BF=$(curl -sS -H "$BF_HEADER" "$API_URL/search?q=restaurant&limit=20")
COCODY_IN_BF=$(echo "$SEARCH_BF" | grep -ci cocody || true)
check "Search BF — pas de résultat Cocody" "$([[ "$COCODY_IN_BF" -eq 0 ]] && echo true || echo false)"

# Marketplace products scoped BF
PRODUCTS_BF=$(curl -sS -H "$BF_HEADER" "$API_URL/marketplace/products?limit=5")
check "Marketplace BF — endpoint répond" "$([[ -n "$PRODUCTS_BF" ]] && echo true || echo false)"

# Merchants featured CI vs BF differ (if both have data)
MERCHANTS_CI=$(curl -sS -H "$CI_HEADER" "$API_URL/merchants/featured?limit=5")
MERCHANTS_BF=$(curl -sS -H "$BF_HEADER" "$API_URL/merchants/featured?limit=5")
check "Merchants featured — endpoints pays" "$([[ -n "$MERCHANTS_CI" && -n "$MERCHANTS_BF" ]] && echo true || echo false)"

echo
echo "=== Résultat : $PASS OK, $FAIL échec(s) ==="
[[ "$FAIL" -eq 0 ]]
