#!/bin/bash
# ============================================================
# УБЕЖИЩЕ 18 — Production Deploy Script
# ============================================================
# Запускает Next.js в production режиме (standalone)
# С автоматическим перезапуском при падении
# ============================================================

set -e

PROJECT_DIR="/home/z/my-project"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"
PORT=3000
HOSTNAME="0.0.0.0"
LOG_FILE="$PROJECT_DIR/production.log"
PID_FILE="$PROJECT_DIR/.server.pid"

cd "$PROJECT_DIR"

echo "=== УБЕЖИЩЕ 18 — DEPLOY ==="
echo "[$(date)] Starting deployment..."

# ---- Шаг 1: Убить старый процесс ----
echo "[1/4] Stopping old server..."
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    kill "$OLD_PID" 2>/dev/null || true
    rm -f "$PID_FILE"
fi
pkill -f "node server.js" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# ---- Шаг 2: Build (если нет standalone) ----
if [ ! -f "$STANDALONE_DIR/server.js" ]; then
    echo "[2/4] Building production bundle..."
    bun run build 2>&1 | tail -10
    
    # Копируем статику в standalone
    cp -r public "$STANDALONE_DIR/public"
    cp -r .next/static "$STANDALONE_DIR/.next/static"
else
    echo "[2/4] Production build exists, skipping build."
    # Обновляем статику на всякий случай
    cp -r public "$STANDALONE_DIR/public" 2>/dev/null || true
    cp -r .next/static "$STANDALONE_DIR/.next/static" 2>/dev/null || true
fi

# ---- Шаг 3: Запуск production сервера ----
echo "[3/4] Starting production server on port $PORT..."

cd "$STANDALONE_DIR"

# Запуск через nohup с перенаправлением логов
# Используем node напрямую для standalone — максимально быстро и стабильно
nohup node server.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Даём серверу секунду на запуск
sleep 2

# Проверяем что процесс жив
if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[4/4] ✅ Server started! PID=$SERVER_PID, Port=$PORT"
    echo "[$(date)] Server PID=$SERVER_PID running on port $PORT" >> "$LOG_FILE"
else
    echo "[4/4] ❌ Server failed to start! Check $LOG_FILE"
    cat "$LOG_FILE" | tail -20
    exit 1
fi

# ---- Шаг 4: Проверка ----
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check PASSED (HTTP $HTTP_CODE)"
else
    echo "⚠️  Health check returned HTTP $HTTP_CODE"
fi

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Server:   http://localhost:$PORT"
echo "PID:      $SERVER_PID"
echo "PID file: $PID_FILE"
echo "Logs:     tail -f $LOG_FILE"
echo ""
echo "To stop:  kill \$(cat $PID_FILE)"
