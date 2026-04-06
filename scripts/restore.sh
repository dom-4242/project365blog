#!/usr/bin/env bash
set -euo pipefail

# ============================================
# restore.sh — PostgreSQL Restore für Project365Blog
#
# Stellt ein Backup in die laufende Datenbank wieder her.
#
# Verwendung:
#   ./scripts/restore.sh                          # Listet verfügbare Backups
#   ./scripts/restore.sh backup_2026-04-06_020000.sql.gz
#   ./scripts/restore.sh /pfad/zum/backup.sql.gz
# ============================================

BACKUP_DIR="${BACKUP_DIR:-/container/project365blog/backups}"
CONTAINER="${CONTAINER:-project365blog-db-1}"
DB_USER="${DB_USER:-project365}"
DB_NAME="${DB_NAME:-project365blog}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] FEHLER: $*" >&2
    exit 1
}

# ---- Verfügbare Backups anzeigen wenn kein Argument ----

if [[ $# -eq 0 ]]; then
    echo ""
    echo "Verwendung: $0 <backup-datei>"
    echo ""
    echo "Verfügbare Backups in ${BACKUP_DIR}:"
    echo ""
    if ls -lht "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null; then
        echo ""
        echo "Tipp: Dateinamen oder vollen Pfad angeben."
    else
        echo "  (keine Backups gefunden)"
    fi
    echo ""
    exit 0
fi

# ---- Backup-Datei bestimmen ----

BACKUP_ARG="$1"

# Relativer Dateiname → BACKUP_DIR voranstellen
if [[ ! "${BACKUP_ARG}" == /* ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_ARG}"
else
    BACKUP_FILE="${BACKUP_ARG}"
fi

[[ -f "${BACKUP_FILE}" ]] || error "Backup-Datei nicht gefunden: ${BACKUP_FILE}"

BACKUP_NAME=$(basename "${BACKUP_FILE}")
BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)

# ---- Sicherheitsabfrage ----

echo ""
echo "========================================================"
echo "  ACHTUNG: Datenbank-Restore"
echo "========================================================"
echo ""
echo "  Backup-Datei : ${BACKUP_NAME}"
echo "  Grösse       : ${BACKUP_SIZE}"
echo "  Ziel-DB      : ${DB_NAME} im Container ${CONTAINER}"
echo ""
echo "  WARNUNG: Alle aktuellen Daten werden ÜBERSCHRIEBEN!"
echo "  Stelle sicher, dass die App gestoppt ist (optional):"
echo "    docker compose stop web"
echo ""
read -rp "Restore wirklich starten? (ja/nein): " CONFIRM

if [[ "${CONFIRM}" != "ja" ]]; then
    echo "Abgebrochen."
    exit 0
fi

# ---- Restore durchführen ----

log "Starte Restore aus ${BACKUP_NAME} ..."

# Bestehende Verbindungen trennen und DB neu erstellen
log "Trenne bestehende Verbindungen ..."
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

log "Lösche Datenbank ${DB_NAME} ..."
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "DROP DATABASE IF EXISTS ${DB_NAME};" > /dev/null

log "Erstelle Datenbank ${DB_NAME} neu ..."
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" > /dev/null

log "Lade Backup in die Datenbank ..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" > /dev/null

log "Restore abgeschlossen."
echo ""
echo "========================================================"
echo "  Restore erfolgreich!"
echo ""
echo "  Nächste Schritte:"
echo "  1. Prisma Migrations prüfen/anwenden:"
echo "     docker compose exec web npx prisma migrate deploy"
echo "  2. App starten (falls gestoppt):"
echo "     docker compose start web"
echo "========================================================"
echo ""
