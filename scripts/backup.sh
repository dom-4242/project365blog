#!/usr/bin/env bash
set -euo pipefail

# ============================================
# backup.sh — PostgreSQL Backup für Project365Blog
#
# Erstellt ein komprimiertes Backup der Datenbank und rotiert alte Backups.
# Rotation: Letzte 7 tägliche + 4 wöchentliche + 3 monatliche Backups.
#
# Cron-Setup auf dem HomeLab Host (täglich um 02:00):
#   0 2 * * * /container/project365blog/scripts/backup.sh >> /var/log/project365blog-backup.log 2>&1
#
# Optional: Healthcheck-URL als Umgebungsvariable setzen:
#   HEALTHCHECK_URL=https://hc-ping.com/your-uuid /container/.../backup.sh
# ============================================

BACKUP_DIR="${BACKUP_DIR:-/container/project365blog/backups}"
CONTAINER="${CONTAINER:-project365blog-db-1}"
DB_USER="${DB_USER:-project365}"
DB_NAME="${DB_NAME:-project365blog}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ---- Backup erstellen ----

mkdir -p "${BACKUP_DIR}"

log "Starte Backup → ${BACKUP_FILE}"

if ! docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
    log "FEHLER: Backup fehlgeschlagen!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "Backup erstellt (${SIZE})"

# ---- Rotation ----
# Behalte:
#   - Letzte 7 Backups (täglich)
#   - 1 Backup pro Woche für die letzten 4 Wochen (8–35 Tage alt)
#   - 1 Backup pro Monat für die letzten 3 Monate (36–92 Tage alt)
#   - Alles Ältere wird gelöscht

rotate_backups() {
    local dir="$1"
    local all_files
    mapfile -t all_files < <(ls -1 "${dir}"/backup_*.sql.gz 2>/dev/null | sort -r)

    local keep=()
    local seen_weeks=()
    local seen_months=()
    local count=0
    local now_epoch
    now_epoch=$(date +%s)

    for f in "${all_files[@]}"; do
        local filename file_date file_epoch days_old week_key month_key
        filename=$(basename "$f")
        file_date="${filename:7:10}"  # YYYY-MM-DD aus backup_YYYY-MM-DD_HHMMSS.sql.gz
        file_epoch=$(date -d "${file_date}" +%s 2>/dev/null) || continue
        days_old=$(( (now_epoch - file_epoch) / 86400 ))
        count=$((count + 1))

        if [[ ${count} -le 7 ]]; then
            keep+=("$f")
            continue
        fi

        week_key=$(date -d "${file_date}" +%G-%V)
        month_key=$(date -d "${file_date}" +%Y-%m)

        if [[ ${days_old} -le 35 ]]; then
            # Wöchentlich: 1 Backup pro Woche behalten
            if [[ ! " ${seen_weeks[*]} " =~ " ${week_key} " ]]; then
                seen_weeks+=("${week_key}")
                keep+=("$f")
            fi
        elif [[ ${days_old} -le 92 ]]; then
            # Monatlich: 1 Backup pro Monat behalten
            if [[ ! " ${seen_months[*]} " =~ " ${month_key} " ]]; then
                seen_months+=("${month_key}")
                keep+=("$f")
            fi
        fi
        # Älter als 92 Tage: nicht in keep → wird gelöscht
    done

    for f in "${all_files[@]}"; do
        if [[ ! " ${keep[*]} " =~ " ${f} " ]]; then
            log "Rotation: Lösche $(basename "${f}")"
            rm "${f}"
        fi
    done

    log "Rotation abgeschlossen. Aktuelle Backups (${#keep[@]}):"
    ls -lh "${dir}"/backup_*.sql.gz 2>/dev/null | awk '{print "  " $5 "  " $9}' || true
}

rotate_backups "${BACKUP_DIR}"

# ---- Optional: Healthcheck-Ping ----

if [[ -n "${HEALTHCHECK_URL}" ]]; then
    if curl -fsS --max-time 10 --retry 3 "${HEALTHCHECK_URL}" > /dev/null 2>&1; then
        log "Healthcheck-Ping gesendet."
    else
        log "WARNUNG: Healthcheck-Ping fehlgeschlagen (Backup selbst war erfolgreich)."
    fi
fi

log "Backup abgeschlossen."
