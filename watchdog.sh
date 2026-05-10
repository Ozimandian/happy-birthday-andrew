#!/bin/bash
# ============================================================
# УБЕЖИЩЕ 18 — Production Watchdog
# ============================================================
# Следит что сервер жив и перезапускает если упал
# Запускается через cron или в фоне
# ============================================================

PROJECT_DIR="/home/z/my-project"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"
PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/production.log"
PORT=3000

# Проверяем жив ли процесс
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        # Процесс жив, проверяем HTTP
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "000")
        if [ "$HTTP" = "200" ]; then
            # Всё ок, не перезапускаем
            exit 0
        fi
    fi
fi

# Сервер мёртв — перезапуск
echo "[$(date)] Server down, restarting..." >> "$LOG_FILE"

# Убить всё что могло остаться
pkill -f "node server.js" 2>/dev/null || true
sleep 1

# Запуск
cd "$STANDALONE_DIR"
nohup node server.js >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
sleep 2

# Проверка
if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "[$(date)] Restarted! PID=$NEW_PID" >> "$LOG_FILE"
else
    echo "[$(date)] CRITICAL: Restart failed!" >> "$LOG_FILE"
fi
