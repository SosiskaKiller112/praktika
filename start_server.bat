@echo off
:: ==============================================
:: Локальный HTTP Сервер - Проект 213
:: Версия 1.1
:: ==============================================

:: Настройки окружения
set SERVER_SCRIPT=server.py
set PYTHON_URL=https://www.python.org/downloads/
set PORT=8000
set TIMEOUT=5

:: Инициализация
chcp 65001 >nul
title Локальный HTTP Сервер - Проект 213
color 0A

:: Функция для вывода заголовка
:show_header
echo.
echo ========================================
echo    🚀 ЗАПУСК ЛОКАЛЬНОГО СЕРВЕРА
echo ========================================
echo.
goto :eof

:: Функция для вывода сообщения об ошибке
:show_error
echo ❌ ОШИБКА: %*
exit /b 1

:: Функция для проверки зависимостей
:check_dependencies
:: Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    call :show_header
    echo ❌ Python не найден на этом компьютере!
    echo.
    echo 💡 Рекомендации:
    echo 1. Установите Python с официального сайта: %PYTHON_URL%
    echo 2. Убедитесь, что добавили Python в PATH при установке
    echo 3. После установки перезапустите командную строку
    echo.
    pause
    call :show_error "Требуется установка Python"
)

:: Проверяем наличие файла сервера
if not exist "%SERVER_SCRIPT%" (
    call :show_header
    call :show_error "Файл сервера '%SERVER_SCRIPT%' не найден в текущей директории"
)

echo ✅ Python найден
echo ✅ Файл сервера обнаружен
goto :eof

:: Основной код
call :show_header
call :check_dependencies

echo 📁 Текущая директория: %cd%
echo 🌐 Запускаю сервер на порту %PORT%...
echo ⏳ Таймаут подключения: %TIMEOUT% сек
echo 🖥️ Исполняемый файл: %SERVER_SCRIPT%
echo.

:: Проверяем, занят ли порт
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% == 0 (
    echo ⚠️ Внимание: Порт %PORT% уже занят!
    echo.
    choice /c YN /m "Попробовать запустить сервер несмотря на это? (Y/N)"
    if %errorlevel% == 2 (
        exit /b 0
    )
    echo.
)

:: Запускаем сервер с обработкой CTRL+C
echo 🏁 Запускаю сервер... (для остановки нажмите CTRL+C)
echo ========================================
echo.

python "%SERVER_SCRIPT%" %PORT%

:: Завершение работы
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Сервер завершил работу с ошибкой (код: %errorlevel%)
) else (
    echo.
    echo 🏁 Сервер остановлен по запросу пользователя
)

echo.
pause
