#!/bin/bash
# УБЕЖИЩЕ 18 — Respawn watchdog
# Бесконечный цикл с перезапуском production сервера

cd /home/z/my-project

while true; do
    bash watchdog.sh
    sleep 30
done
