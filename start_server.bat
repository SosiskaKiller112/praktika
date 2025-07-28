@echo off
chcp 65001 >nul
title Локальный HTTP Сервер - Проект 213

echo.
echo ========================================
echo    🚀 ЗАПУСК ЛОКАЛЬНОГО СЕРВЕРА
echo ========================================
echo.

:: Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    echo 💡 Установите Python с https://python.org
    echo.
    pause
    exit /b 1
)

echo ✅ Python найден
echo 📁 Запускаю сервер в текущей папке...
echo.

:: Запускаем Python скрипт
python server.py

echo.
echo 🛑 Сервер остановлен
pause 
