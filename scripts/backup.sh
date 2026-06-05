#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LaPlasse — Backup PostgreSQL
# Usage : ./scripts/backup.sh [restore <file>]
# Cron  : 0 3 * * * /path/to/laplasse/scripts/backup.sh >> /var/log/laplasse-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
DB_NAME="${POSTGRES_DB:-laplasse_db}"
DB_USER="${POSTGRES_USER:-laplasse}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5433}"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# ── Restore mode ─────────────────────────────────────────────────────────────
if [[ "${1:-}" == "restore" ]]; then
  FILE="${2:-}"
  if [[ -z "$FILE" ]]; then
    echo "Usage: $0 restore <backup_file.sql.gz>"
    exit 1
  fi
  if [[ ! -f "$FILE" ]]; then
    echo "ERROR: fichier introuvable: $FILE"
    exit 1
  fi
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Restauration depuis $FILE..."
  gunzip -c "$FILE" | PGPASSWORD="${POSTGRES_PASSWORD:-laplasse_dev}" \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✅ Restauration terminée"
  exit 0
fi

# ── Backup mode ──────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/laplasse_${TIMESTAMP}.sql.gz"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Début backup → $FILE"

PGPASSWORD="${POSTGRES_PASSWORD:-laplasse_dev}" \
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    --format=plain --no-owner --no-acl \
    "$DB_NAME" | gzip > "$FILE"

SIZE=$(du -sh "$FILE" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ✅ Backup créé — $SIZE — $(basename "$FILE")"

# ── Nettoyage (rétention 30 jours) ───────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "laplasse_*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] 🗑  $DELETED ancien(s) backup(s) supprimé(s)"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup terminé."
