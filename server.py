#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Локальный HTTP сервер для разработки с расширенными возможностями

Особенности:
- Поддержка CORS для разработки API
- Обработка одностраничных приложений (SPA)
- Логирование запросов
- Поддержка нескольких сетевых интерфейсов
- Автоматический поиск свободного порта
- Более информативный вывод
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import socket
from pathlib import Path
from datetime import datetime
from urllib.parse import unquote

class DevRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный обработчик запросов с дополнительными функциями"""
    
    # Включить подробное логирование
    verbose = True
    
    # Настройки CORS
    cors_enabled = True
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    # Настройки для SPA (возвращать index.html для неизвестных путей)
    spa_mode = False
    
    def end_headers(self):
        """Добавляем CORS заголовки к каждому ответу"""
        if self.cors_enabled:
            for key, value in self.cors_headers.items():
                self.send_header(key, value)
        super().end_headers()
    
    def do_OPTIONS(self):
        """Обработка CORS preflight запросов"""
        self.send_response(204)
        self.end_headers()
    
    def log_request(self, code='-', size='-'):
        """Кастомизируем логирование запросов"""
        if self.verbose:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            client_ip = self.client_address[0]
            method = self.command
            path = unquote(self.path)
            
            print(f"[{timestamp}] {client_ip} - {method} {path} -> {code}")

def get_local_ips():
    """Получаем список локальных IP-адресов"""
    ips = ['localhost']
    try:
        hostname = socket.gethostname()
        ips.append(hostname)
        ips.extend(
            addr for addr in 
            socket.gethostbyname_ex(socket.gethostname())[2] 
            if not addr.startswith('127.')
        )
    except:
        pass
    return ips

def find_free_port(start_port=3000, max_attempts=100):
    """Находим свободный порт, начиная с start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socketserver.TCPServer(('', port), DevRequestHandler):
                return port
        except OSError:
            continue
    return None

def print_server_info(port, root_dir):
    """Выводим информацию о запущенном сервере"""
    print("\n" + "=" * 50)
    print(f"🚀 Сервер запущен".center(50))
    print("=" * 50)
    
    print(f"\n📁 Рабочая директория: {root_dir}")
    print(f"\n🌐 Доступные адреса:")
    
    for ip in get_local_ips():
        print(f"  → http://{ip}:{port}")
    
    if 'localhost' in get_local_ips():
        print("\n🔗 Рекомендуемая ссылка: http://localhost:{port}")
    
    print("\n⚙️  Настройки:")
    print(f"  - CORS: {'включено' if DevRequestHandler.cors_enabled else 'выключено'}")
    print(f"  - SPA режим: {'включен' if DevRequestHandler.spa_mode else 'выключен'}")
    print(f"  - Логирование: {'включено' if DevRequestHandler.verbose else 'выключено'}")
    
    print("\n⏹️  Для остановки сервера нажмите Ctrl+C")
    print("=" * 50 + "\n")

def main():
    # Конфигурация сервера
    DEFAULT_PORT = 3000
    MAX_PORT_ATTEMPTS = 100
    
    # Получаем путь к текущей директории
    root_dir = Path(__file__).parent.absolute()
    
    # Переходим в директорию со скриптом
    os.chdir(root_dir)
    
    # Пытаемся найти свободный порт
    port = find_free_port(DEFAULT_PORT, MAX_PORT_ATTEMPTS)
    if port is None:
        print(f"❌ Не удалось найти свободный порт в диапазоне {DEFAULT_PORT}-{DEFAULT_PORT+MAX_PORT_ATTEMPTS-1}")
        sys.exit(1)
    
    # Создаем HTTP сервер
    try:
        with socketserver.TCPServer(("", port), DevRequestHandler) as httpd:
            # Выводим информацию о сервере
            print_server_info(port, root_dir)
            
            # Открываем браузер автоматически
            try:
                webbrowser.open(f"http://localhost:{port}")
            except:
                print("⚠️ Не удалось открыть браузер автоматически")
            
            # Запускаем сервер
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n🛑 Сервер остановлен")
                sys.exit(0)
                
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Ошибка: Порт {port} уже занят!")
            print(f"💡 Попробуйте другой порт или остановите процесс на порту {port}")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
