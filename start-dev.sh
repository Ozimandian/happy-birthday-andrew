#!/bin/bash
# УБЕЖИЩЕ 18 — Автозапуск production сервера
# Этот скрипт запускается при старте sandbox

cd /home/z/my-project

# Если production build существует — запускаем сразу
if [ -f ".next/standalone/server.js" ]; then
    echo "Starting production server..."
    bash deploy.sh
else
    echo "No production build found. Building..."
    bun run build
    cp -r public .next/standalone/public
    cp -r .next/static .next/standalone/.next/static
    bash deploy.sh
fi
